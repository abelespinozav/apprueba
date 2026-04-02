require('dotenv').config()
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { Pool } = require('pg')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false, saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (google_id, email, name, picture) VALUES ($1,$2,$3,$4) ON CONFLICT (google_id) DO UPDATE SET name=$3, picture=$4 RETURNING *',
      [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0]?.value]
    )
    done(null, rows[0])
  } catch (e) { done(e) }
}))

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try { const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]); done(null, rows[0]) }
  catch (e) { done(e) }
})

const requireAuth = (req, res, next) => req.isAuthenticated() ? next() : res.status(401).json({ error: 'No autenticado' })

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/` }),
  (req, res) => res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173'))
app.get('/auth/me', (req, res) => res.json({ user: req.user || null }))
app.post('/auth/logout', (req, res) => { req.logout(() => res.json({ ok: true })) })

// Ramos routes
app.get('/ramos', requireAuth, async (req, res) => {
  try {
    const { rows: ramos } = await pool.query('SELECT * FROM ramos WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id])
    for (const ramo of ramos) {
      const { rows: evs } = await pool.query('SELECT * FROM evaluaciones WHERE ramo_id=$1 ORDER BY id', [ramo.id])
      for (const ev of evs) {
        const { rows: archivos } = await pool.query('SELECT id, nombre, tipo, created_at FROM archivos WHERE evaluacion_id=$1 ORDER BY id', [ev.id])
        ev.archivos = archivos
      }
      ramo.evaluaciones = evs
    }
    res.json(ramos)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/ramos', requireAuth, async (req, res) => {
  try {
    const { nombre, minAprobacion, evaluaciones } = req.body
    const { rows: [ramo] } = await pool.query(
      'INSERT INTO ramos (user_id, nombre, min_aprobacion) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, nombre, minAprobacion]
    )
    for (const ev of evaluaciones) {
      await pool.query(
        'INSERT INTO evaluaciones (ramo_id, nombre, ponderacion, nota, fecha) VALUES ($1,$2,$3,$4,$5)',
        [ramo.id, ev.nombre, ev.ponderacion, ev.nota || null, ev.fecha || null]
      )
    }
    const { rows: evs } = await pool.query('SELECT * FROM evaluaciones WHERE ramo_id=$1 ORDER BY id', [ramo.id])
    ramo.evaluaciones = evs
    res.json(ramo)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/ramos/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM ramos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/evaluaciones/:id/nota', requireAuth, async (req, res) => {
  try {
    const { nota } = req.body
    await pool.query('UPDATE evaluaciones SET nota=$1 WHERE id=$2', [nota, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Subir archivo a evaluación
app.post('/evaluaciones/:id/archivos', requireAuth, upload.single('archivo'), async (req, res) => {
  try {
    const { id } = req.params
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No se subió archivo' })
    const { rows: [archivo] } = await pool.query(
      'INSERT INTO archivos (evaluacion_id, nombre, ruta, tipo) VALUES ($1,$2,$3,$4) RETURNING id, nombre, tipo, created_at',
      [id, file.originalname, file.path, file.mimetype]
    )
    res.json(archivo)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Eliminar archivo
app.delete('/archivos/:id', requireAuth, async (req, res) => {
  try {
    const { rows: [archivo] } = await pool.query('SELECT * FROM archivos WHERE id=$1', [req.params.id])
    if (archivo && fs.existsSync(archivo.ruta)) fs.unlinkSync(archivo.ruta)
    await pool.query('DELETE FROM archivos WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Extraer texto de archivo
async function extraerTexto(ruta, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const buffer = fs.readFileSync(ruta)
      const data = await pdfParse(buffer)
      return data.text
    }
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: ruta })
      return result.value
    }
    if (mimetype.startsWith('text/')) {
      return fs.readFileSync(ruta, 'utf-8')
    }
    return null
  } catch { return null }
}

// Generar plan de estudio con Gemini
app.post('/evaluaciones/:id/plan-estudio', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { rows: [ev] } = await pool.query('SELECT * FROM evaluaciones WHERE id=$1', [id])
    if (!ev) return res.status(404).json({ error: 'Evaluación no encontrada' })
    const { rows: archivos } = await pool.query('SELECT * FROM archivos WHERE evaluacion_id=$1', [id])

    let contenido = ''
    for (const archivo of archivos) {
      const texto = await extraerTexto(archivo.ruta, archivo.tipo)
      if (texto) contenido += `\n\n--- ${archivo.nombre} ---\n${texto.slice(0, 8000)}`
    }

    const hoy = new Date().toISOString().split('T')[0]
    const fechaEv = ev.fecha ? ev.fecha.toISOString?.().split('T')[0] || ev.fecha : 'sin fecha definida'

    const prompt = `Eres un tutor universitario experto en planificación de estudios.

Evaluación: "${ev.nombre}" (${ev.ponderacion}% del ramo)
Fecha de la evaluación: ${fechaEv}
Fecha de hoy: ${hoy}

${contenido ? `Contenido a estudiar:\n${contenido}` : 'No se subieron archivos, crea un plan de estudio general para preparar una evaluación universitaria.'}

Crea un plan de estudio detallado y realista. Responde SOLO con un JSON válido con este formato exacto:
{
  "resumen": "breve descripción del contenido a estudiar",
  "dias_disponibles": número,
  "tareas": [
    {
      "fecha": "YYYY-MM-DD",
      "titulo": "título corto de la tarea",
      "descripcion": "qué estudiar específicamente",
      "duracion": "tiempo estimado en minutos",
      "prioridad": "alta|media|baja"
    }
  ]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'Error al generar plan' })
    const plan = JSON.parse(jsonMatch[0])

    await pool.query('UPDATE evaluaciones SET plan_estudio=$1 WHERE id=$2', [JSON.stringify(plan), id])
    res.json(plan)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Guardar progreso del plan
app.put('/evaluaciones/:id/plan-progreso', requireAuth, async (req, res) => {
  try {
    const { tareasCompletadas } = req.body
    await pool.query('UPDATE evaluaciones SET tareas_completadas=$1 WHERE id=$2', [JSON.stringify(tareasCompletadas), req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
