import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function diasParaPrueba(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const d = new Date(fecha + 'T00:00:00')
  return Math.round((d - hoy) / (1000 * 60 * 60 * 24))
}

function BadgeFecha({ fecha }) {
  const dias = diasParaPrueba(fecha)
  if (dias === null) return null
  if (dias < 0) return <span style={{ fontSize: 10, background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Pasada</span>
  if (dias === 0) return <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>¡Hoy!</span>
  if (dias === 1) return <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>¡Mañana!</span>
  if (dias <= 7) return <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
  if (dias <= 14) return <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
  return <span style={{ fontSize: 10, background: '#ede9fe', color: '#6c63ff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
}

function PlanEstudio({ ev, onClose, onUpdate }) {
  const [plan, setPlan] = useState(ev.plan_estudio || null)
  const [completadas, setCompletadas] = useState(ev.tareas_completadas || [])
  const [generando, setGenerando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [archivos, setArchivos] = useState(ev.archivos || [])
  const [guia, setGuia] = useState(null)
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)
  const [generandoGuia, setGenerandoGuia] = useState(false)
  const fileRef = useRef()

  const generarGuia = async (tarea, index, forzar = false) => {
    setTareaSeleccionada({ ...tarea, index })
    setGuia(null)
    setGenerandoGuia(true)
    try {
      const r = await fetch(`${API}/evaluaciones/${ev.id}/guia-tarea`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarea, tareaIndex: index, forzar })
      })
      const d = await r.json()
      setGuia(d)
    } catch {}
    setGenerandoGuia(false)
  }

  const descargarGuia = () => {
    const contenido = `
      <html><head><meta charset="utf-8">
      <title>${guia.titulo || tareaSeleccionada.titulo}</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; color: #1a1a2e; line-height: 1.6; }
        h1 { color: #6c63ff; border-bottom: 2px solid #6c63ff; padding-bottom: 8px; }
        h2 { color: #6c63ff; margin-top: 28px; font-size: 15px; }
        .concepto { background: #f8f7ff; border-left: 4px solid #6c63ff; padding: 10px 14px; margin: 8px 0; border-radius: 4px; }
        .ejemplo { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; margin: 8px 0; border-radius: 4px; }
        .ejercicio { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 14px; margin: 8px 0; border-radius: 4px; }
        .resumen { background: #1a1a2e; color: white; padding: 16px; border-radius: 8px; margin-top: 20px; }
        p { margin: 6px 0; }
        strong { font-weight: 700; }
      </style></head><body>
      <h1>📖 ${guia.titulo || tareaSeleccionada.titulo}</h1>
      <h2>📝 Introducción</h2><p>${guia.introduccion}</p>
      <h2>🔑 Conceptos Clave</h2>
      ${guia.conceptos_clave?.map(c => `<div class="concepto"><strong>${c.termino}</strong><p>${c.definicion}</p></div>`).join('') || ''}
      <h2>📚 Desarrollo</h2><p>${guia.desarrollo?.replace(/\n/g, '<br>')}</p>
      <h2>💡 Ejemplos Resueltos</h2>
      ${guia.ejemplos?.map((e,i) => `<div class="ejemplo"><strong>Ejemplo ${i+1}:</strong> ${e.enunciado}<br>✅ ${e.solucion}</div>`).join('') || ''}
      <h2>✏️ Ejercicios de Práctica</h2>
      ${guia.ejercicios_practica?.map((e,i) => `<div class="ejercicio"><strong>Ejercicio ${i+1}:</strong> ${e.enunciado}<br>💡 Pista: ${e.pista}</div>`).join('') || ''}
      <div class="resumen"><strong>🎯 Resumen Final</strong><p>${guia.resumen_final?.replace(/\n/g, '<br>')}</p></div>
      </body></html>
    `
    const blob = new Blob([contenido], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guia-${(tareaSeleccionada.titulo || 'estudio').replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const subirArchivo = async (file) => {
    setSubiendo(true)
    const formData = new FormData()
    formData.append('archivo', file)
    try {
      const r = await fetch(`${API}/evaluaciones/${ev.id}/archivos`, { method: 'POST', credentials: 'include', body: formData })
      const d = await r.json()
      setArchivos(prev => [...prev, d])
      onUpdate()
    } catch {}
    setSubiendo(false)
  }

  const eliminarArchivo = async (id) => {
    try {
      await fetch(`${API}/archivos/${id}`, { method: 'DELETE', credentials: 'include' })
      setArchivos(prev => prev.filter(a => a.id !== id))
      onUpdate()
    } catch {}
  }

  const generarPlan = async () => {
    setGenerando(true)
    try {
      const r = await fetch(`${API}/evaluaciones/${ev.id}/plan-estudio`, { method: 'POST', credentials: 'include' })
      const d = await r.json()
      setPlan(d)
      onUpdate()
    } catch {}
    setGenerando(false)
  }

  const toggleTarea = async (idx) => {
    const nuevas = completadas.includes(idx) ? completadas.filter(i => i !== idx) : [...completadas, idx]
    setCompletadas(nuevas)
    await fetch(`${API}/evaluaciones/${ev.id}/plan-progreso`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tareasCompletadas: nuevas })
    })
  }

  const prioridadColor = { alta: '#ef4444', media: '#f59e0b', baja: '#22c55e' }
  const progreso = plan ? Math.round((completadas.length / plan.tareas.length) * 100) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>📚 Plan de estudio</p>
            <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{ev.nombre} · {ev.ponderacion}%</p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Archivos */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 10 }}>📎 Material de estudio</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {archivos.map(a => (
              <div key={a.id} style={{ background: '#f8f7ff', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>
                    {a.tipo?.includes('pdf') ? '📄' : a.tipo?.includes('word') || a.tipo?.includes('document') ? '📝' : a.tipo?.includes('sheet') || a.tipo?.includes('excel') ? '📊' : a.tipo?.includes('presentation') || a.tipo?.includes('powerpoint') ? '📑' : '📎'}
                  </span>
                  <p style={{ fontSize: 12, color: '#1a1a2e', margin: 0, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</p>
                </div>
                <button onClick={() => eliminarArchivo(a.id)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" style={{ display: 'none' }}
            onChange={e => e.target.files[0] && subirArchivo(e.target.files[0])} />
          <button onClick={() => fileRef.current.click()} disabled={subiendo}
            style={{ width: '100%', background: '#ede9fe', color: '#6c63ff', border: '1.5px dashed #c4b5fd', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: subiendo ? 0.7 : 1 }}>
            {subiendo ? '⏳ Subiendo...' : '+ Subir archivo (PDF, Word, PPT, Excel)'}
          </button>
        </div>

        {/* Generar plan */}
        <button onClick={generarPlan} disabled={generando}
          style={{ width: '100%', background: generando ? '#e0deff' : '#6c63ff', color: generando ? '#6c63ff' : 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: generando ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
          {generando ? '🤖 Generando plan con IA...' : plan ? '🔄 Regenerar plan con IA' : '✨ Generar plan de estudio con IA'}
        </button>

        {/* Plan generado */}
        {plan && (
          <>
            <div style={{ background: '#f8f7ff', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600, margin: '0 0 4px' }}>📋 Resumen</p>
              <p style={{ fontSize: 13, color: '#1a1a2e', margin: '0 0 8px' }}>{plan.resumen}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e0deff', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: '#6c63ff', width: `${progreso}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6c63ff' }}>{progreso}%</span>
              </div>
              <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>{completadas.length}/{plan.tareas.length} tareas completadas</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.tareas.map((tarea, i) => (
                <div key={i} onClick={() => toggleTarea(i)}
                  style={{ background: completadas.includes(i) ? '#f0fdf4' : 'white', borderRadius: 14, padding: '14px', border: `1.5px solid ${completadas.includes(i) ? '#86efac' : '#e0deff'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${completadas.includes(i) ? '#22c55e' : '#c4b5fd'}`, background: completadas.includes(i) ? '#22c55e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      {completadas.includes(i) && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: completadas.includes(i) ? '#16a34a' : '#1a1a2e', margin: 0, textDecoration: completadas.includes(i) ? 'line-through' : 'none' }}>{tarea.titulo}</p>
                        <span style={{ fontSize: 10, background: `${prioridadColor[tarea.prioridad]}20`, color: prioridadColor[tarea.prioridad], padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{tarea.prioridad}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>{tarea.descripcion}</p>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#888' }}>📅 {tarea.fecha}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>⏱ {tarea.duracion} min</span>
                        <button onClick={e => { e.stopPropagation(); generarGuia(tarea, i) }} style={{ fontSize: 11, background: '#6c63ff', color: 'white', border: 'none', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', marginLeft: 'auto' }}>📖 Ver guía</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    {(tareaSeleccionada) && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { setTareaSeleccionada(null); setGuia(null) }}>
        <div style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '24px 16px 32px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a2e' }}>📖 {tareaSeleccionada.titulo}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {guia?.cached && <span style={{ fontSize: 10, color: '#888', alignSelf: 'center' }}>guardada</span>}
              {guia && <button onClick={() => generarGuia(tareaSeleccionada, tareaSeleccionada.index, true)} style={{ background: '#f3f4f6', color: '#666', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🔄 Regenerar</button>}
              {guia && <button onClick={descargarGuia} style={{ background: '#6c63ff', color: 'white', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>⬇️ Descargar</button>}
              <button onClick={() => { setTareaSeleccionada(null); setGuia(null) }} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          </div>
          {generandoGuia && <div style={{ textAlign: 'center', padding: 40, color: '#6c63ff' }}>🤖 Generando guía con IA...</div>}
          {guia && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f8f7ff', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600, margin: '0 0 6px' }}>📝 Introducción</p>
                <p style={{ fontSize: 13, color: '#1a1a2e', margin: 0, lineHeight: 1.6 }}>{guia.introduccion}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600, margin: '0 0 8px' }}>🔑 Conceptos Clave</p>
                {guia.conceptos_clave?.map((c, i) => (
                  <div key={i} style={{ background: 'white', border: '1.5px solid #e0deff', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: '0 0 4px' }}>{c.termino}</p>
                    <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{c.definicion}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f8f7ff', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600, margin: '0 0 6px' }}>📚 Desarrollo</p>
                <p style={{ fontSize: 13, color: '#1a1a2e', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{guia.desarrollo}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600, margin: '0 0 8px' }}>💡 Ejemplos Resueltos</p>
                {guia.ejemplos?.map((e, i) => (
                  <div key={i} style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', margin: '0 0 6px' }}>Ejemplo {i+1}: {e.enunciado}</p>
                    <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.5 }}>✅ {e.solucion}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600, margin: '0 0 8px' }}>✏️ Ejercicios de Práctica</p>
                {guia.ejercicios_practica?.map((e, i) => (
                  <div key={i} style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', margin: '0 0 4px' }}>Ejercicio {i+1}: {e.enunciado}</p>
                    <p style={{ fontSize: 11, color: '#15803d', margin: 0 }}>💡 Pista: {e.pista}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, margin: '0 0 6px' }}>🎯 Resumen Final</p>
                <p style={{ fontSize: 13, color: 'white', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{guia.resumen_final}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ramos, setRamos] = useState([])
  const [vista, setVista] = useState('dashboard')
  const [ramoActivo, setRamoActivo] = useState(null)
  const [step, setStep] = useState(1)
  const [nuevoRamo, setNuevoRamo] = useState({ nombre: '', minAprobacion: 4.0 })
  const [evaluaciones, setEvaluaciones] = useState([])
  const [evalTemp, setEvalTemp] = useState({ nombre: '', ponderacion: '', fecha: '' })
  const [notas, setNotas] = useState({})
  const [editando, setEditando] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const [planActivo, setPlanActivo] = useState(null)

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); cargarRamos() } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cargarRamos = async () => {
    try {
      const r = await fetch(`${API}/ramos`, { credentials: 'include' })
      const d = await r.json()
      setRamos(d)
    } catch {}
  }

  const showToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const calcularPromedioFinal = (ramo) => {
    const evs = (ramo.evaluaciones || []).filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '')
    if (evs.length === 0) return null
    const pesoTotal = evs.reduce((s, e) => s + Number(e.ponderacion), 0)
    const suma = evs.reduce((s, e) => s + (parseFloat(e.nota) * Number(e.ponderacion)), 0)
    return suma / pesoTotal
  }

  const todasRendidas = (ramo) => {
    const evs = ramo.evaluaciones || []
    return evs.length > 0 && evs.every(e => e.nota !== null && e.nota !== undefined && e.nota !== '')
  }

  const calcularNecesaria = (ramo) => {
    if (todasRendidas(ramo)) return null
    const evs = ramo.evaluaciones || []
    const evsPendientes = evs.filter(e => e.nota === null || e.nota === undefined || e.nota === '')
    const evsRendidas = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '')
    if (evsPendientes.length === 0) return null
    const pesoPendiente = evsPendientes.reduce((s, e) => s + Number(e.ponderacion), 0)
    const sumaRendida = evsRendidas.reduce((s, e) => s + (parseFloat(e.nota) * Number(e.ponderacion)), 0)
    const min = Number(ramo.min_aprobacion) || 4.0
    return (min * 100 - sumaRendida) / pesoPendiente
  }

  const getEstado = (ramo) => {
    const min = Number(ramo.min_aprobacion) || 4.0
    if (todasRendidas(ramo)) {
      const promedio = calcularPromedioFinal(ramo)
      return promedio >= min ? 'aprobado' : 'reprobado'
    }
    const necesaria = calcularNecesaria(ramo)
    if (necesaria === null) return 'al_dia'
    if (necesaria <= min) return 'al_dia'
    if (necesaria <= 5.5) return 'en_riesgo'
    return 'critico'
  }

  const estadoConfig = {
    aprobado: { color: '#22c55e', bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
    al_dia:   { color: '#22c55e', bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
    en_riesgo:{ color: '#f59e0b', bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
    critico:  { color: '#ef4444', bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
    reprobado:{ color: '#ef4444', bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
  }

  const ponderacionUsada = evaluaciones.reduce((s, e) => s + Number(e.ponderacion), 0)
  const ponderacionRestante = 100 - ponderacionUsada

  const agregarEval = () => {
    if (!evalTemp.nombre || !evalTemp.ponderacion) return
    const p = Number(evalTemp.ponderacion)
    if (p <= 0 || ponderacionUsada + p > 100) return
    setEvaluaciones([...evaluaciones, { nombre: evalTemp.nombre, ponderacion: p, fecha: evalTemp.fecha || null }])
    setEvalTemp({ nombre: '', ponderacion: '', fecha: '' })
  }

  const guardarRamo = async () => {
    if (ponderacionUsada !== 100) { showToast('Las ponderaciones deben sumar 100%', 'error'); return }
    setGuardando(true)
    try {
      const evsConNotas = evaluaciones.map((e, i) => ({ ...e, nota: notas[i] || null }))
      const r = await fetch(`${API}/ramos`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoRamo.nombre, minAprobacion: nuevoRamo.minAprobacion, evaluaciones: evsConNotas })
      })
      const d = await r.json()
      setRamos(prev => [...prev, d])
      setVista('dashboard'); setStep(1)
      setNuevoRamo({ nombre: '', minAprobacion: 4.0 }); setEvaluaciones([]); setNotas({})
      showToast('Ramo guardado correctamente 🎉')
    } catch { showToast('Error al guardar', 'error') }
    setGuardando(false)
  }

  const guardarNota = async (evalId, nota) => {
    try {
      await fetch(`${API}/evaluaciones/${evalId}/nota`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: nota !== '' ? parseFloat(nota) : null })
      })
      await cargarRamos()
      setEditando(prev => { const n = {...prev}; delete n[evalId]; return n })
      setNotas(prev => { const n = {...prev}; delete n[evalId]; return n })
      showToast('Nota guardada ✅')
    } catch { showToast('Error al guardar nota', 'error') }
  }

  const eliminarRamo = async (id) => {
    try {
      await fetch(`${API}/ramos/${id}`, { method: 'DELETE', credentials: 'include' })
      setRamos(ramos.filter(r => r.id !== id))
      setVista('dashboard'); showToast('Ramo eliminado')
    } catch { showToast('Error al eliminar', 'error') }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#6c63ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 64, height: 64, background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎓</div>
      <p style={{ color: 'white', fontSize: 14 }}>Cargando...</p>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #6c63ff 0%, #a78bfa 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 24px 40px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'white', borderRadius: 22, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎓</div>
        <h1 style={{ color: 'white', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>APPrueba</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8 }}>Calcula lo que necesitas para aprobar</p>
      </div>
      <div style={{ background: 'white', borderRadius: '28px 28px 0 0', flex: 1, padding: '32px 24px' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', marginBottom: 24 }}>Bienvenido 👋</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {[
            { icon: '📚', title: 'Guarda tus ramos', sub: 'Accede desde cualquier dispositivo' },
            { icon: '📊', title: 'Calcula al instante', sub: 'Sabe exactamente qué necesitas' },
            { icon: '🤖', title: 'Plan de estudio con IA', sub: 'Sube tu materia y Gemini te ayuda' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8f7ff', borderRadius: 14, padding: '14px 16px' }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <a href={`${API}/auth/google`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'white', border: '1.5px solid #e5e5e5', borderRadius: 16, padding: '14px 20px', textDecoration: 'none', color: '#1a1a2e', fontSize: 14, fontWeight: 600 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </a>
      </div>
    </div>
  )

  const ramosAprobados = ramos.filter(r => ['aprobado', 'al_dia'].includes(getEstado(r))).length
  const ramosEnRiesgo = ramos.filter(r => getEstado(r) === 'en_riesgo').length
  const ramosCriticos = ramos.filter(r => ['critico', 'reprobado'].includes(getEstado(r))).length

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3ff', maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toast.tipo === 'error' ? '#ef4444' : '#22c55e', color: 'white', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}

      {planActivo && (
        <PlanEstudio
          ev={planActivo}
          onClose={() => { setPlanActivo(null); cargarRamos() }}
          onUpdate={cargarRamos}
        />
      )}

      {vista === 'dashboard' && (
        <>
          <div style={{ background: '#6c63ff', padding: '48px 20px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Hola de nuevo 👋</p>
                <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>{user.name?.split(' ')[0]}</p>
              </div>
              {user.picture
                ? <img src={user.picture} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' }} />
                : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{user.name?.[0]}</div>
              }
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              <div><p style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0 }}>{ramos.length}</p><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Ramos</p></div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ color: '#86efac', fontSize: 24, fontWeight: 700, margin: 0 }}>{ramosAprobados}</p><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Al día</p>
              </div>
              <div><p style={{ color: ramosCriticos > 0 ? '#fca5a5' : '#fde68a', fontSize: 24, fontWeight: 700, margin: 0 }}>{ramosCriticos || ramosEnRiesgo}</p><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{ramosCriticos > 0 ? 'Críticos' : 'En riesgo'}</p></div>
            </div>
          </div>

          <div style={{ background: '#f4f3ff', borderRadius: '24px 24px 0 0', marginTop: -20, padding: '24px 16px', minHeight: 'calc(100vh - 200px)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 16 }}>Mis ramos</p>
            {ramos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>Sin ramos aún</p>
                <p style={{ fontSize: 13, color: '#888' }}>Agrega tu primer ramo para comenzar</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ramos.map(ramo => {
                const estado = getEstado(ramo)
                const cfg = estadoConfig[estado]
                const promedio = calcularPromedioFinal(ramo)
                const necesaria = calcularNecesaria(ramo)
                const progreso = promedio ? Math.min((promedio / 7) * 100, 100) : 0
                const proximaEv = (ramo.evaluaciones || [])
                  .filter(e => !e.nota && e.fecha)
                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]
                return (
                  <div key={ramo.id} onClick={() => { setRamoActivo(ramo); setNotas({}); setEditando({}); setVista('ramo') }}
                    style={{ background: 'white', borderRadius: 18, padding: '16px', borderLeft: `4px solid ${cfg.border}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{ramo.nombre}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: '3px 0 0' }}>{ramo.evaluaciones?.length || 0} evaluaciones · mín {ramo.min_aprobacion}</p>
                      </div>
                      <span style={{ background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                        {estado === 'aprobado' ? `✅ ${promedio?.toFixed(1)}` :
                         estado === 'reprobado' ? `❌ ${promedio?.toFixed(1)}` :
                         estado === 'al_dia' ? `✅ ${promedio?.toFixed(1) || 'OK'}` :
                         necesaria ? `💪 ${necesaria.toFixed(1)}` : '—'}
                      </span>
                    </div>
                    {proximaEv && (
                      <div style={{ marginBottom: 8 }}>
                        <BadgeFecha fecha={proximaEv.fecha} />
                        <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>{proximaEv.nombre}</span>
                      </div>
                    )}
                    <div style={{ height: 6, borderRadius: 3, background: '#e8e6ff', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: cfg.color, width: `${progreso}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => { setVista('nuevo'); setStep(1); setNuevoRamo({ nombre: '', minAprobacion: 4.0 }); setEvaluaciones([]) }}
              style={{ width: '100%', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 600, marginTop: 16, cursor: 'pointer' }}>
              + Agregar ramo
            </button>
            <button onClick={() => fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).then(() => setUser(null))}
              style={{ width: '100%', background: 'transparent', color: '#aaa', border: 'none', padding: '12px', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      {vista === 'ramo' && ramoActivo && (() => {
        const ramo = ramos.find(r => r.id === ramoActivo.id) || ramoActivo
        const necesaria = calcularNecesaria(ramo)
        const promedio = calcularPromedioFinal(ramo)
        const estado = getEstado(ramo)
        const cfg = estadoConfig[estado]
        const min = Number(ramo.min_aprobacion) || 4.0
        const terminado = todasRendidas(ramo)
        return (
          <>
            <div style={{ background: estado === 'aprobado' ? '#16a34a' : estado === 'reprobado' ? '#dc2626' : '#6c63ff', padding: '48px 20px 48px', transition: 'background 0.4s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setVista('dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
                <p style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: 0 }}>{ramo.nombre}</p>
              </div>
              {terminado ? (
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 48, margin: '0 0 8px' }}>{estado === 'aprobado' ? '🎉' : '😔'}</p>
                  <p style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{estado === 'aprobado' ? '¡Ramo aprobado!' : 'Ramo reprobado'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '0 0 12px' }}>
                    {estado === 'aprobado' ? `Promedio final: ${promedio?.toFixed(1)} · mín era ${min}` : `Promedio final: ${promedio?.toFixed(1)} · necesitabas ${min}`}
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', display: 'inline-block' }}>
                    <span style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>{promedio?.toFixed(1)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>Promedio actual</p>
                    <p style={{ color: 'white', fontSize: 32, fontWeight: 700, margin: 0 }}>{promedio ? promedio.toFixed(1) : '—'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>Necesitas</p>
                    <p style={{ color: necesaria > 6 ? '#fca5a5' : necesaria > 5 ? '#fde68a' : '#86efac', fontSize: 32, fontWeight: 700, margin: 0 }}>
                      {necesaria === null ? '✅' : necesaria > 7 ? '+7.0' : necesaria.toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#f4f3ff', borderRadius: '24px 24px 0 0', marginTop: -20, padding: '24px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 14 }}>Evaluaciones</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(ramo.evaluaciones || []).map(ev => {
                  const tieneNota = ev.nota !== null && ev.nota !== undefined && ev.nota !== ''
                  const estaEditando = editando[ev.id]
                  const necesariaEv = !tieneNota && necesaria !== null ? necesaria : null
                  const tieneArchivos = (ev.archivos || []).length > 0
                  const tienePlan = !!ev.plan_estudio
                  return (
                    <div key={ev.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', border: tieneNota && !estaEditando ? 'none' : '1.5px dashed #e0deff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: tieneNota && !estaEditando ? '#dcfce7' : '#ede9fe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: tieneNota && !estaEditando ? '#16a34a' : '#6c63ff', flexShrink: 0 }}>
                          {tieneNota && !estaEditando ? parseFloat(ev.nota).toFixed(1) : necesariaEv ? necesariaEv.toFixed(1) : '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{ev.nombre}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{ev.ponderacion}% del ramo</p>
                            {ev.fecha && <BadgeFecha fecha={ev.fecha} />}
                            {tieneArchivos && <span style={{ fontSize: 10, background: '#ede9fe', color: '#6c63ff', padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>📎 {ev.archivos.length}</span>}
                            {tienePlan && <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>🤖 Plan listo</span>}
                          </div>
                        </div>
                        {estaEditando ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min="1" max="7" step="0.1" placeholder="Nota"
                              value={notas[ev.id] ?? (tieneNota ? ev.nota : '')}
                              onChange={e => setNotas({ ...notas, [ev.id]: e.target.value })}
                              autoFocus
                              style={{ width: 64, border: '1.5px solid #6c63ff', borderRadius: 10, padding: '8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                            <button onClick={() => guardarNota(ev.id, notas[ev.id] ?? ev.nota)}
                              style={{ background: '#6c63ff', border: 'none', color: 'white', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✓</button>
                            <button onClick={() => { setEditando(prev => { const n={...prev}; delete n[ev.id]; return n }); setNotas(prev => { const n={...prev}; delete n[ev.id]; return n }) }}
                              style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                          </div>
                        ) : tieneNota ? (
                          <button onClick={() => setEditando({ ...editando, [ev.id]: true })}
                            style={{ background: '#f3f4f6', border: 'none', color: '#6b7280', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                            ✏️ Editar
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min="1" max="7" step="0.1" placeholder="Nota"
                              value={notas[ev.id] || ''}
                              onChange={e => setNotas({ ...notas, [ev.id]: e.target.value })}
                              style={{ width: 64, border: '1.5px solid #e0deff', borderRadius: 10, padding: '8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                            {notas[ev.id] && (
                              <button onClick={() => guardarNota(ev.id, notas[ev.id])}
                                style={{ background: '#6c63ff', border: 'none', color: 'white', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✓</button>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Botón plan de estudio */}
                      <button onClick={() => setPlanActivo({ ...ev, archivos: ev.archivos || [], plan_estudio: ev.plan_estudio || null, tareas_completadas: ev.tareas_completadas || [] })}
                        style={{ width: '100%', marginTop: 10, background: tienePlan ? '#f0fdf4' : '#f8f7ff', color: tienePlan ? '#16a34a' : '#6c63ff', border: `1px solid ${tienePlan ? '#86efac' : '#e0deff'}`, borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {tienePlan ? '📋 Ver plan de estudio' : '✨ Crear plan de estudio con IA'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => eliminarRamo(ramo.id)}
                style={{ width: '100%', background: 'transparent', color: '#ef4444', border: '1.5px solid #fee2e2', borderRadius: 16, padding: '12px', fontSize: 13, fontWeight: 600, marginTop: 16, cursor: 'pointer' }}>
                Eliminar ramo
              </button>
            </div>
          </>
        )
      })()}

      {vista === 'nuevo' && (
        <>
          <div style={{ background: '#6c63ff', padding: '48px 20px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => step === 1 ? setVista('dashboard') : setStep(step - 1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
              <p style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: 0 }}>Nuevo ramo</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {['Ramo', 'Evaluaciones', 'Notas'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.3)' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > i+1 ? '#86efac' : step === i+1 ? 'white' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: step === i+1 ? '#6c63ff' : step > i+1 ? '#16a34a' : 'white' }}>
                      {step > i+1 ? '✓' : i+1}
                    </div>
                    <span style={{ color: step === i+1 ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: step === i+1 ? 600 : 400 }}>{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#f4f3ff', borderRadius: '24px 24px 0 0', marginTop: -20, padding: '28px 16px', minHeight: 'calc(100vh - 220px)' }}>
            {step === 1 && (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>📝 Tu ramo</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>Ingresa los datos básicos del ramo</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Nombre del ramo</label>
                    <input value={nuevoRamo.nombre} onChange={e => setNuevoRamo({ ...nuevoRamo, nombre: e.target.value })}
                      placeholder="Ej: Cálculo I, Historia, Física..."
                      style={{ width: '100%', border: '1.5px solid #e0deff', borderRadius: 14, padding: '13px 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Nota mínima para aprobar</label>
                    <input type="number" min="1" max="7" step="0.1" value={nuevoRamo.minAprobacion}
                      onChange={e => setNuevoRamo({ ...nuevoRamo, minAprobacion: parseFloat(e.target.value) })}
                      style={{ width: '100%', border: '1.5px solid #e0deff', borderRadius: 14, padding: '13px 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white' }} />
                  </div>
                </div>
                <button onClick={() => nuevoRamo.nombre && setStep(2)} disabled={!nuevoRamo.nombre}
                  style={{ width: '100%', background: nuevoRamo.nombre ? '#6c63ff' : '#ccc', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 600, marginTop: 24, cursor: nuevoRamo.nombre ? 'pointer' : 'not-allowed' }}>
                  Siguiente →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>📊 Evaluaciones</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{nuevoRamo.nombre} · mín {nuevoRamo.minAprobacion}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {evaluaciones.map((ev, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{ev.nombre}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{ev.ponderacion}%</p>
                          {ev.fecha && <BadgeFecha fecha={ev.fecha} />}
                        </div>
                      </div>
                      <button onClick={() => setEvaluaciones(evaluaciones.filter((_, j) => j !== i))}
                        style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
                  <input value={evalTemp.nombre} onChange={e => setEvalTemp({ ...evalTemp, nombre: e.target.value })}
                    placeholder="Nombre de la evaluación"
                    style={{ width: '100%', border: '1.5px solid #e0deff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <input type="number" value={evalTemp.ponderacion} onChange={e => setEvalTemp({ ...evalTemp, ponderacion: e.target.value })}
                      placeholder="%" min="1" max="100"
                      style={{ width: 70, border: '1.5px solid #e0deff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none' }} />
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e8e6ff', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: ponderacionUsada >= 100 ? '#ef4444' : '#6c63ff', width: `${Math.min(ponderacionUsada, 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ponderacionRestante === 0 ? '#22c55e' : '#6c63ff', minWidth: 36 }}>{ponderacionRestante}%</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>📅 Fecha de la prueba (opcional)</label>
                    <input type="date" value={evalTemp.fecha} onChange={e => setEvalTemp({ ...evalTemp, fecha: e.target.value })}
                      style={{ width: '100%', border: '1.5px solid #e0deff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: evalTemp.fecha ? '#1a1a2e' : '#aaa' }} />
                  </div>
                  <button onClick={agregarEval} disabled={!evalTemp.nombre || !evalTemp.ponderacion || ponderacionRestante <= 0}
                    style={{ width: '100%', background: '#ede9fe', color: '#6c63ff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + Agregar
                  </button>
                </div>
                <button onClick={() => evaluaciones.length > 0 && ponderacionUsada === 100 && setStep(3)}
                  disabled={evaluaciones.length === 0 || ponderacionUsada !== 100}
                  style={{ width: '100%', background: evaluaciones.length > 0 && ponderacionUsada === 100 ? '#6c63ff' : '#ccc', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 600, cursor: evaluaciones.length > 0 && ponderacionUsada === 100 ? 'pointer' : 'not-allowed' }}>
                  {ponderacionUsada === 100 ? 'Siguiente →' : `Faltan ${ponderacionRestante}% por asignar`}
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>🎯 Notas iniciales</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Ingresa las notas que ya tienes (opcional)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {evaluaciones.map((ev, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1.5px dashed #e0deff' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{ev.nombre}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{ev.ponderacion}%</p>
                          {ev.fecha && <BadgeFecha fecha={ev.fecha} />}
                        </div>
                      </div>
                      <input type="number" min="1" max="7" step="0.1" placeholder="Nota"
                        value={notas[i] || ''}
                        onChange={e => setNotas({ ...notas, [i]: e.target.value })}
                        style={{ width: 70, border: '1.5px solid #e0deff', borderRadius: 10, padding: '8px', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                <button onClick={guardarRamo} disabled={guardando}
                  style={{ width: '100%', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando...' : '🎉 Crear ramo'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App
