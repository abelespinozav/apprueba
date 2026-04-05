const express = require('express')
const router = express.Router()
const pool = require('../db')
const { GoogleGenAI } = require('@google/genai')
const multer = require('multer')
const fs = require('fs')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 20 * 1024 * 1024 } })

// GET plan de una evaluación
router.get('/:evaluacion_id', async (req, res) => {
  const { id } = req.user
  const { evaluacion_id } = req.params
  try {
    const r = await pool.query(
      'SELECT * FROM planes_estudio WHERE evaluacion_id = $1 AND usuario_id = $2',
      [evaluacion_id, id]
    )
    if (r.rows.length === 0) return res.json(null)
    const plan = r.rows[0]
    const tareas = await pool.query(
      'SELECT * FROM tareas_plan WHERE plan_id = $1 ORDER BY orden ASC',
      [plan.id]
    )
    res.json({ ...plan, tareas: tareas.rows })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener plan' }) }
})

// POST generar plan con IA
router.post('/generar', upload.array('archivos', 5), async (req, res) => {
  const { id } = req.user
  const { evaluacion_id, nombre_evaluacion, nombre_ramo, dias_restantes, ponderacion } = req.body
  try {
    const contents = []

    for (const file of (req.files || [])) {
      try {
        const data = fs.readFileSync(file.path)
        contents.push({ inlineData: { mimeType: file.mimetype, data: data.toString('base64') } })
        fs.unlinkSync(file.path)
      } catch (e) { console.error('Error leyendo archivo:', e) }
    }

    const tieneArchivos = (req.files?.length || 0) > 0

    const prompt = `Eres un tutor académico experto y riguroso. Tu misión es crear un plan de estudio PROFUNDO y DETALLADO para un estudiante universitario.

CONTEXTO:
- Evaluación: "${nombre_evaluacion}"
- Ramo: "${nombre_ramo}"
- Días restantes: ${dias_restantes || 'no especificado'}
- Ponderación en el ramo: ${ponderacion}%
${tieneArchivos ? `- Material de estudio adjunto: ${req.files.length} archivo(s). DEBES basar el plan EXCLUSIVAMENTE en el contenido de estos archivos.` : '- Sin material adjunto: genera el plan basado en el temario típico universitario del ramo.'}

INSTRUCCIONES CRÍTICAS:
${tieneArchivos ? `
1. LEE el material adjunto COMPLETO antes de generar el plan.
2. VERIFICA que el material sea coherente con el ramo "${nombre_ramo}". Si no lo es, indícalo claramente en el resumen.
3. Cada tarea DEBE referenciar páginas específicas del material (ej: "Ver páginas 12-18", "Ejercicios resueltos en p.34").
4. La guía de cada tarea debe incluir:
   - Conceptos clave extraídos TEXTUALMENTE o parafraseados del material con su página
   - Ejercicios o ejemplos específicos del material (con número de ejercicio y página)
   - Definiciones importantes con su página de referencia
   - Fórmulas o teoremas relevantes con su página
   - Qué secciones leer primero y en qué orden (con páginas)
5. NO inventes contenido que no esté en el material adjunto.
` : `
1. Genera contenido basado en el temario universitario estándar del ramo "${nombre_ramo}".
2. Incluye conceptos clave, definiciones, ejemplos prácticos y ejercicios tipo.
3. La guía debe ser detallada con pasos concretos de estudio.
`}

Genera exactamente 5 tareas de estudio priorizadas por importancia para la evaluación.
Responde SOLO con JSON válido, sin markdown, sin texto adicional:
{
  "resumen": "Resumen ejecutivo del plan: qué cubre el material, qué temas son más importantes para la evaluación y cómo está estructurado el plan. Si el material no coincide con el ramo, explícalo aquí. Mínimo 4 oraciones.",
  "tareas": [
    {
      "nombre": "Nombre descriptivo y específico de la tarea",
      "prioridad": "alta|media|baja",
      "descripcion": "Descripción concreta de qué estudiar, qué temas abarca y por qué es importante para la evaluación. Mínimo 3 oraciones.",
      "tiempo_estimado": "X horas",
      "guia": "GUÍA DETALLADA DE ESTUDIO:\\n\\n1. DÓNDE ESTUDIAR:\\n[Indica secciones y páginas exactas del material, ej: 'Comienza con la sección 2.1 (pp. 45-52)']\\n\\n2. CONCEPTOS CLAVE:\\n[Lista los conceptos fundamentales con su definición y página de referencia, ej: '• Concepto X (p.47): definición...']\\n\\n3. FÓRMULAS Y TEOREMAS:\\n[Lista las fórmulas/teoremas importantes con su página, ej: '• Teorema 3.2 (p.89): enunciado...']\\n\\n4. EJERCICIOS A RESOLVER:\\n[Indica ejercicios específicos del material con su número y página, ej: 'Resuelve los ejercicios 2.3, 2.5 y 2.8 (pp. 60-63)']\\n\\n5. ESTRATEGIA DE ESTUDIO:\\n[Pasos concretos: qué leer primero, qué memorizar, qué practicar, cómo autoevaluarse]\\n\\n6. ERRORES COMUNES:\\n[Menciona los errores típicos en este tema y cómo evitarlos]"
    }
  ]
}`

    contents.push({ text: prompt })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: contents }]
    })

    const text = response.text.trim()
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const planData = JSON.parse(jsonStr)

    const existing = await pool.query(
      'SELECT id FROM planes_estudio WHERE evaluacion_id = $1 AND usuario_id = $2',
      [evaluacion_id, id]
    )

    let planId
    if (existing.rows.length > 0) {
      planId = existing.rows[0].id
      await pool.query('UPDATE planes_estudio SET resumen = $1, updated_at = NOW() WHERE id = $2', [planData.resumen, planId])
      await pool.query('DELETE FROM tareas_plan WHERE plan_id = $1', [planId])
    } else {
      const ins = await pool.query(
        'INSERT INTO planes_estudio (usuario_id, evaluacion_id, resumen) VALUES ($1, $2, $3) RETURNING id',
        [id, evaluacion_id, planData.resumen]
      )
      planId = ins.rows[0].id
    }

    for (let i = 0; i < planData.tareas.length; i++) {
      const t = planData.tareas[i]
      await pool.query(
        'INSERT INTO tareas_plan (plan_id, nombre, prioridad, descripcion, tiempo_estimado, guia, orden) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [planId, t.nombre, t.prioridad, t.descripcion, t.tiempo_estimado, t.guia, i]
      )
    }

    const tareas = await pool.query('SELECT * FROM tareas_plan WHERE plan_id = $1 ORDER BY orden ASC', [planId])
    res.json({ id: planId, resumen: planData.resumen, tareas: tareas.rows })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error generando plan: ' + e.message }) }
})

// PATCH marcar tarea completada
router.patch('/tarea/:tarea_id', async (req, res) => {
  const { tarea_id } = req.params
  const { completada } = req.body
  try {
    await pool.query('UPDATE tareas_plan SET completada = $1 WHERE id = $2', [completada, tarea_id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: 'Error actualizando tarea' }) }
})

module.exports = router
