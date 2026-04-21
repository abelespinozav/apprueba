import { useState, useRef, useEffect } from 'react'
import Quiz from './Quiz'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

const PRIORIDAD_COLOR = { alta: '#f87171', media: '#fbbf24', baja: '#4ade80' }
const PRIORIDAD_BG = { alta: 'rgba(248,113,113,0.12)', media: 'rgba(251,191,36,0.12)', baja: 'rgba(74,222,128,0.12)' }

// Costos del sistema de créditos (matchean el backend).
const COSTO_PLAN = 15
const COSTO_GUIA = 8
const COSTO_EJERCICIOS = 12
const COSTO_PODCAST = 30

// Copia local del badge de créditos (evita ciclo App ↔ PlanEstudio).
function CreditBadge({ costo, creditos }) {
  const sinCreditos = creditos !== null && creditos !== undefined && creditos < costo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: sinCreditos ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
      border: `1px solid ${sinCreditos ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.3)'}`,
      borderRadius: 20, padding: '1px 7px',
      fontSize: 10, fontWeight: 700,
      color: sinCreditos ? '#f87171' : '#fbbf24',
      whiteSpace: 'nowrap', marginLeft: 6
    }}>⚡ {costo} cr</span>
  )
}

export default function PlanEstudio({ evaluacion, ramo, onBack }) {
  const planInicial = evaluacion.plan_estudio || null
  const completadasIniciales = evaluacion.tareas_completadas || []

  const [plan, setPlan] = useState(planInicial)
  const [completadas, setCompletadas] = useState(new Set(completadasIniciales))
  const [generando, setGenerando] = useState(false)
  const spinnerStyle = { display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 6 }
  if (!document.getElementById('spin-style')) { const s = document.createElement('style'); s.id = 'spin-style'; s.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'; document.head.appendChild(s) }
  const [archivos, setArchivos] = useState([])
  const [youtubeUrls, setYoutubeUrls] = useState([])
  const [youtubeInput, setYoutubeInput] = useState('')
  const [mostrarModalMaterial, setMostrarModalMaterial] = useState(false)
  const [progresoMsg, setProgresoMsg] = useState('')
  const [tareaActiva, setTareaActiva] = useState(null)
  const [guia, setGuia] = useState(null)
  const [mostrandoQuiz, setMostrandoQuiz] = useState(false)
  const [cargandoGuia, setCargandoGuia] = useState(false)
  const [generandoPodcastId, setGenerandoPodcastId] = useState(null)
  const [descargandoEjerciciosId, setDescargandoEjerciciosId] = useState(null)
  const [podcast, setPodcast] = useState(null)
  const [podcastsExistentes, setPodcastsExistentes] = useState([]) // [{tarea_idx, titulo}]
  const [podcastTitulo, setPodcastTitulo] = useState('')
  const [podcastPlaying, setPodcastPlaying] = useState(false)
  const [podcastProgress, setPodcastProgress] = useState(0)
  const [podcastDuration, setPodcastDuration] = useState(0)
  const [creditos, setCreditos] = useState(null)
  const [guiasGeneradas, setGuiasGeneradas] = useState({})
  const [ejerciciosGenerados, setEjerciciosGenerados] = useState({})
  const audioRef = useRef(null)
  const [archivosGuardados, setArchivosGuardados] = useState(evaluacion.archivos || [])
  const fileRef = useRef()

  const eliminarArchivo = async (id) => {
    if (!window.confirm('⚠️ Al eliminar este archivo se regenerará el plan de estudio. Tu progreso de tareas completadas se conservará. ¿Continuar?')) return
    try {
      await fetch(`${API}/archivos/${id}`, { method: 'DELETE', headers: authHeaders() })
      const nuevosArchivos = archivosGuardados.filter(a => a.id !== id)
      setArchivosGuardados(nuevosArchivos)
      setPlan(null)
    } catch (e) { console.error(e) }
  }

  const diasRestantes = evaluacion.fecha
    ? Math.round((new Date(evaluacion.fecha + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
    : null

  const agregarYoutubeUrl = () => {
    const url = youtubeInput.trim()
    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      setYoutubeUrls(prev => [...prev, url])
      setYoutubeInput('')
    }
  }

  const generarPlan = async () => {
    setGenerando(true)
    setProgresoMsg('📋 Iniciando generación del plan...')
    try {
      const form = new FormData()
      archivos.forEach(f => form.append('archivo', f))
      youtubeUrls.forEach(url => form.append('youtubeUrl', url))

      const res = await fetch(`${API}/evaluaciones/${evaluacion.id}/plan-estudio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: form
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evento = JSON.parse(line.slice(6))
            if (evento.tipo === 'progreso') {
              setProgresoMsg(evento.msg)
            } else if (evento.tipo === 'plan') {
              setPlan(evento.plan)
              setCompletadas(new Set())
              // Regeneración: el backend solo cobra cuando ya existía un plan.
              if (plan) {
                setCreditos(prev => prev !== null ? Math.max(0, prev - COSTO_PLAN) : prev)
                cargarContadores()
              }
              cargarArchivos()
            } else if (evento.tipo === 'error') {
              if (evento.error === 'creditos_insuficientes') {
                setCreditos(evento.saldo ?? 0)
                alert(`Sin créditos. Necesitas ${evento.creditos_necesarios ?? COSTO_PLAN} cr, tienes ${evento.saldo ?? 0} cr.`)
              } else if (evento.error === 'sin_material') {
                alert('📚 Debes subir tu material de estudio (PDF o Word) para generar el plan.')
              } else if (evento.error === 'archivo_no_legible') {
                alert('⚠️ No pudimos leer tu archivo. Por favor sube un PDF o Word (.docx)')
              } else if (evento.error === 'archivo_muy_grande') {
                alert('⚠️ Tu archivo es muy grande. El máximo permitido es 25MB.')
              } else {
                alert('Error: ' + (evento.mensaje || evento.error || 'No se pudo generar el plan'))
              }
            }
          } catch(e) { /* ignorar líneas mal formadas */ }
        }
      }
    } catch (e) {
      console.error(e)
      alert('Error generando plan')
    }
    setGenerando(false)
    setProgresoMsg('')
    setArchivos([])
    setYoutubeUrls([])
  }

  const toggleTarea = async (index) => {
    const nuevas = new Set(completadas)
    if (nuevas.has(index)) nuevas.delete(index)
    else nuevas.add(index)
    setCompletadas(nuevas)
    try {
      await fetch(`${API}/evaluaciones/${evaluacion.id}/plan-progreso`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ completadas: Array.from(nuevas) })
      })
    } catch (e) { console.error(e) }
  }

  const verGuia = async (tarea, index) => {
    setTareaActiva({ tarea, index })
    setGuia(null)
    setCargandoGuia(true)
    try {
      const res = await fetch(`${API}/evaluaciones/${evaluacion.id}/guia-tarea`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ tarea, tareaIndex: index })
      })
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'creditos_insuficientes') {
          setCreditos(data.saldo ?? 0)
          alert(`Sin créditos. Necesitas ${data.creditos_necesarios} cr, tienes ${data.saldo} cr.`)
        }
        setGuia({ error: true })
      } else if (res.ok) {
        const g = await res.json()
        setGuia(g)
        setGuiasGeneradas(prev => ({ ...prev, [index]: true }))
        // Solo cobramos si NO era cache — el backend marca cache con g.cached.
        if (!g.cached) {
          setCreditos(prev => prev !== null ? Math.max(0, prev - COSTO_GUIA) : prev)
          cargarContadores()
        }
      } else {
        setGuia({ error: true })
      }
    } catch (e) { setGuia({ error: true }) }
    setCargandoGuia(false)
  }

  const escucharPodcast = async (evId, tareaIdx, titulo) => {
    try {
      const res = await fetch(API + '/evaluaciones/' + evId + '/podcast/audio?tareaIdx=' + tareaIdx, { headers: authHeaders() })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPodcastTitulo(titulo)
      setPodcast(url)
      setPodcastPlaying(true)
      setTimeout(() => { if (audioRef.current) audioRef.current.play() }, 100)
    } catch(e) { console.error(e) }
  }

  const cargarPodcastExistente = async (evId) => {
    try {
      const res = await fetch(API + '/evaluaciones/' + evId + '/podcast', { headers: authHeaders() })
      const data = await res.json()
      if (data.podcasts) setPodcastsExistentes(data.podcasts)
    } catch(e) {}
  }

  const cargarArchivos = async () => {
    try {
      const res = await fetch(API + '/evaluaciones/' + evaluacion.id + '/archivos', { headers: authHeaders() })
      if (res.ok) { const data = await res.json(); setArchivosGuardados(data) }
    } catch(e) {}
  }

  useEffect(() => {
    cargarPodcastExistente(evaluacion.id)
    cargarArchivos()
    cargarContadores()
    if (evaluacion.guias_tareas) {
      const indices = Object.keys(evaluacion.guias_tareas).reduce((acc, k) => ({ ...acc, [k]: true }), {})
      setGuiasGeneradas(indices)
    }

    // Polling: verificar estado del plan al montar y cada 5s si está generando en segundo plano
    let pollingInterval = null

    const iniciarPolling = () => {
      if (!pollingInterval) {
        pollingInterval = setInterval(verificarPlanListo, 5000)
      }
    }

    const verificarPlanListo = async () => {
      try {
        const res = await fetch(`${API}/evaluaciones/${evaluacion.id}/plan-estado`, { headers: authHeaders() })
        if (!res.ok) return
        const data = await res.json()
        if (data.generando) {
          // Plan generándose en segundo plano → mostrar estado de carga y mantener polling
          setGenerando(true)
          setProgresoMsg('⏳ Generando tu plan en segundo plano...')
          iniciarPolling()
        } else if (data.listo && data.plan) {
          // Plan listo → mostrarlo
          setPlan(data.plan)
          setCompletadas(new Set(evaluacion.tareas_completadas || []))
          setGenerando(false)
          setProgresoMsg('')
          clearInterval(pollingInterval)
          pollingInterval = null
        } else {
          // No está generando ni hay plan → estado inicial
          setGenerando(false)
          setProgresoMsg('')
          clearInterval(pollingInterval)
          pollingInterval = null
        }
      } catch(e) {}
    }

    // Verificar al montar (detecta generación en segundo plano)
    verificarPlanListo()

    return () => { if (pollingInterval) clearInterval(pollingInterval) }
  }, [evaluacion.id])

  const cargarContadores = async () => {
    try {
      const res = await fetch(`${API}/usuarios/creditos`, { headers: authHeaders() })
      if (res.ok) {
        const d = await res.json()
        setCreditos(d.total ?? d.creditos_total ?? 0)
      }
    } catch(e) {}
  }

  const descargarEjercicios = async (tarea, tareaIndex) => {
    if (creditos !== null && creditos < COSTO_EJERCICIOS) return
    setDescargandoEjerciciosId(tareaIndex)
    try {
      const res = await fetch(API + '/evaluaciones/' + evaluacion.id + '/ejercicios-pdf', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarea, tareaIndex })
      })
      if (res.status === 403) {
        const data = await res.json()
        if (data.error === 'creditos_insuficientes') {
          setCreditos(data.saldo ?? 0)
          alert(`Sin créditos. Necesitas ${data.creditos_necesarios} cr, tienes ${data.saldo} cr.`)
        }
        setDescargandoEjerciciosId(null); return
      }
      if (!res.ok) { alert('Error generando ejercicios'); setDescargandoEjerciciosId(null); return }
      // Ejercicios PDF tiene cache diario server-side: si el header X-Cached=1
      // viene, el backend no cobró créditos — no hacemos decrement local.
      const cached = res.headers.get('X-Cached') === '1'
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ejercicios-' + (tareaIndex + 1) + '-' + tarea.titulo.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setEjerciciosGenerados(prev => ({ ...prev, [tareaIndex]: true }))
      if (!cached) {
        setCreditos(prev => prev !== null ? Math.max(0, prev - COSTO_EJERCICIOS) : prev)
        cargarContadores()
      }
    } catch(e) { console.error(e); alert('Error descargando ejercicios') }
    setDescargandoEjerciciosId(null)
  }

  const generarPodcast = async (tareaIdx) => {
    if (creditos !== null && creditos < COSTO_PODCAST) return
    setGenerandoPodcastId(tareaIdx)
    try {
      const res = await fetch(API + '/evaluaciones/' + evaluacion.id + '/podcast', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareaIdx })
      })
      if (res.status === 403) {
        const data = await res.json()
        if (data.error === 'creditos_insuficientes') {
          setCreditos(data.saldo ?? 0)
          alert(`Sin créditos. Necesitas ${data.creditos_necesarios} cr, tienes ${data.saldo} cr.`)
        }
        return
      }
      if (res.status === 400) {
        const data = await res.json()
        if (data.error === 'sin_material') alert('📚 Debes subir material de estudio para generar el podcast.')
        else alert('Error: ' + (data.mensaje || 'No se pudo generar el podcast'))
        return
      }
      if (!res.ok) { alert('Error generando podcast'); return }
      const titulo = decodeURIComponent(res.headers.get('X-Podcast-Titulo') || evaluacion.nombre)
      setCreditos(prev => prev !== null ? Math.max(0, prev - COSTO_PODCAST) : prev)
      cargarContadores()
      setPodcastsExistentes(prev => {
        const filtered = prev.filter(p => Number(p.tarea_idx) !== Number(tareaIdx))
        return [...filtered, { tarea_idx: tareaIdx, titulo }]
      })
      setPodcastTitulo(titulo)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPodcast(url)
      setPodcastPlaying(true)
      setTimeout(() => { if (audioRef.current) { audioRef.current.play() } }, 100)
    } catch(e) { console.error(e); alert('Error generando podcast') }
    setGenerandoPodcastId(null)
  }

  const totalTareas = plan?.tareas?.length || 0
  const numCompletadas = completadas.size

  if (mostrandoQuiz) return <Quiz evaluacion={{ ...evaluacion, archivos: archivosGuardados }} ramo={ramo} onBack={() => setMostrandoQuiz(false)} />

  // Vista guía de tarea
  if (tareaActiva) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', padding: '56px 20px 24px' }}>
        <button onClick={() => { setTareaActiva(null); setGuia(null) }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>← Volver al plan</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIORIDAD_COLOR[tareaActiva.tarea.prioridad], background: PRIORIDAD_BG[tareaActiva.tarea.prioridad], padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{tareaActiva.tarea.prioridad}</span>
          {tareaActiva.tarea.duracion && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>⏱ {tareaActiva.tarea.duracion} min</span>}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>{tareaActiva.tarea.titulo}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{tareaActiva.tarea.descripcion}</p>
      </div>
      <div style={{ padding: '20px' }}>
        {cargandoGuia ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Generando guía con IA...</p>
          </div>
        ) : guia && !guia.error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {guia.introduccion && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(46,125,209,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>📖 Introducción</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7 }}>{guia.introduccion}</p>
              </div>
            )}
            {guia.conceptos_clave?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(46,125,209,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>🔑 Conceptos clave</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guia.conceptos_clave.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(108,99,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 4px' }}>{c.termino}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px', lineHeight: 1.6 }}>{c.definicion}</p>
                      {c.truco && <p style={{ fontSize: 12, color: '#fbbf24', margin: 0, fontStyle: 'italic' }}>🧠 {c.truco}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guia.desarrollo && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(46,125,209,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>📝 Desarrollo</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{guia.desarrollo}</p>
              </div>
            )}
            {guia.ejemplos?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(46,125,209,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>💡 Ejemplos resueltos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {guia.ejemplos.map((e, i) => (
                    <div key={i} style={{ background: 'rgba(251,191,36,0.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(251,191,36,0.15)' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', margin: '0 0 8px' }}>Ejemplo {i+1}: {e.enunciado}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.solucion}</p>
                      {e.insight && <p style={{ fontSize: 12, color: '#34d399', margin: 0, fontStyle: 'italic' }}>🎯 Para el examen: {e.insight}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guia.ejercicios_practica?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(46,125,209,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>🏋️ Ejercicios de práctica</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guia.ejercicios_practica.map((e, i) => (
                    <div key={i} style={{ background: 'rgba(74,222,128,0.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(74,222,128,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{i+1}. {e.enunciado}</p>
                        {e.nivel && <span style={{ fontSize: 10, fontWeight: 700, color: e.nivel === 'básico' ? '#4ade80' : e.nivel === 'intermedio' ? '#fbbf24' : '#f87171', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{e.nivel}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: '#4ade80', margin: 0 }}>💡 Pista: {e.pista}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guia.conexiones && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid rgba(56,189,248,0.2)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>🔗 Conexiones y aplicaciones reales</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{guia.conexiones}</p>
              </div>
            )}
            {guia.resumen_final && (
              <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.25)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>✅ Cheat Sheet para el examen</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{guia.resumen_final}</p>
              </div>
            )}
          </div>
        ) : guia?.error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>Error al generar guía. Intenta de nuevo.</div>
        ) : null}
      </div>
    </div>
  )

  // Vista principal del plan
  const modalMaterial = (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: mostrarModalMaterial ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, border: '1px solid rgba(46,125,209,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 700 }}>📚 Agregar material de estudio</h3>
          <button onClick={() => setMostrarModalMaterial(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📎 Archivos</p>
        <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(var(--color-primary-rgb, 46,125,209), 0.1)', border: '1.5px dashed rgba(46,125,209,0.4)', borderRadius: 12, padding: 14, color: 'var(--color-secondary)', fontSize: 13, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>
          {archivos.length > 0 ? `📎 ${archivos.length} archivo(s) seleccionado(s) — click para cambiar` : '📎 Subir archivo (PDF, imagen, audio, video)'}
        </button>
        {archivos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {archivos.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.08)', borderRadius: 8, padding: '6px 10px', marginBottom: 4 }}>
                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name}</span>
                <button onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎬 Videos de YouTube</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={youtubeInput}
            onChange={e => setYoutubeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarYoutubeUrl()}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 13, outline: 'none' }}
          />
          <button onClick={agregarYoutubeUrl} style={{ background: '#f87171', border: 'none', borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
        {youtubeUrls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {youtubeUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,0.08)', borderRadius: 8, padding: '6px 10px', marginBottom: 4 }}>
                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎬 {url}</span>
                <button onClick={() => setYoutubeUrls(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setMostrarModalMaterial(false)} style={{ width: '100%', background: 'var(--color-primary)', border: 'none', borderRadius: 12, padding: 13, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
          ✅ Listo ({archivos.length} archivo(s) + {youtubeUrls.length} video(s))
        </button>
      </div>
    </div>
  )

  return (
    <>{modalMaterial}<div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      <div style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', padding: '56px 20px 24px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>← Volver</button>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>{ramo.nombre}</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>Plan: {evaluacion.nombre}</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {evaluacion.ponderacion}% del ramo
          {diasRestantes !== null && ` · ${diasRestantes > 0 ? `En ${diasRestantes} días` : diasRestantes === 0 ? '¡Hoy!' : 'Pasada'}`}
        </p>
      </div>

      <div style={{ padding: '16px' }}>
        {plan ? (
          <>
            <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>📋 Resumen del plan</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px', lineHeight: 1.6 }}>{plan.resumen}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{numCompletadas}/{totalTareas} tareas completadas</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-secondary)' }}>{totalTareas > 0 ? Math.round((numCompletadas/totalTareas)*100) : 0}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6 }}>
                <div style={{ height: '100%', width: `${totalTareas > 0 ? (numCompletadas/totalTareas)*100 : 0}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Tareas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {plan.tareas.map((t, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', border: `1px solid ${completadas.has(i) ? 'rgba(74,222,128,0.2)' : 'rgba(46,125,209,0.15)'}`, opacity: completadas.has(i) ? 0.7 : 1, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button onClick={() => toggleTarea(i)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${completadas.has(i) ? '#4ade80' : 'rgba(108,99,255,0.4)'}`, background: completadas.has(i) ? '#4ade80' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {completadas.has(i) ? '✓' : ''}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: completadas.has(i) ? 'rgba(255,255,255,0.4)' : 'white', margin: 0, textDecoration: completadas.has(i) ? 'line-through' : 'none' }}>{t.titulo}</p>
                        {t.prioridad && <span style={{ fontSize: 10, fontWeight: 700, color: PRIORIDAD_COLOR[t.prioridad], background: PRIORIDAD_BG[t.prioridad], padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>{t.prioridad}</span>}
                        {t.duracion && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>⏱ {t.duracion} min</span>}
                        {t.fecha && <span style={{ fontSize: 11, color: 'rgba(108,99,255,0.8)', background: 'rgba(var(--color-primary-rgb, 46,125,209), 0.1)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>📅 {t.fecha}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 6px', lineHeight: 1.5 }}>{t.descripcion}</p>
                      {t.fuente && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
                          {t.fuente.toLowerCase().includes('video') || t.fuente.toLowerCase().includes('min') ? '🎬' : '📄'} {t.fuente}
                        </span>
                      </p>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => verGuia(t, i)} style={{ background: 'rgba(var(--color-primary-rgb, 46,125,209), 0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'var(--color-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
  {guiasGeneradas[i] ? '📖 Ver guía' : <>✨ Generar guía <CreditBadge costo={COSTO_GUIA} creditos={creditos} /></>}
</button>
                      <button onClick={() => descargarEjercicios(t, i)} disabled={descargandoEjerciciosId === i || (creditos !== null && creditos < COSTO_EJERCICIOS)} style={{ background: (creditos !== null && creditos < COSTO_EJERCICIOS) ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: (creditos !== null && creditos < COSTO_EJERCICIOS) ? 'rgba(255,255,255,0.2)' : '#4ade80', fontSize: 12, cursor: (descargandoEjerciciosId === i || (creditos !== null && creditos < COSTO_EJERCICIOS)) ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
  {descargandoEjerciciosId === i ? <><span style={spinnerStyle}></span>Generando...</> : (creditos !== null && creditos < COSTO_EJERCICIOS) ? '🔒 Sin créditos' : ejerciciosGenerados[i] ? '📥 Ver ejercicios PDF' : <>✨ Ejercicios PDF <CreditBadge costo={COSTO_EJERCICIOS} creditos={creditos} /></>}
</button>
                      {podcastsExistentes.some(p => Number(p.tarea_idx) === i) ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { const p = podcastsExistentes.find(p => Number(p.tarea_idx) === i); escucharPodcast(evaluacion.id, i, p?.titulo || '') }} style={{ background: 'rgba(251,191,36,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fbbf24', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🎧 Escuchar</button>
                          <button onClick={() => generarPodcast(i)} disabled={generandoPodcastId === i || (creditos !== null && creditos < COSTO_PODCAST)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: (generandoPodcastId === i || (creditos !== null && creditos < COSTO_PODCAST)) ? 'not-allowed' : 'pointer' }} title={`Regenerar podcast — ${COSTO_PODCAST} cr`}>
                            {generandoPodcastId === i ? <span style={spinnerStyle}></span> : '🔄'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => generarPodcast(i)} disabled={generandoPodcastId === i || (creditos !== null && creditos < COSTO_PODCAST)} style={{ background: (creditos !== null && creditos < COSTO_PODCAST) ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: (creditos !== null && creditos < COSTO_PODCAST) ? 'rgba(255,255,255,0.2)' : '#fbbf24', fontSize: 12, cursor: (creditos !== null && creditos < COSTO_PODCAST) ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                          {generandoPodcastId === i ? <><span style={spinnerStyle}></span>Generando...</> : (creditos !== null && creditos < COSTO_PODCAST) ? '🔒 Sin créditos' : <>🎙️ Podcast <CreditBadge costo={COSTO_PODCAST} creditos={creditos} /></>}
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 16, border: '1px solid rgba(46,125,209,0.15)' }}>
              <button onClick={() => setMostrandoQuiz(true)} style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: 10 }}>
                🧠 Hacer Quiz
              </button>

              <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.webp,.heic,.mp3,.m4a,.wav,.ogg,.mp4,.mov" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
              {archivosGuardados.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Material guardado</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {archivosGuardados.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(var(--color-primary-rgb, 46,125,209), 0.1)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(108,99,255,0.2)' }}>
                        <span style={{ fontSize: 14 }}>📄</span>
                        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
                        <button onClick={() => eliminarArchivo(a.id)} style={{ background: 'rgba(248,113,113,0.15)', border: 'none', borderRadius: 6, width: 24, height: 24, color: '#f87171', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setMostrarModalMaterial(true)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(46,125,209,0.3)', borderRadius: 12, padding: 10, color: 'var(--color-secondary)', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                {(archivos.length > 0 || youtubeUrls.length > 0) ? `📎 ${archivos.length} archivo(s) + 🎬 ${youtubeUrls.length} video(s)` : '📎 Agregar material (PDF, video, YouTube...)'}
              </button>
              <button onClick={generarPlan} disabled={generando || (creditos !== null && creditos < COSTO_PLAN)} style={{ width: '100%', background: (generando || (creditos !== null && creditos < COSTO_PLAN)) ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: (generando || (creditos !== null && creditos < COSTO_PLAN)) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {generando ? <><span style={spinnerStyle}></span>{progresoMsg || 'Iniciando...'}</> : (creditos !== null && creditos < COSTO_PLAN) ? '🔒 Sin créditos suficientes' : <>🤖 Regenerar plan con IA <CreditBadge costo={COSTO_PLAN} creditos={creditos} /></>}
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, border: '1.5px dashed rgba(46,125,209,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Genera tu plan de estudio</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', lineHeight: 1.5 }}>La IA creará 5 tareas priorizadas para prepararte para esta evaluación</p>
            <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.webp,.heic,.mp3,.m4a,.wav,.ogg,.mp4,.mov" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
            {archivosGuardados.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Material guardado</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {archivosGuardados.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(var(--color-primary-rgb, 46,125,209), 0.1)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(108,99,255,0.2)' }}>
                      <span style={{ fontSize: 14 }}>📄</span>
                      <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
                      <button onClick={() => eliminarArchivo(a.id)} style={{ background: 'rgba(248,113,113,0.15)', border: 'none', borderRadius: 6, width: 24, height: 24, color: '#f87171', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setMostrarModalMaterial(true)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(46,125,209,0.3)', borderRadius: 12, padding: 12, color: 'var(--color-secondary)', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
              {(archivos.length > 0 || youtubeUrls.length > 0) ? `📎 ${archivos.length} archivo(s) + 🎬 ${youtubeUrls.length} video(s)` : '📎 Agregar material (PDF, video, YouTube...)'}
            </button>
            <button onClick={generarPlan} disabled={generando} style={{ width: '100%', background: generando ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 16, padding: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: generando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
              {generando
                ? <><span style={spinnerStyle}></span>{progresoMsg || '⏳ Generando plan...'}</>
                : '🤖 Generar plan con IA'}
            </button>
            {generando && (
              <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(46,125,209,0.3)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-secondary)', fontWeight: 600 }}>🔄 Tu plan está siendo generado</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Este proceso puede tomar 1-2 minutos. Te notificaremos cuando esté listo.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Mini Player Flotante */}
      {podcast && (
        <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-card))', borderRadius: 20, padding: '14px 16px', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <audio ref={audioRef} src={podcast} onLoadedMetadata={e => { const d = e.target.duration; if (d && isFinite(d)) setPodcastDuration(d) }} onDurationChange={e => { const d = e.target.duration; if (d && isFinite(d)) setPodcastDuration(d) }} onTimeUpdate={e => { setPodcastProgress(e.target.currentTime); const d = e.target.duration; if (d && isFinite(d)) setPodcastDuration(d) }} onEnded={() => setPodcastPlaying(false)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🎙️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{podcastTitulo}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{ramo.nombre}</p>
            </div>
            <button onClick={() => { if (podcastPlaying) { audioRef.current?.pause(); setPodcastPlaying(false) } else { audioRef.current?.play(); setPodcastPlaying(true) } }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {podcastPlaying ? '⏸' : '▶️'}
            </button>
            <button onClick={() => { audioRef.current?.pause(); setPodcast(null); setPodcastPlaying(false) }} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 4, cursor: 'pointer' }} onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; if (audioRef.current) audioRef.current.currentTime = pct * podcastDuration }}>
            <div style={{ height: '100%', width: podcastDuration > 0 ? (podcastProgress / podcastDuration * 100) + '%' : '0%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'center' }}>
            {Math.floor(podcastProgress/60)}:{String(Math.floor(podcastProgress%60)).padStart(2,'0')} / {Math.floor(podcastDuration/60)}:{String(Math.floor(podcastDuration%60)).padStart(2,'0')}
          </p>
        </div>
      )}
    </div></>
  )
}
