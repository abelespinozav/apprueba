import { useState, useRef, useEffect } from 'react'
import Quiz from './Quiz'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

const PRIORIDAD_COLOR = { alta: '#f87171', media: '#fbbf24', baja: '#4ade80' }
const PRIORIDAD_BG = { alta: 'rgba(248,113,113,0.12)', media: 'rgba(251,191,36,0.12)', baja: 'rgba(74,222,128,0.12)' }

export default function PlanEstudio({ evaluacion, ramo, onBack }) {
  const planInicial = evaluacion.plan_estudio || null
  const completadasIniciales = evaluacion.tareas_completadas || []

  const [plan, setPlan] = useState(planInicial)
  const [completadas, setCompletadas] = useState(new Set(completadasIniciales))
  const [generando, setGenerando] = useState(false)
  const spinnerStyle = { display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 6 }
  if (!document.getElementById('spin-style')) { const s = document.createElement('style'); s.id = 'spin-style'; s.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'; document.head.appendChild(s) }
  const [archivos, setArchivos] = useState([])
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
  const [podcastsUsados, setPodcastsUsados] = useState(null)
  const [ejerciciosUsados, setEjerciciosUsados] = useState(null)
  const [quizzesUsados, setQuizzesUsados] = useState(null)
  const [planesUsados, setPlanesUsados] = useState(null)
  const [limiteGlobal, setLimiteGlobal] = useState(100)
  const [guiasGeneradas, setGuiasGeneradas] = useState({})
  const [ejerciciosGenerados, setEjerciciosGenerados] = useState({})
  const audioRef = useRef(null)
  const [archivosGuardados, setArchivosGuardados] = useState(evaluacion.archivos || [])
  const fileRef = useRef()

  const eliminarArchivo = async (id) => {
    try {
      await fetch(`${API}/archivos/${id}`, { method: 'DELETE', headers: authHeaders() })
      setArchivosGuardados(prev => prev.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
  }

  const diasRestantes = evaluacion.fecha
    ? Math.round((new Date(evaluacion.fecha + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
    : null

  const regenerarPlan = () => {
    setPlan(null)
    setCompletadas(new Set())
  }

  const generarPlan = async () => {
    setGenerando(true)
    console.log('🔍 evaluacion completa:', JSON.stringify(evaluacion))
    console.log('🔍 evaluacion.id:', evaluacion.id, typeof evaluacion.id)
    try {
      const form = new FormData()
      archivos.forEach(f => form.append('archivo', f))
      const res = await fetch(`${API}/evaluaciones/${evaluacion.id}/plan-estudio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: form
      })
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        setCompletadas(new Set())
        if (plan) setPlanesUsados(prev => (prev || 0) + 1)
      } else {
        const err = await res.json()
        if (err.error === 'limite_alcanzado') {
          setPlanesUsados(3)
          alert('🔒 Alcanzaste el límite de 3 regeneraciones de plan en el plan gratuito.')
        } else if (err.error === 'sin_material') {
          alert('📚 Debes subir tu material de estudio (PDF o Word) para generar el plan.')
        } else if (err.error === 'archivo_no_legible') {
          alert('⚠️ No pudimos leer tu archivo. Por favor sube un PDF o Word (.docx)')
        } else if (err.error === 'archivo_muy_grande') {
          alert('⚠️ Tu archivo es muy grande. El máximo permitido es 25MB.')
        } else {
          alert('Error: ' + (err.mensaje || err.error || 'No se pudo generar el plan'))
        }
      }
    } catch (e) {
      console.error(e)
      alert('Error generando plan')
    }
    setGenerando(false)
    setArchivos([])
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
      if (res.ok) { const g = await res.json(); setGuia(g); setGuiasGeneradas(prev => ({ ...prev, [index]: true })) }
      else setGuia({ error: true })
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
  }, [evaluacion.id])

  const cargarContadores = async () => {
    try {
      const [meRes, limiteRes] = await Promise.all([
        fetch(API + '/auth/me', { headers: authHeaders() }),
        fetch(API + '/admin/limite-global', { headers: authHeaders() })
      ])
      if (meRes.ok) {
        const data = await meRes.json()
        setPodcastsUsados(data.podcasts_usados || 0)
        setEjerciciosUsados(data.ejercicios_usados || 0)
        setQuizzesUsados(data.quizzes_usados || 0)
        setPlanesUsados(data.planes_usados || 0)
      }
      if (limiteRes.ok) {
        const ldata = await limiteRes.json()
        if (ldata.limite !== undefined) setLimiteGlobal(ldata.limite)
      }
    } catch(e) {}
  }
  const cargarPodcastsUsados = cargarContadores

  const descargarEjercicios = async (tarea, tareaIndex) => {
    if (ejerciciosUsados >= limiteGlobal) return
    setDescargandoEjerciciosId(tareaIndex)
    try {
      const res = await fetch(API + '/evaluaciones/' + evaluacion.id + '/ejercicios-pdf', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarea, tareaIndex })
      })
      if (res.status === 403) {
        const data = await res.json()
        if (data.error === 'limite_alcanzado') setEjerciciosUsados(limiteGlobal)
        setDescargandoEjerciciosId(null); return
      }
      if (!res.ok) { alert('Error generando ejercicios'); setDescargandoEjerciciosId(null); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ejercicios-' + (tareaIndex + 1) + '-' + tarea.titulo.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setEjerciciosGenerados(prev => ({ ...prev, [tareaIndex]: true }))
      setEjerciciosUsados(prev => (prev || 0) + 1)
    } catch(e) { console.error(e); alert('Error descargando ejercicios') }
    setDescargandoEjerciciosId(null)
  }

  const generarPodcast = async (tareaIdx) => {
    if (podcastsUsados >= limiteGlobal) return
    setGenerandoPodcastId(tareaIdx)
    try {
      const res = await fetch(API + '/evaluaciones/' + evaluacion.id + '/podcast', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareaIdx })
      })
      if (res.status === 403) {
        const data = await res.json()
        if (data.error === 'limite_alcanzado') setPodcastsUsados(limiteGlobal)
        return
      }
      if (res.status === 400) {
        const data = await res.json()
        if (data.error === 'sin_material') alert('📚 Debes subir material de estudio para generar el podcast.')
        else alert('Error: ' + (data.mensaje || 'No se pudo generar el podcast'))
        return
      }
      if (!res.ok) { alert('Error generando podcast'); return }
      const usados = parseInt(res.headers.get('X-Podcasts-Usados') || '1')
      const titulo = decodeURIComponent(res.headers.get('X-Podcast-Titulo') || evaluacion.nombre)
      setPodcastsUsados(usados)
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

  if (mostrandoQuiz) return <Quiz evaluacion={evaluacion} ramo={ramo} onBack={() => setMostrandoQuiz(false)} />

  // Vista guía de tarea
  if (tareaActiva) return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)', padding: '56px 20px 24px' }}>
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
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Generando guía con IA...</p>
          </div>
        ) : guia && !guia.error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {guia.introduccion && (
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>📖 Introducción</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7 }}>{guia.introduccion}</p>
              </div>
            )}
            {guia.conceptos_clave?.length > 0 && (
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>🔑 Conceptos clave</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guia.conceptos_clave.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(108,99,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 4px' }}>{c.termino}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px', lineHeight: 1.6 }}>{c.definicion}</p>
                      {c.truco && <p style={{ fontSize: 12, color: '#fbbf24', margin: 0, fontStyle: 'italic' }}>🧠 {c.truco}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guia.desarrollo && (
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>📝 Desarrollo</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{guia.desarrollo}</p>
              </div>
            )}
            {guia.ejemplos?.length > 0 && (
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.15)' }}>
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
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.15)' }}>
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
              <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid rgba(56,189,248,0.2)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>🔗 Conexiones y aplicaciones reales</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{guia.conexiones}</p>
              </div>
            )}
            {guia.resumen_final && (
              <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.25)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>✅ Cheat Sheet para el examen</p>
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
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', paddingBottom: 100 }}>
      <div style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)', padding: '56px 20px 24px' }}>
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
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>📋 Resumen del plan</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px', lineHeight: 1.6 }}>{plan.resumen}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{numCompletadas}/{totalTareas} tareas completadas</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{totalTareas > 0 ? Math.round((numCompletadas/totalTareas)*100) : 0}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6 }}>
                <div style={{ height: '100%', width: `${totalTareas > 0 ? (numCompletadas/totalTareas)*100 : 0}%`, background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Tareas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {plan.tareas.map((t, i) => (
                <div key={i} style={{ background: '#1a1a2e', borderRadius: 16, padding: '14px 16px', border: `1px solid ${completadas.has(i) ? 'rgba(74,222,128,0.2)' : 'rgba(108,99,255,0.15)'}`, opacity: completadas.has(i) ? 0.7 : 1, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button onClick={() => toggleTarea(i)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${completadas.has(i) ? '#4ade80' : 'rgba(108,99,255,0.4)'}`, background: completadas.has(i) ? '#4ade80' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {completadas.has(i) ? '✓' : ''}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: completadas.has(i) ? 'rgba(255,255,255,0.4)' : 'white', margin: 0, textDecoration: completadas.has(i) ? 'line-through' : 'none' }}>{t.titulo}</p>
                        {t.prioridad && <span style={{ fontSize: 10, fontWeight: 700, color: PRIORIDAD_COLOR[t.prioridad], background: PRIORIDAD_BG[t.prioridad], padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>{t.prioridad}</span>}
                        {t.duracion && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>⏱ {t.duracion} min</span>}
                        {t.fecha && <span style={{ fontSize: 11, color: 'rgba(108,99,255,0.8)', background: 'rgba(108,99,255,0.1)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>📅 {t.fecha}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>{t.descripcion}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => verGuia(t, i)} style={{ background: 'rgba(108,99,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
  {guiasGeneradas[i] ? '📖 Ver guía' : '✨ Generar guía'}
</button>
                      <button onClick={() => descargarEjercicios(t, i)} disabled={descargandoEjerciciosId === i || ejerciciosUsados >= 5} style={{ background: ejerciciosUsados >= 5 ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: ejerciciosUsados >= 5 ? 'rgba(255,255,255,0.2)' : '#4ade80', fontSize: 12, cursor: (descargandoEjerciciosId === i || ejerciciosUsados >= 5) ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
  {descargandoEjerciciosId === i ? <><span style={spinnerStyle}></span>Generando...</> : ejerciciosUsados >= limiteGlobal ? '🔒 Límite alcanzado' : ejerciciosGenerados[i] ? '📥 Ver ejercicios PDF' : `✨ Ejercicios PDF (${limiteGlobal - (ejerciciosUsados || 0)} restantes)`}
</button>
                      {podcastsExistentes.some(p => Number(p.tarea_idx) === i) ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { const p = podcastsExistentes.find(p => Number(p.tarea_idx) === i); escucharPodcast(evaluacion.id, i, p?.titulo || '') }} style={{ background: 'rgba(251,191,36,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fbbf24', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🎧 Escuchar</button>
                          <button onClick={() => generarPodcast(i)} disabled={generandoPodcastId === i} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>
                            {generandoPodcastId === i ? <span style={spinnerStyle}></span> : '🔄'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => generarPodcast(i)} disabled={generandoPodcastId === i || podcastsUsados >= limiteGlobal} style={{ background: podcastsUsados >= limiteGlobal ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: podcastsUsados >= limiteGlobal ? 'rgba(255,255,255,0.2)' : '#fbbf24', fontSize: 12, cursor: podcastsUsados >= limiteGlobal ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                          {generandoPodcastId === i ? <><span style={spinnerStyle}></span>Generando...</> : podcastsUsados >= limiteGlobal ? '🔒 Límite alcanzado' : '🎙️ Podcast (' + (limiteGlobal - (podcastsUsados || 0)) + ' restantes)'}
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 16, border: '1px solid rgba(108,99,255,0.15)' }}>
              <button onClick={() => setMostrandoQuiz(true)} style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: 10 }}>
                🧠 Hacer Quiz
              </button>

              <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
              {archivosGuardados.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Material guardado</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {archivosGuardados.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.1)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(108,99,255,0.2)' }}>
                        <span style={{ fontSize: 14 }}>📄</span>
                        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
                        <button onClick={() => eliminarArchivo(a.id)} style={{ background: 'rgba(248,113,113,0.15)', border: 'none', borderRadius: 6, width: 24, height: 24, color: '#f87171', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 12, padding: 10, color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                {archivos.length > 0 ? `📎 ${archivos.length} archivo(s)` : '📎 Subir material (opcional)'}
              </button>
              <button onClick={generarPlan} disabled={generando || planesUsados >= limiteGlobal} style={{ width: '100%', background: (generando || planesUsados >= limiteGlobal) ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: (generando || planesUsados >= limiteGlobal) ? 'not-allowed' : 'pointer' }}>
                {generando ? <><span style={spinnerStyle}></span>Generando...</> : planesUsados >= limiteGlobal ? '🔒 Límite de regeneraciones alcanzado' : `🤖 Regenerar plan con IA (${limiteGlobal - (planesUsados || 0)} restantes)`}
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 24, border: '1.5px dashed rgba(108,99,255,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Genera tu plan de estudio</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', lineHeight: 1.5 }}>La IA creará 5 tareas priorizadas para prepararte para esta evaluación</p>
            <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
            {archivosGuardados.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Material guardado</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {archivosGuardados.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.1)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(108,99,255,0.2)' }}>
                      <span style={{ fontSize: 14 }}>📄</span>
                      <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
                      <button onClick={() => eliminarArchivo(a.id)} style={{ background: 'rgba(248,113,113,0.15)', border: 'none', borderRadius: 6, width: 24, height: 24, color: '#f87171', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 12, padding: 12, color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
              {archivos.length > 0 ? `📎 ${archivos.length} archivo(s) seleccionado(s)` : '📎 Subir material de estudio (opcional)'}
            </button>
            <button onClick={generarPlan} disabled={generando} style={{ width: '100%', background: generando ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 16, padding: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: generando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
              {generando ? '⏳ Generando plan...' : '🤖 Generar plan con IA'}
            </button>
          </div>
        )}
      </div>
      {/* Mini Player Flotante */}
      {podcast && (
        <div style={{ position: 'fixed', bottom: 20, left: 16, right: 16, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 20, padding: '14px 16px', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
    </div>
  )
}
