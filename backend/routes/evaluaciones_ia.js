const express = require('express')
const router = express.Router()
const pool = require('../db')
const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

function extraerJSON(text) {
  // Limpiar markdown
  let clean = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  // Buscar primer { y último }
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1)
  return JSON.parse(clean)
}

router.post('/generar/:plan_id', async (req, res) => {
  const userId = req.user.id
  const planId = parseInt(req.params.plan_id)
  try {
    const plan = await pool.query(
      `SELECT pe.*, e.nombre as eval_nombre, e.ponderacion, r.nombre as ramo_nombre 
       FROM planes_estudio pe 
       JOIN evaluaciones e ON pe.evaluacion_id = e.id 
       JOIN ramos r ON e.ramo_id = r.id 
       WHERE pe.id = $1 AND pe.usuario_id::text = $2::text`,
      [planId, userId]
    )
    if (plan.rows.length === 0) return res.status(404).json({ error: 'Plan no encontrado' })

    const tareas = await pool.query('SELECT nombre, guia FROM tareas_plan WHERE plan_id = $1 ORDER BY orden ASC', [planId])
    const p = plan.rows[0]
    const contexto = tareas.rows.map((t, i) => `TEMA ${i+1}: ${t.nombre}\n${t.guia}`).join('\n\n---\n\n')

    const prompt = `Eres un profesor universitario experto en "${p.ramo_nombre}". Crea una evaluación diagnóstica de 20 preguntas de opción múltiple basada en este material de estudio para la evaluación "${p.eval_nombre}".

MATERIAL:
${contexto}

REGLAS ESTRICTAS:
- Exactamente 20 preguntas
- 4 alternativas por pregunta (A, B, C, D)
- Solo una correcta
- Distintos niveles de dificultad
- Alternativas incorrectas plausibles

RESPONDE ÚNICAMENTE CON JSON VÁLIDO, SIN TEXTO ADICIONAL, SIN MARKDOWN:
{"preguntas":[{"numero":1,"pregunta":"texto","alternativas":{"A":"...","B":"...","C":"...","D":"..."},"correcta":"A","explicacion":"texto"},...]}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })

    const data = extraerJSON(response.text)

    const existing = await pool.query(
      'SELECT id FROM evaluaciones_diagnostico WHERE plan_id = $1 AND usuario_id::text = $2::text',
      [planId, userId]
    )

    let evalId
    if (existing.rows.length > 0) {
      evalId = existing.rows[0].id
      await pool.query(
        'UPDATE evaluaciones_diagnostico SET preguntas = $1, respuestas = NULL, nota = NULL, completada = false, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(data.preguntas), evalId]
      )
    } else {
      const ins = await pool.query(
        'INSERT INTO evaluaciones_diagnostico (plan_id, usuario_id, preguntas) VALUES ($1, $2, $3) RETURNING id',
        [planId, userId, JSON.stringify(data.preguntas)]
      )
      evalId = ins.rows[0].id
    }

    res.json({ id: evalId, preguntas: data.preguntas })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error generando evaluación: ' + e.message }) }
})

router.post('/corregir/:eval_id', async (req, res) => {
  const userId = req.user.id
  const evalId = parseInt(req.params.eval_id)
  const { respuestas } = req.body
  try {
    const evalRow = await pool.query(
      `SELECT ed.*, pe.evaluacion_id, r.nombre as ramo_nombre, e.nombre as eval_nombre, r.nota_minima
       FROM evaluaciones_diagnostico ed 
       JOIN planes_estudio pe ON ed.plan_id = pe.id 
       JOIN evaluaciones e ON pe.evaluacion_id = e.id 
       JOIN ramos r ON e.ramo_id = r.id 
       WHERE ed.id = $1 AND ed.usuario_id::text = $2::text`,
      [evalId, userId]
    )
    if (evalRow.rows.length === 0) return res.status(404).json({ error: 'Evaluación no encontrada' })

    const ev = evalRow.rows[0]
    const preguntas = ev.preguntas

    let correctas = 0
    const detalle = preguntas.map(p => {
      const respuesta = respuestas[p.numero.toString()]
      const esCorrecta = respuesta === p.correcta
      if (esCorrecta) correctas++
      return { ...p, respuesta_usuario: respuesta, es_correcta: esCorrecta }
    })

    const porcentaje = correctas / preguntas.length
    const nota = Math.round((1 + 6 * porcentaje) * 10) / 10
    const notaMinima = parseFloat(ev.nota_minima) || 4.0

    let diagnostico, color
    if (nota >= notaMinima + 1.5) {
      diagnostico = `¡Excelente! Obtuviste un ${nota}. Estás muy bien preparado/a para la evaluación. Sigue así 🎉`
      color = 'green'
    } else if (nota >= notaMinima) {
      diagnostico = `Bien. Obtuviste un ${nota}, suficiente para aprobar. Refuerza los temas donde fallaste 💪`
      color = 'yellow'
    } else if (nota >= notaMinima - 0.5) {
      diagnostico = `Cerca. Obtuviste un ${nota}, estás a poco del mínimo de ${notaMinima}. Dedica más tiempo a los temas con errores ⚠️`
      color = 'orange'
    } else {
      diagnostico = `Necesitas reforzar. Obtuviste un ${nota} y el mínimo requerido es ${notaMinima}. Revisa el plan de estudio 📚`
      color = 'red'
    }

    await pool.query(
      'UPDATE evaluaciones_diagnostico SET respuestas = $1, nota = $2, completada = true, updated_at = NOW() WHERE id = $3',
      [JSON.stringify(respuestas), nota, evalId]
    )

    res.json({ nota, correctas, total: preguntas.length, porcentaje: Math.round(porcentaje * 100), diagnostico, color, detalle, nota_minima: notaMinima })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error corrigiendo: ' + e.message }) }
})

router.get('/resultado/:plan_id', async (req, res) => {
  const userId = req.user.id
  const planId = parseInt(req.params.plan_id)
  try {
    const r = await pool.query(
      'SELECT * FROM evaluaciones_diagnostico WHERE plan_id = $1 AND usuario_id::text = $2::text',
      [planId, userId]
    )
    if (r.rows.length === 0) return res.json(null)
    res.json(r.rows[0])
  } catch (e) { res.status(500).json({ error: 'Error' }) }
})

module.exports = router
