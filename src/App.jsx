import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

const FRASES = [
  "El éxito es la suma de pequeños esfuerzos repetidos cada día 💪",
  "No estudias para el profe, estudias para ti 🎯",
  "Cada nota es una oportunidad de mejorar 📈",
  "La constancia vence al talento cuando el talento no es constante 🔥",
  "Un día a la vez, una prueba a la vez ✨",
  "El esfuerzo de hoy es el resultado de mañana 🌟",
  "Tú puedes con esto y más 🚀",
]

function diasParaPrueba(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const str = typeof fecha === 'string' ? fecha.substring(0,10) : fecha
  const d = new Date(str + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return Math.round((d - hoy) / (1000 * 60 * 60 * 24))
}

function BadgeFecha({ fecha }) {
  const dias = diasParaPrueba(fecha)
  if (dias === null) return null
  if (dias < 0) return <span style={{ fontSize: 10, background: '#1a1a2e', color: '#9ca3af', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Pasada</span>
  if (dias === 0) return <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>¡Hoy!</span>
  if (dias === 1) return <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>¡Mañana!</span>
  if (dias <= 7) return <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
  if (dias <= 14) return <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
  return <span style={{ fontSize: 10, background: 'rgba(108,99,255,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
}

function BackgroundOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', top: -80, left: -80, animation: 'orbMove1 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', top: '40%', right: -60, animation: 'orbMove2 15s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', bottom: 100, left: '20%', animation: 'orbMove3 18s ease-in-out infinite' }} />
      <style>{`
        @keyframes orbMove1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
        @keyframes orbMove2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,40px)} }
        @keyframes orbMove3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  )
}

function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, left: Math.random() * 100,
    color: ['#6c63ff','#a78bfa','#f59e0b','#22c55e','#ec4899','#38bdf8'][Math.floor(Math.random() * 6)],
    delay: Math.random() * 1.5, size: 6 + Math.random() * 8, duration: 2 + Math.random() * 2,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: 0, width: p.size, height: p.size, borderRadius: Math.random() > 0.5 ? '50%' : 2, background: p.color, opacity: 0, animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  )
}

function WidgetMotivacional() {
  const frase = FRASES[new Date().getDay() % FRASES.length]
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, animation: 'slideUp 0.5s ease' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6c63ff', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>💡 Frase del día</p>
      <p style={{ fontSize: 13, color: '#c4b5fd', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{frase}</p>
    </div>
  )
}

function calcular(evaluaciones, min) {
  const evs = evaluaciones.map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0, nota: (e.nota !== null && e.nota !== undefined && e.nota !== '') ? parseFloat(e.nota) : null }))
  const pendientes = evs.filter(e => e.nota === null)
  const completadas = evs.filter(e => e.nota !== null)
  const pesoTotal = evs.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoCompleto = Math.abs(pesoTotal - 100) < 0.01

  if (pendientes.length === 0 && completadas.length === 0) return { promedio: null, necesaria: null, estado: null, pendientesCount: 0, pesoCompleto: false, pesoTotal }
  if (pendientes.length === 0) {
    const promedio = completadas.reduce((acc, e) => acc + e.nota * (e.ponderacion / 100), 0)
    return { promedio, necesaria: null, estado: promedio >= parseFloat(min) ? 'aprobado' : 'reprobado', pendientesCount: 0, pesoCompleto, pesoTotal }
  }
  const pesoCompletado = completadas.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoPendiente = pendientes.reduce((acc, e) => acc + e.ponderacion, 0)
  const puntajeActual = completadas.reduce((acc, e) => acc + e.nota * (e.ponderacion / 100), 0)
  const promedioActual = pesoCompletado > 0 ? (puntajeActual / (pesoCompletado / 100)) : null
  const necesaria = (pesoCompleto && pesoPendiente > 0) ? ((parseFloat(min) - puntajeActual) / (pesoPendiente / 100)) : null
  return { promedio: promedioActual, necesaria, estado: null, pendientesCount: pendientes.length, pesoCompleto, pesoTotal }
}

function notaColor(nota) {
  if (nota === null || nota === undefined) return '#a78bfa'
  if (nota >= 5.5) return '#4ade80'
  if (nota >= 4.0) return '#fbbf24'
  return '#f87171'
}

function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <BackgroundOrbs />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'slideUp 0.6s ease' }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>📚</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: '0 0 8px', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>APPrueba</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 48px' }}>Tu compañero académico inteligente</p>
        <button onClick={onLogin} style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', color: 'white', border: 'none', borderRadius: 16, padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto', boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.9C9.8 39.8 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24 }}>Guarda tu progreso académico de forma segura</p>
      </div>
    </div>
  )
}

function RamosScreen({ ramos, onSelect, onAdd, onLogout, usuario }) {
  const [nuevo, setNuevo] = useState('')
  const [min, setMin] = useState('4.0')
  const [mostrando, setMostrando] = useState(false)

  const agregar = () => {
    if (!nuevo.trim()) return
    onAdd({ nombre: nuevo.trim(), min_aprobacion: parseFloat(min) || 4.0 })
    setNuevo(''); setMin('4.0'); setMostrando(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '0 0 100px' }}>
      <BackgroundOrbs />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '56px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Hola, {usuario?.nombre?.split(' ')[0] || 'estudiante'} 👋</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>Mis Ramos</h1>
          </div>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Salir</button>
        </div>
        <div style={{ padding: '0 16px' }}>
          <WidgetMotivacional />
          {ramos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aún no tienes ramos.<br/>¡Agrega tu primer ramo!</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {ramos.map((r, i) => {
              const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
              const calc = evs.length > 0 ? calcular(evs, r.min_aprobacion) : null
              const completadas = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '').length
              const total = evs.length
              const progreso = total > 0 ? (completadas / total) * 100 : 0
              return (
                <div key={r.id} onClick={() => onSelect(r)} style={{ background: '#1a1a2e', borderRadius: 20, padding: '18px 20px', cursor: 'pointer', border: '1px solid rgba(108,99,255,0.15)', animation: `slideUp 0.4s ${i * 0.07}s ease both`, transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,99,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{r.nombre}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Mín: {r.min_aprobacion} · {completadas}/{total} evaluaciones</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {calc ? (
                        calc.estado ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: calc.estado === 'aprobado' ? '#4ade80' : '#f87171', background: calc.estado === 'aprobado' ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)', padding: '4px 10px', borderRadius: 20 }}>
                            {calc.estado === 'aprobado' ? '✓ Aprobado' : '✗ Reprobado'}
                          </span>
                        ) : calc.necesaria !== null ? (
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Necesitas</p>
                            <p style={{ fontSize: 22, fontWeight: 800, color: calc.necesaria > 6 ? '#f87171' : calc.necesaria > 5 ? '#fbbf24' : '#4ade80', margin: 0 }}>
                              {calc.necesaria > 7 ? '+7.0' : calc.necesaria.toFixed(1)}
                            </p>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>Faltan evaluaciones</span>
                        )
                      ) : (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Sin notas</span>
                      )}
                    </div>
                  </div>
                  {total > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progreso}%`, background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {mostrando ? (
            <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '20px', border: '1.5px solid rgba(108,99,255,0.3)', animation: 'slideUp 0.3s ease' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 16px' }}>Nuevo ramo</p>
              <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Nombre del ramo" onKeyDown={e => e.key === 'Enter' && agregar()}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Nota mínima de aprobación</p>
                <input type="number" min="1" max="7" step="0.1" value={min} onChange={e => setMin(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setMostrando(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={agregar} style={{ flex: 2, background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setMostrando(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 16, padding: '16px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
              + Agregar ramo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RamoScreen({ ramo, onBack, onUpdate, onDelete }) {
  const [notas, setNotas] = useState({})
  const [editando, setEditando] = useState({})
  const [nuevaEv, setNuevaEv] = useState({ nombre: '', ponderacion: '', fecha: '' })
  const [mostrando, setMostrando] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const evs = (ramo.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
  const { promedio, necesaria, estado, pendientesCount, pesoCompleto, pesoTotal } = calcular(evs, ramo.min_aprobacion)
  const pesoUsado = evs.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoDisponible = Math.round((100 - pesoUsado) * 10) / 10
  const completadasCount = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '').length
  const colorNecesaria = necesaria === null ? '#a78bfa' : necesaria > 6 ? '#f87171' : necesaria > 5 ? '#fbbf24' : '#4ade80'

  const guardarNota = (ev) => {
    const nota = notas[ev.id]
    if (nota === undefined || nota === '') return
    const nueva = parseFloat(nota)
    if (isNaN(nueva) || nueva < 1 || nueva > 7) return
    const nuevasEvs = evs.map(e => e.id === ev.id ? { ...e, nota: nueva } : e)
    onUpdate({ ...ramo, evaluaciones: nuevasEvs })
    setEditando({ ...editando, [ev.id]: false })
    setNotas({ ...notas, [ev.id]: undefined })
    const calc = calcular(nuevasEvs, ramo.min_aprobacion)
    if (calc.estado === 'aprobado') { setConfetti(true); setTimeout(() => setConfetti(false), 4000) }
  }

  const agregarEv = () => {
    if (!nuevaEv.nombre.trim() || !nuevaEv.ponderacion) return
    const pond = parseFloat(nuevaEv.ponderacion)
    if (isNaN(pond) || pond <= 0 || pond > pesoDisponible) return
    const ev = { id: Date.now(), nombre: nuevaEv.nombre.trim(), ponderacion: pond, fecha: nuevaEv.fecha || null, nota: null }
    onUpdate({ ...ramo, evaluaciones: [...evs, ev] })
    setNuevaEv({ nombre: '', ponderacion: '', fecha: '' }); setMostrando(false)
  }

  const eliminarEv = (id) => onUpdate({ ...ramo, evaluaciones: evs.filter(e => e.id !== id) })

  const proximaEv = evs.filter(e => (e.nota === null || e.nota === undefined || e.nota === '') && e.fecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]

  // Mensaje resumen inteligente
  const MensajeResumen = () => {
    if (estado) return null
    // Faltan evaluaciones para llegar al 100%
    if (!pesoCompleto && pesoDisponible > 0) {
      return (
        <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 14, padding: '12px 16px' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
            ⚠️ Aún te faltan evaluaciones — llevas <strong style={{ color: '#a78bfa' }}>{pesoTotal}%</strong> del 100% del ramo. Agrega las evaluaciones restantes para calcular tu nota necesaria.
          </p>
        </div>
      )
    }
    // 100% cargado, sin notas aún
    if (pesoCompleto && completadasCount === 0) {
      return (
        <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 14, padding: '12px 16px' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>📌 Ingresa tus notas para ver cuánto necesitas en las restantes</p>
        </div>
      )
    }
    // 100% cargado, con notas y pendientes
    if (pesoCompleto && necesaria !== null && pendientesCount > 0) {
      return (
        <div style={{ background: necesaria > 6 ? 'rgba(239,68,68,0.1)' : necesaria > 5 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${necesaria > 6 ? 'rgba(239,68,68,0.25)' : necesaria > 5 ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`, borderRadius: 14, padding: '12px 16px' }}>
          <p style={{ fontSize: 13, color: 'white', margin: 0, lineHeight: 1.5 }}>
            📌 Necesitas <strong style={{ color: colorNecesaria }}>{necesaria.toFixed(1)}</strong> en promedio en {pendientesCount === 1 ? 'la evaluación restante' : `las ${pendientesCount} evaluaciones restantes`}
            {necesaria <= 4 && <span style={{ color: '#4ade80' }}> — ¡vas muy bien! 🚀</span>}
            {necesaria > 4 && necesaria <= 5.5 && <span style={{ color: '#fbbf24' }}> — ¡tú puedes! 💪</span>}
            {necesaria > 5.5 && necesaria <= 6.5 && <span style={{ color: '#fb923c' }}> — va a costar, pero es posible 😤</span>}
            {necesaria > 6.5 && <span style={{ color: '#f87171' }}> — muy difícil, pero no imposible 😓</span>}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', paddingBottom: 100 }}>
      <Confetti active={confetti} />
      <BackgroundOrbs />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)', padding: '56px 20px 24px' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>← Volver</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>{ramo.nombre}</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Mínimo para aprobar: {ramo.min_aprobacion}</p>
            </div>
            <button onClick={() => { if(window.confirm('¿Eliminar este ramo?')) onDelete(ramo.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '8px 12px', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
          </div>

          {proximaEv && (
            <div style={{ marginBottom: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⏰</span>
              <div>
                <p style={{ fontSize: 11, color: '#fbbf24', margin: 0, fontWeight: 600 }}>Próxima evaluación</p>
                <p style={{ fontSize: 13, color: 'white', margin: 0 }}>{proximaEv.nombre} · <BadgeFecha fecha={proximaEv.fecha} /></p>
              </div>
            </div>
          )}

          {estado ? (
            <div style={{ background: estado === 'aprobado' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', borderRadius: 20, padding: '20px', border: `1px solid ${estado === 'aprobado' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, textAlign: 'center', animation: 'slideUp 0.4s ease' }}>
              <p style={{ fontSize: 32 }}>{estado === 'aprobado' ? '🎉' : '😔'}</p>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>{estado === 'aprobado' ? '¡Ramo aprobado!' : 'Ramo reprobado'}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio final: <strong style={{ color: estado === 'aprobado' ? '#4ade80' : '#f87171' }}>{promedio?.toFixed(1)}</strong></p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'rgba(108,99,255,0.12)', borderRadius: 16, padding: '14px 10px', border: '1px solid rgba(108,99,255,0.2)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', lineHeight: 1.4 }}>Promedio{'\n'}actual</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: promedio ? notaColor(promedio) : 'rgba(255,255,255,0.3)', margin: 0 }}>{promedio ? promedio.toFixed(1) : '—'}</p>
                </div>
                <div style={{ background: 'rgba(108,99,255,0.12)', borderRadius: 16, padding: '14px 10px', border: '1px solid rgba(108,99,255,0.2)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', lineHeight: 1.4 }}>Nota{'\n'}necesaria</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: colorNecesaria, margin: 0 }}>
                    {necesaria === null ? '—' : necesaria.toFixed(1)}
                  </p>
                </div>
                <div style={{ background: 'rgba(108,99,255,0.12)', borderRadius: 16, padding: '14px 10px', border: '1px solid rgba(108,99,255,0.2)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', lineHeight: 1.4 }}>Evaluaciones{'\n'}pendientes</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: pendientesCount === 0 ? '#4ade80' : '#a78bfa', margin: 0 }}>{pendientesCount}</p>
                </div>
              </div>
              <MensajeResumen />
            </>
          )}
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#4a4a6a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Evaluaciones · {pesoUsado}% usado</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {evs.map((ev, idx) => {
              const tieneNota = ev.nota !== null && ev.nota !== undefined && ev.nota !== ''
              const notaVal = tieneNota ? parseFloat(ev.nota) : null
              const estaEditando = editando[ev.id]
              return (
                <div key={ev.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: '14px 16px', border: tieneNota && !estaEditando ? '1px solid rgba(108,99,255,0.15)' : '1.5px dashed rgba(108,99,255,0.3)', animation: `slideUp 0.3s ${idx * 0.05}s ease both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: tieneNota && !estaEditando ? `${notaColor(notaVal)}22` : 'rgba(108,99,255,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tieneNota && !estaEditando ? 15 : 18, fontWeight: 800, color: tieneNota && !estaEditando ? notaColor(notaVal) : '#6c63ff', flexShrink: 0, border: tieneNota && !estaEditando ? `1.5px solid ${notaColor(notaVal)}44` : '1.5px solid rgba(108,99,255,0.2)' }}>
                      {tieneNota && !estaEditando ? notaVal.toFixed(1) : '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{ev.nombre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: '#6c63ff', fontWeight: 600, background: 'rgba(108,99,255,0.12)', padding: '1px 7px', borderRadius: 20 }}>{ev.ponderacion}%</span>
                        {ev.fecha && <BadgeFecha fecha={ev.fecha} />}
                      </div>
                    </div>
                    {estaEditando ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="number" min="1" max="7" step="0.1" placeholder="Nota"
                          value={notas[ev.id] ?? ''}
                          onChange={e => setNotas({ ...notas, [ev.id]: e.target.value })}
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && guardarNota(ev)}
                          style={{ width: 64, border: '1.5px solid #6c63ff', borderRadius: 10, padding: '8px', fontSize: 13, textAlign: 'center', outline: 'none', background: '#0d0d1f', color: 'white' }} />
                        <button onClick={() => guardarNota(ev)} style={{ background: '#6c63ff', border: 'none', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>✓</button>
                        <button onClick={() => setEditando({ ...editando, [ev.id]: false })} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditando({ ...editando, [ev.id]: true })} style={{ background: 'rgba(108,99,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                          {tieneNota ? 'Editar' : '+ Nota'}
                        </button>
                        <button onClick={() => eliminarEv(ev.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 10, padding: '8px 10px', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {pesoDisponible > 0 && (
            mostrando ? (
              <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '20px', border: '1.5px solid rgba(108,99,255,0.3)', animation: 'slideUp 0.3s ease' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 16px' }}>Nueva evaluación <span style={{ fontSize: 12, color: '#6c63ff', fontWeight: 400 }}>({pesoDisponible}% disponible)</span></p>
                <input value={nuevaEv.nombre} onChange={e => setNuevaEv({ ...nuevaEv, nombre: e.target.value })} placeholder="Nombre (ej: Solemne 1)"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input type="number" min="1" max={pesoDisponible} value={nuevaEv.ponderacion} onChange={e => setNuevaEv({ ...nuevaEv, ponderacion: e.target.value })} placeholder={`Ponderación % (máx ${pesoDisponible})`}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="date" value={nuevaEv.fecha} onChange={e => setNuevaEv({ ...nuevaEv, fecha: e.target.value })}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setMostrando(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={agregarEv} style={{ flex: 2, background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setMostrando(true)} style={{ width: '100%', background: 'rgba(108,99,255,0.12)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 16, padding: '14px', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                + Agregar evaluación ({pesoDisponible}% disponible)
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [pantalla, setPantalla] = useState('login')
  const [usuario, setUsuario] = useState(null)
  const [ramos, setRamos] = useState([])
  const [ramoActivo, setRamoActivo] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('usuario')
    if (token && user) {
      setUsuario(JSON.parse(user))
      cargarRamos(token)
      setPantalla('ramos')
    }
  }, [])

  const cargarRamos = async (token) => {
    try {
      const res = await fetch(`${API}/ramos`, { headers: authHeaders({ 'Content-Type': 'application/json' }) })
      if (res.ok) { const data = await res.json(); setRamos(data) }
    } catch (e) { console.error(e) }
  }

  const handleLogin = () => { window.location.href = `${API}/auth/google` }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    if (token && userStr) {
      localStorage.setItem('token', token)
      localStorage.setItem('usuario', userStr)
      setUsuario(JSON.parse(userStr))
      cargarRamos(token)
      setPantalla('ramos')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('usuario')
    setUsuario(null); setRamos([]); setRamoActivo(null); setPantalla('login')
  }

  const handleAddRamo = async (data) => {
    try {
      const res = await fetch(`${API}/ramos`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data) })
      if (res.ok) { const nuevo = await res.json(); setRamos([...ramos, { ...nuevo, evaluaciones: [] }]) }
    } catch (e) { console.error(e) }
  }

  const handleUpdateRamo = async (ramoActualizado) => {
    try {
      const res = await fetch(`${API}/ramos/${ramoActualizado.id}`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(ramoActualizado) })
      if (res.ok) {
        const updated = await res.json()
        setRamos(ramos.map(r => r.id === updated.id ? updated : r))
        setRamoActivo(updated)
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteRamo = async (id) => {
    try {
      const res = await fetch(`${API}/ramos/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (res.ok) { setRamos(ramos.filter(r => r.id !== id)); setPantalla('ramos'); setRamoActivo(null) }
    } catch (e) { console.error(e) }
  }

  if (pantalla === 'login') return <LoginScreen onLogin={handleLogin} />
  if (pantalla === 'ramos') return <RamosScreen ramos={ramos} onSelect={r => { setRamoActivo(r); setPantalla('ramo') }} onAdd={handleAddRamo} onLogout={handleLogout} usuario={usuario} />
  if (pantalla === 'ramo' && ramoActivo) return <RamoScreen ramo={ramoActivo} onBack={() => setPantalla('ramos')} onUpdate={handleUpdateRamo} onDelete={handleDeleteRamo} />
  return null
}
