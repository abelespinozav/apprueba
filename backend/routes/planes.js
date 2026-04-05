const express = require('express')
const router = express.Router()
const pool = require('../db')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const parts = []

    for (const file of (req.files || [])) {
      try {
        const data = fs.readFileSync(file.path)
        parts.push({ inlineData: { mimeType: file.mimetype, data: data.toString('base64') } })
        fs.unlinkSync(file.path)
      } catch (e) { console.error('Error leyendo archivo:', e) }
    }

    const prompt = `Eres un tutor académico experto. Crea un plan de estudio detallado para un estudiante universitario.

Evaluación: "${nombre_evaluacion}"
Ramo: "${nombre_ramo}"
Días restantes: ${dias_restantes || 'no especificado'}
Ponderación en el ramo: ${ponderacion}%
${req.files?.length > 0 ? `Material de estudio adjunto: ${req.files.length} archivo(s)` : 'Sin material adjunto'}

Genera exactamente 5 tareas de estudio priorizadas. Responde SOLO con JSON válido, sin markdown, sin explicaciones:
{
  "resumen": "Resumen breve del plan en 2-3 oraciones",
  "tareas": [
    {
      "nombre": "Nombre corto de la tarea",
      "prioridad": "alta|media|baja",
      "descripcion": "Descripción detallada de qué estudiar y cómo",
      "tiempo_estimado": "X horas",
      "guia": "Guía detallada paso a paso para completar esta tarea (mínimo 150 palabras)"
    }
  ]
}`

    parts.unshift({ text: prompt })
    const result = await model.generateContent(parts)
    const text = result.response.text().trim()
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
