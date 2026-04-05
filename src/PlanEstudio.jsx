import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

const PRIORIDAD_COLOR = { alta: '#f87171', media: '#fbbf24', baja: '#4ade80' }
const PRIORIDAD_BG = { alta: 'rgba(248,113,113,0.12)', media: 'rgba(251,191,36,0.12)', baja: 'rgba(74,222,128,0.12)' }

function EvaluacionDiagnostica({ planId, notaMinima, onBack }) {
  const [estado, setEstado] = useState('inicio') // inicio | cargando | respondiendo | resultado
  const [preguntas, setPreguntas] = useState([])
  const [evalId, setEvalId] = useState(null)
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [verDetalle, setVerDetalle] = useState(false)

  const generarEvaluacion = async () => {
    setEstado('cargando')
    try {
      const res = await fetch(`${API}/evaluaciones-ia/generar/${planId}`, {
        method: 'POST',
        headers: authHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setPreguntas(data.preguntas)
        setEvalId(data.id)
        setRespuestas({})
        setPreguntaActual(0)
        setEstado('respondiendo')
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
        setEstado('inicio')
      }
    } catch (e) { console.error(e); setEstado('inicio') }
  }

  const responder = (numero, alternativa) => {
    setRespuestas(r => ({ ...r, [numero.toString()]: alternativa }))
  }

  const siguiente = () => {
    if (preguntaActual < preguntas.length - 1) setPreguntaActual(p => p + 1)
  }

  const anterior = () => {
    if (preguntaActual > 0) setPreguntaActual(p => p - 1)
  }

  const corregir = async () => {
    const sinResponder = preguntas.filter(p => !respuestas[p.numero.toString()])
    if (sinResponder.length > 0) {
      if (!confirm(`Tienes ${sinResponder.length} pregunta(s) sin responder. ¿Enviar igual?`)) return
    }
    setEstado('cargando')
    try {
      const res = await fetch(`${API}/evaluaciones-ia/corregir/${evalId}`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ respuestas })
      })
      if (res.ok) {
        const data = await res.json()
        setResultado(data)
        setEstado('resultado')
      } else {
        alert('Error al corregir')
        setEstado('respondiendo')
      }
    } catch (e) { console.error(e); setEstado('respondiendo') }
  }

  const COLOR_RESULTADO = { green: '#4ade80', yellow: '#fbbf24', orange: '#fb923c', red: '#f87171' }
  const respondidas = Object.keys(respuestas).length

  if (estado === 'inicio') return (
    <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 20, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
      <p style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Evaluación Diagnóstica</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.6 }}>20 preguntas de opción múltiple generadas por IA basadas en tu plan de estudio. Al finalizar sabrás si estás listo/a para aprobar.</p>
      <button onClick={generarEvaluacion} style={{ width: '100%', background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 14, padding: '14px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
        🚀 Iniciar evaluación
      </button>
    </div>
  )

  if (estado === 'cargando') return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Generando preguntas con IA...</p>
    </div>
  )

  if (estado === 'respondiendo') {
    const p = preguntas[preguntaActual]
    const respuestaActual = respuestas[p.numero.toString()]
    return (
      <div>
        {/* Progreso */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Pregunta {preguntaActual + 1} de {preguntas.length}</span>
            <span style={{ fontSize: 12, color: '#a78bfa' }}>{respondidas}/{preguntas.length} respondidas</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5 }}>
            <div style={{ height: '100%', width: `${((preguntaActual+1)/preguntas.length)*100}%`, background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Pregunta */}
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid rgba(108,99,255,0.2)', marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: '0 0 20px', lineHeight: 1.6 }}>{p.numero}. {p.pregunta}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(p.alternativas).map(([letra, texto]) => (
              <button key={letra} onClick={() => responder(p.numero, letra)} style={{
                background: respuestaActual === letra ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${respuestaActual === letra ? '#6c63ff' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '12px 16px', color: respuestaActual === letra ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: respuestaActual === letra ? 600 : 400,
                transition: 'all 0.15s'
              }}>
                <span style={{ fontWeight: 700, marginRight: 10, color: respuestaActual === letra ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>{letra}.</span>{texto}
              </button>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={anterior} disabled={preguntaActual === 0} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: preguntaActual === 0 ? 'not-allowed' : 'pointer' }}>← Anterior</button>
          {preguntaActual < preguntas.length - 1
            ? <button onClick={siguiente} style={{ flex: 1, background: 'rgba(108,99,255,0.2)', border: 'none', borderRadius: 12, padding: '12px', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Siguiente →</button>
            : <button onClick={corregir} style={{ flex: 1, background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✅ Entregar</button>
          }
        </div>

        {/* Mini mapa de preguntas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {preguntas.map((pr, i) => (
            <button key={i} onClick={() => setPreguntaActual(i)} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: i === preguntaActual ? '#6c63ff' : respuestas[pr.numero.toString()] ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)',
              color: i === preguntaActual ? 'white' : respuestas[pr.numero.toString()] ? '#4ade80' : 'rgba(255,255,255,0.3)'
            }}>{i + 1}</button>
          ))}
        </div>
      </div>
    )
  }

  if (estado === 'resultado' && resultado) {
    const colorNota = COLOR_RESULTADO[resultado.color]
    return (
      <div>
        {/* Resultado principal */}
        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 24, border: `1px solid ${colorNota}33`, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: colorNota, marginBottom: 4 }}>{resultado.nota}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{resultado.correctas}/{resultado.total} correctas · {resultado.porcentaje}%</div>
          <div style={{ background: `${colorNota}15`, border: `1px solid ${colorNota}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: colorNota, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>{resultado.diagnostico}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colorNota }}>{resultado.nota}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Tu nota</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{resultado.nota_minima}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Mínimo requerido</div>
            </div>
          </div>
        </div>

        {/* Detalle de respuestas */}
        <button onClick={() => setVerDetalle(!verDetalle)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: verDetalle ? 12 : 16 }}>
          {verDetalle ? '▲ Ocultar detalle' : '▼ Ver corrección detallada'}
        </button>

        {verDetalle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {resultado.detalle.map((p, i) => (
              <div key={i} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 16px', border: `1px solid ${p.es_correcta ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{p.es_correcta ? '✅' : '❌'}</span>
                  <p style={{ fontSize: 13, color: 'white', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{p.numero}. {p.pregunta}</p>
                </div>
                <div style={{ paddingLeft: 26 }}>
                  {!p.es_correcta && (
                    <p style={{ fontSize: 12, color: '#f87171', margin: '0 0 4px' }}>Tu respuesta: <strong>{p.respuesta_usuario}</strong> — {p.alternativas[p.respuesta_usuario]}</p>
                  )}
                  <p style={{ fontSize: 12, color: '#4ade80', margin: '0 0 6px' }}>Correcta: <strong>{p.correcta}</strong> — {p.alternativas[p.correcta]}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{p.explicacion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { setEstado('inicio'); setResultado(null) }} style={{ width: '100%', background: 'rgba(108,99,255,0.15)', border: 'none', borderRadius: 14, padding: '13px', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          🔄 Volver a intentar
        </button>
      </div>
    )
  }

  return null
}

export default function PlanEstudio({ evaluacion, ramo, onBack }) {
  const [plan, setPlan] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [archivos, setArchivos] = useState([])
  const [tareaActiva, setTareaActiva] = useState(null)
  const [vistaEval, setVistaEval] = useState(false)
  const fileRef = useRef()

  const diasRestantes = evaluacion.fecha
    ? Math.round((new Date(evaluacion.fecha + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
    : null

  useEffect(() => { cargarPlan() }, [evaluacion.id])

  const cargarPlan = async () => {
    setCargando(true)
    try {
      const res = await fetch(`${API}/planes/${evaluacion.id}`, { headers: authHeaders() })
      if (res.ok) { const data = await res.json(); setPlan(data) }
    } catch (e) { console.error(e) }
    setCargando(false)
  }

  const generarPlan = async () => {
    setGenerando(true)
    try {
      const form = new FormData()
      form.append('evaluacion_id', evaluacion.id)
      form.append('nombre_evaluacion', evaluacion.nombre)
      form.append('nombre_ramo', ramo.nombre)
      form.append('ponderacion', evaluacion.ponderacion)
      if (diasRestantes !== null) form.append('dias_restantes', diasRestantes)
      archivos.forEach(f => form.append('archivos', f))
      const res = await fetch(`${API}/planes/generar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: form
      })
      if (res.ok) { const data = await res.json(); setPlan(data) }
      else { const err = await res.json(); alert('Error: ' + err.error) }
    } catch (e) { console.error(e); alert('Error generando plan') }
    setGenerando(false)
    setArchivos([])
  }

  const toggleTarea = async (tarea) => {
    const nueva = !tarea.completada
    try {
      await fetch(`${API}/planes/tarea/${tarea.id}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ completada: nueva })
      })
      setPlan(p => ({ ...p, tareas: p.tareas.map(t => t.id === tarea.id ? { ...t, completada: nueva } : t) }))
    } catch (e) { console.error(e) }
  }

  const completadas = plan?.tareas?.filter(t => t.completada).length || 0
  const total = plan?.tareas?.length || 0

  if (tareaActiva) return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)', padding: '56px 20px 24px' }}>
        <button onClick={() => setTareaActiva(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>← Volver al plan</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIORIDAD_COLOR[tareaActiva.prioridad], background: PRIORIDAD_BG[tareaActiva.prioridad], padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{tareaActiva.prioridad}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>⏱ {tareaActiva.tiempo_estimado}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>{tareaActiva.nombre}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{tareaActiva.descripcion}</p>
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📖 Guía de estudio</p>
        <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid rgba(108,99,255,0.15)', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {tareaActiva.guia}
        </div>
      </div>
    </div>
  )

  if (vistaEval) return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)', padding: '56px 20px 24px' }}>
        <button onClick={() => setVistaEval(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>← Volver al plan</button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>🎯 Evaluación Diagnóstica</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{evaluacion.nombre} · {ramo.nombre}</p>
      </div>
      <div style={{ padding: '20px' }}>
        <EvaluacionDiagnostica planId={plan.id} notaMinima={ramo.min_aprobacion || 4.0} onBack={() => setVistaEval(false)} />
      </div>
    </div>
  )

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
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Cargando...</div>
        ) : plan ? (
          <>
            {/* Resumen */}
            <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>📋 Resumen del plan</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px', lineHeight: 1.6 }}>{plan.resumen}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{completadas}/{total} tareas completadas</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{total > 0 ? Math.round((completadas/total)*100) : 0}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${total > 0 ? (completadas/total)*100 : 0}%`, background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Tareas */}
            <p style={{ fontSize: 11, fontWeight: 600, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Tareas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {plan.tareas.map((t) => (
                <div key={t.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: '14px 16px', border: `1px solid ${t.completada ? 'rgba(74,222,128,0.2)' : 'rgba(108,99,255,0.15)'}`, opacity: t.completada ? 0.7 : 1, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button onClick={() => toggleTarea(t)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.completada ? '#4ade80' : 'rgba(108,99,255,0.4)'}`, background: t.completada ? '#4ade80' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {t.completada ? '✓' : ''}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: t.completada ? 'rgba(255,255,255,0.4)' : 'white', margin: 0, textDecoration: t.completada ? 'line-through' : 'none' }}>{t.nombre}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: PRIORIDAD_COLOR[t.prioridad], background: PRIORIDAD_BG[t.prioridad], padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>{t.prioridad}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>⏱ {t.tiempo_estimado}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>{t.descripcion}</p>
                      <button onClick={() => setTareaActiva(t)} style={{ background: 'rgba(108,99,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>📖 Ver guía</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Evaluación Diagnóstica */}
            <button onClick={() => setVistaEval(true)} style={{ width: '100%', background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 16, padding: '16px', color: '#fbbf24', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              🎯 Evaluarme — ¿Estoy listo/a?
            </button>

            {/* Regenerar */}
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '16px', border: '1px solid rgba(108,99,255,0.15)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: '0 0 10px' }}>🔄 Regenerar plan</p>
              <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
              <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 12, padding: '10px', color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                {archivos.length > 0 ? `📎 ${archivos.length} archivo(s) seleccionado(s)` : '📎 Subir material (opcional)'}
              </button>
              <button onClick={generarPlan} disabled={generando} style={{ width: '100%', background: generando ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: generando ? 'not-allowed' : 'pointer' }}>
                {generando ? '⏳ Generando...' : '🤖 Regenerar plan con IA'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '24px', border: '1.5px dashed rgba(108,99,255,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Genera tu plan de estudio</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', lineHeight: 1.5 }}>La IA creará 5 tareas priorizadas para prepararte para esta evaluación</p>
            <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
            <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 12, padding: '12px', color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
              {archivos.length > 0 ? `📎 ${archivos.length} archivo(s) seleccionado(s)` : '📎 Subir material de estudio (opcional)'}
            </button>
            <button onClick={generarPlan} disabled={generando} style={{ width: '100%', background: generando ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 16, padding: '14px', color: 'white', fontSize: 15, fontWeight: 700, cursor: generando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
              {generando ? '⏳ Generando plan...' : '🤖 Generar plan con IA'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
