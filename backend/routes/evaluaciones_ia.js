const express = require('express')
const router = express.Router()
const pool = require('../db')
const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// POST generar preguntas de evaluación
router.post('/generar/:plan_id', async (req, res) => {
  const { id } = req.user
  const { plan_id } = req.params
  try {
    // Obtener contexto del plan
    const plan = await pool.query(
      'SELECT pe.*, e.nombre as eval_nombre, e.ponderacion, r.nombre as ramo_nombre FROM planes_estudio pe JOIN evaluaciones e ON pe.evaluacion_id = e.id JOIN ramos r ON e.ramo_id = r.id WHERE pe.id = $1 AND pe.usuario_id = $2',
      [plan_id, id]
    )
    if (plan.rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' })

    const tareas = await pool.query('SELECT nombre, guia FROM tareas_plan WHERE plan_id = $1 ORDER BY orden ASC', [plan_id])
    const p = plan.rows[0]

    const contexto = tareas.rows.map((t, i) => `TEMA ${i+1}: ${t.nombre}\n${t.guia}`).join('\n\n---\n\n')

    const prompt = `Eres un profesor universitario experto en "${p.ramo_nombre}". Debes crear una evaluación diagnóstica rigurosa de 20 preguntas de opción múltiple basada EXCLUSIVAMENTE en el siguiente material de estudio del plan para la evaluación "${p.eval_nombre}".

MATERIAL DEL PLAN DE ESTUDIO:
${contexto}

INSTRUCCIONES:
- Genera exactamente 20 preguntas de opción múltiple
- Cada pregunta tiene exactamente 4 alternativas (A, B, C, D)
- Solo una alternativa es correcta
- Las preguntas deben cubrir todos los temas del plan proporcionalmente
- Incluye preguntas de distintos niveles: comprensión (40%), aplicación (40%), análisis (20%)
- Las alternativas incorrectas deben ser plausibles (no obviamente falsas)
- Incluye una explicación breve de por qué la respuesta correcta es correcta

Responde SOLO con JSON válido, sin markdown:
{
  "preguntas": [
    {
      "numero": 1,
      "pregunta": "Texto de la pregunta",
      "alternativas": {
        "A": "Texto alternativa A",
        "B": "Texto alternativa B",
        "C": "Texto alternativa C",
        "D": "Texto alternativa D"
      },
      "correcta": "A",
      "explicacion": "Explicación breve de por qué A es correcta y por qué las demás no lo son"
    }
  ]
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })

    const text = response.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(text)

    // Guardar evaluación en DB
    const existing = await pool.query('SELECT id FROM evaluaciones_diagnostico WHERE plan_id = $1 AND usuario_id = $2', [plan_id, id])
    let evalId
    if (existing.rows.length > 0) {
      evalId = existing.rows[0].id
      await pool.query('UPDATE evaluaciones_diagnostico SET preguntas = $1, respuestas = NULL, nota = NULL, completada = false, updated_at = NOW() WHERE id = $2', [JSON.stringify(data.preguntas), evalId])
    } else {
      const ins = await pool.query(
        'INSERT INTO evaluaciones_diagnostico (plan_id, usuario_id, preguntas) VALUES ($1, $2, $3) RETURNING id',
        [plan_id, id, JSON.stringify(data.preguntas)]
      )
      evalId = ins.rows[0].id
    }

    res.json({ id: evalId, preguntas: data.preguntas })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error generando evaluación: ' + e.message }) }
})

// POST corregir respuestas
router.post('/corregir/:eval_id', async (req, res) => {
  const { id } = req.user
  const { eval_id } = req.params
  const { respuestas } = req.body // { "1": "A", "2": "C", ... }
  try {
    const evalRow = await pool.query(
      'SELECT ed.*, pe.evaluacion_id, r.nombre as ramo_nombre, e.nombre as eval_nombre FROM evaluaciones_diagnostico ed JOIN planes_estudio pe ON ed.plan_id = pe.id JOIN evaluaciones e ON pe.evaluacion_id = e.id JOIN ramos r ON e.ramo_id = r.id WHERE ed.id = $1 AND ed.usuario_id = $2',
      [eval_id, id]
    )
    if (evalRow.rows.length === 0) return res.status(404).json({ error: 'Evaluación no encontrada' })

    const ev = evalRow.rows[0]
    const preguntas = ev.preguntas

    // Calcular nota
    let correctas = 0
    const detalle = preguntas.map(p => {
      const respuesta = respuestas[p.numero.toString()]
      const esCorrecta = respuesta === p.correcta
      if (esCorrecta) correctas++
      return { ...p, respuesta_usuario: respuesta, es_correcta: esCorrecta }
    })

    const porcentaje = correctas / preguntas.length
    // Escala chilena: nota = 1 + 6 * (correctas / total), con exigencia 60%
    const nota = Math.round((1 + 6 * porcentaje) * 10) / 10

    // Obtener nota mínima requerida del ramo
    const ramo = await pool.query(
      'SELECT r.nota_minima FROM ramos r JOIN evaluaciones e ON e.ramo_id = r.id JOIN planes_estudio pe ON pe.evaluacion_id = e.id WHERE pe.id = $1',
      [ev.plan_id]
    )
    const notaMinima = ramo.rows[0]?.nota_minima || 4.0

    // Diagnóstico
    let diagnostico, color
    if (nota >= notaMinima + 1.5) {
      diagnostico = `¡Excelente! Obtuviste un ${nota}. Estás muy bien preparado/a para la evaluación. Sigue así 🎉`
      color = 'green'
    } else if (nota >= notaMinima) {
      diagnostico = `Bien. Obtuviste un ${nota}, suficiente para aprobar. Refuerza los temas donde fallaste para asegurar tu nota 💪`
      color = 'yellow'
    } else if (nota >= notaMinima - 0.5) {
      diagnostico = `Cerca. Obtuviste un ${nota}, estás a poco de alcanzar el mínimo de ${notaMinima}. Dedica más tiempo a los temas con errores ⚠️`
      color = 'orange'
    } else {
      diagnostico = `Necesitas reforzar. Obtuviste un ${nota} y el mínimo requerido es ${notaMinima}. Revisa el plan de estudio nuevamente antes de la evaluación 📚`
      color = 'red'
    }

    await pool.query(
      'UPDATE evaluaciones_diagnostico SET respuestas = $1, nota = $2, completada = true, updated_at = NOW() WHERE id = $3',
      [JSON.stringify(respuestas), nota, eval_id]
    )

    res.json({ nota, correctas, total: preguntas.length, porcentaje: Math.round(porcentaje * 100), diagnostico, color, detalle, nota_minima: notaMinima })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error corrigiendo: ' + e.message }) }
})

// GET resultado guardado
router.get('/resultado/:plan_id', async (req, res) => {
  const { id } = req.user
  const { plan_id } = req.params
  try {
    const r = await pool.query('SELECT * FROM evaluaciones_diagnostico WHERE plan_id = $1 AND usuario_id = $2', [plan_id, id])
    if (r.rows.length === 0) return res.json(null)
    res.json(r.rows[0])
  } catch (e) { res.status(500).json({ error: 'Error' }) }
})

module.exports = router
