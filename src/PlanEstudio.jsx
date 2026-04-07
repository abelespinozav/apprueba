import { useState, useRef } from 'react'

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
  const [archivos, setArchivos] = useState([])
  const [tareaActiva, setTareaActiva] = useState(null)
  const [guia, setGuia] = useState(null)
  const [cargandoGuia, setCargandoGuia] = useState(false)
  const fileRef = useRef()

  const diasRestantes = evaluacion.fecha
    ? Math.round((new Date(evaluacion.fecha + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000)
    : null

  const generarPlan = async () => {
    setGenerando(true)
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
      } else {
        const err = await res.json()
        alert('Error: ' + (err.error || 'No se pudo generar el plan'))
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
      if (res.ok) setGuia(await res.json())
      else setGuia({ error: true })
    } catch (e) { setGuia({ error: true }) }
    setCargandoGuia(false)
  }

  const totalTareas = plan?.tareas?.length || 0
  const numCompletadas = completadas.size

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
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{c.definicion}</p>
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
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.solucion}</p>
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: '0 0 6px' }}>{i+1}. {e.enunciado}</p>
                      <p style={{ fontSize: 12, color: '#4ade80', margin: 0 }}>💡 Pista: {e.pista}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {guia.resumen_final && (
              <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', borderRadius: 16, padding: 20, border: '1px solid rgba(108,99,255,0.25)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>✅ Resumen final</p>
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
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>{t.descripcion}</p>
                      <button onClick={() => verGuia(t, i)} style={{ background: 'rgba(108,99,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>📖 Ver guía</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 16, border: '1px solid rgba(108,99,255,0.15)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: '0 0 10px' }}>🔄 Regenerar plan</p>
              <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
              <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 12, padding: 10, color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                {archivos.length > 0 ? `📎 ${archivos.length} archivo(s)` : '📎 Subir material (opcional)'}
              </button>
              <button onClick={generarPlan} disabled={generando} style={{ width: '100%', background: generando ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: generando ? 'not-allowed' : 'pointer' }}>
                {generando ? '⏳ Generando...' : '🤖 Regenerar plan con IA'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 24, border: '1.5px dashed rgba(108,99,255,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Genera tu plan de estudio</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', lineHeight: 1.5 }}>La IA creará 5 tareas priorizadas para prepararte para esta evaluación</p>
            <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setArchivos(Array.from(e.target.files))} />
            <button onClick={() => fileRef.current.click()} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 12, padding: 12, color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
              {archivos.length > 0 ? `📎 ${archivos.length} archivo(s) seleccionado(s)` : '📎 Subir material de estudio (opcional)'}
            </button>
            <button onClick={generarPlan} disabled={generando} style={{ width: '100%', background: generando ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 16, padding: 14, color: 'white', fontSize: 15, fontWeight: 700, cursor: generando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
              {generando ? '⏳ Generando plan...' : '🤖 Generar plan con IA'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
