import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const UNIVERSIDADES = [
  { id: 'ufro', nombre: 'Universidad de La Frontera', color: '#003087', secundario: '#002266', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Escudo_UFRO.svg/200px-Escudo_UFRO.svg.png' },
  { id: 'umayor', nombre: 'Universidad Mayor', color: '#1B4F72', secundario: '#F5C400', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Logo_Universidad_Mayor.svg/200px-Logo_Universidad_Mayor.svg.png' },
  { id: 'uautonoma', nombre: 'Universidad Autónoma de Chile', color: '#C8102E', secundario: '#9b0d24', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Logo_Universidad_Autonoma_de_Chile.svg/200px-Logo_Universidad_Autonoma_de_Chile.svg.png' },
  { id: 'inacap', nombre: 'INACAP', color: '#CC0000', secundario: '#990000', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/INACAP_logo.svg/200px-INACAP_logo.svg.png' },
  { id: 'santotomas', nombre: 'Universidad Santo Tomás', color: '#1B5E3B', secundario: '#144d2f', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Logo_Santo_Tomas.svg/200px-Logo_Santo_Tomas.svg.png' },
  { id: 'uctemuco', nombre: 'Universidad Católica de Temuco', color: '#003087', secundario: '#002266', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Logo_UCT.svg/200px-Logo_UCT.svg.png' },
]

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function OnboardingScreen({ user, onComplete, API }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState(user?.name?.split(' ')[0] || '')
  const [universidad, setUniversidad] = useState(null)
  const [carrera, setCarrera] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extrayendo, setExtrayendo] = useState(false)
  const [horarioSubido, setHorarioSubido] = useState(false)
  const [bloquesPreview, setBloquesPreview] = useState(null)
  const [guardandoHorario, setGuardandoHorario] = useState(false)
  const [notifEstado, setNotifEstado] = useState('idle') // idle | activando | ok | error
  const inputRef = useRef()

  const univSeleccionada = UNIVERSIDADES.find(u => u.id === universidad)
  const colorPrincipal = univSeleccionada?.color || '#6366f1'
  const token = localStorage.getItem('token')
  const authHeaders = (extra = {}) => ({ ...extra, Authorization: `Bearer ${token}` })

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 }
  }

  // ── Paso 1: nombre ──
  const handlePaso1 = () => {
    if (!nombre.trim()) { setError('Ingresa tu nombre o apodo'); return }
    setError(''); setPaso(2)
  }

  // ── Paso 2: universidad ──
  const handlePaso2 = () => {
    if (!universidad) { setError('Selecciona tu universidad'); return }
    setError(''); setPaso(3)
  }

  // ── Paso 3: carrera ──
  const handlePaso3 = () => { setPaso(4) }

  // ── Paso 4: horario ──
  const handleArchivo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setExtrayendo(true)
    setError('')
    try {
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        const formData = new FormData()
        formData.append('archivo', file)
        const res = await fetch(`${API}/horario/extraer-excel`, { method: 'POST', headers: authHeaders(), body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error procesando Excel')
        setBloquesPreview(data.bloques)
      } else {
        const formData = new FormData()
        formData.append('imagen', file)
        const res = await fetch(`${API}/horario/extraer`, { method: 'POST', headers: authHeaders(), body: formData })
        const data = await res.json()
        if (data.bloques) setBloquesPreview(data.bloques)
        else throw new Error('No se pudo extraer el horario. Intenta con otra imagen.')
      }
    } catch(err) {
      setError(err.message)
    }
    setExtrayendo(false)
  }

  const confirmarHorario = async () => {
    setGuardandoHorario(true)
    try {
      await fetch(`${API}/horario/limpiar`, { method: 'POST', headers: authHeaders() })
      for (const b of bloquesPreview) {
        await fetch(`${API}/horario`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(b)
        })
      }
      await fetch(`${API}/horario/sincronizar-ramos`, { method: 'POST', headers: authHeaders() })
      setHorarioSubido(true)
      setBloquesPreview(null)
    } catch(err) {
      setError('Error al guardar el horario')
    }
    setGuardandoHorario(false)
  }

  // ── Paso 5: notificaciones ──
  const activarNotificaciones = async () => {
    setNotifEstado('activando')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setNotifEstado('error'); return }
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()
      const { publicKey } = await fetch(`${API}/notificaciones/vapid-key`).then(r => r.json())
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
      await fetch(`${API}/notificaciones/subscribe`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ subscription: sub.toJSON() })
      })
      setNotifEstado('ok')
    } catch(err) {
      setNotifEstado('error')
    }
  }

  // ── Finalizar ──
  const handleFinalizar = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/onboarding`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nombre: nombre.trim(), universidad, carrera: carrera.trim() || null, onboarding_v2: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onComplete(data.usuario)
    } catch(err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const totalPasos = 5

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 20% 50%, ${colorPrincipal}22 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 20%, ${colorPrincipal}15 0%, transparent 50%),
                   linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`,
      transition: 'background 0.8s ease', padding: '20px', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity }}
          style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%',
            background: `${colorPrincipal}18`, filter: 'blur(60px)', transition: 'background 0.8s' }} />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity }}
          style={{ position: 'absolute', bottom: '10%', right: '10%', width: 250, height: 250, borderRadius: '50%',
            background: `${colorPrincipal}12`, filter: 'blur(50px)', transition: 'background 0.8s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ marginBottom: 12, display: 'inline-block' }}>
            <img src="/icon-512.png" alt="APPrueba" style={{ width: 64, height: 64, borderRadius: 16 }} />
          </motion.div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: 0 }}>APPrueba</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: 13 }}>Configuremos tu cuenta — paso {paso} de {totalPasos}</p>
        </div>

        {/* Barra de progreso */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {Array.from({ length: totalPasos }).map((_, i) => (
            <motion.div key={i}
              animate={{ flex: paso === i+1 ? 2 : 1, background: paso > i ? colorPrincipal : paso === i+1 ? colorPrincipal : 'rgba(255,255,255,0.15)' }}
              transition={{ duration: 0.3 }}
              style={{ height: 6, borderRadius: 4 }} />
          ))}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
          padding: 28, overflow: 'hidden'
        }}>
          <AnimatePresence mode="wait">

            {/* PASO 1: Nombre */}
            {paso === 1 && (
              <motion.div key="p1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>👋 ¿Cómo te llamamos?</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>Puede ser tu nombre, apodo o como prefieras</p>
                <input autoFocus value={nombre} onChange={e => { setNombre(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handlePaso1()}
                  placeholder="Ej: Cami, Benja, Profe..."
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
                    background: 'rgba(255,255,255,0.08)', border: `2px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                    color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePaso1}
                  style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 12, border: 'none',
                    background: colorPrincipal, color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                  Continuar →
                </motion.button>
              </motion.div>
            )}

            {/* PASO 2: Universidad */}
            {paso === 2 && (
              <motion.div key="p2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>🎓 ¿En qué universidad estudias?</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 20px' }}>Personalizaremos la app con los colores de tu universidad</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {UNIVERSIDADES.map(u => (
                    <motion.button key={u.id} whileTap={{ scale: 0.99 }} onClick={() => { setUniversidad(u.id); setError('') }}
                      style={{ padding: '12px 16px', borderRadius: 12,
                        border: `2px solid ${universidad === u.id ? u.color : 'rgba(255,255,255,0.1)'}`,
                        background: universidad === u.id ? `${u.color}30` : 'rgba(255,255,255,0.04)',
                        color: 'white', fontSize: 14, cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={u.logo} alt={u.nombre} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='🎓' }} />
                      </div>
                      <span style={{ fontWeight: universidad === u.id ? 700 : 400, flex: 1 }}>{u.nombre}</span>
                      {universidad === u.id && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: u.color, fontWeight: 700 }}>✓</motion.span>}
                    </motion.button>
                  ))}
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaso(1)}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>← Volver</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePaso2}
                    style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                      background: colorPrincipal, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Continuar →</motion.button>
                </div>
              </motion.div>
            )}

            {/* PASO 3: Carrera */}
            {paso === 3 && (
              <motion.div key="p3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>📖 ¿Qué estudias?</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>Opcional — puedes saltarte esto tranquilamente</p>
                <input autoFocus value={carrera} onChange={e => setCarrera(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePaso3()}
                  placeholder="Ej: Ingeniería Civil, Medicina, Derecho..."
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
                    background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)',
                    color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaso(2)}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>← Volver</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePaso3}
                    style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                      background: colorPrincipal, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Continuar →</motion.button>
                </div>
                <button onClick={handlePaso3} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'transparent',
                  border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Saltar por ahora</button>
              </motion.div>
            )}

            {/* PASO 4: Horario */}
            {paso === 4 && (
              <motion.div key="p4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>📅 Sube tu horario</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 16px' }}>
                  Tu horario es clave para que APPrueba funcione al 100%
                </p>

                {/* Beneficios */}
                <div style={{ background: `${colorPrincipal}18`, border: `1px solid ${colorPrincipal}40`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  {[
                    { icon: '🧠', text: 'Planes de estudio personalizados según tus horas libres' },
                    { icon: '🔔', text: 'Avisos 15 min antes de cada clase' },
                    { icon: '📊', text: 'Ventanas de estudio detectadas automáticamente' },
                  ].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                      <span style={{ fontSize: 20 }}>{b.icon}</span>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>{b.text}</p>
                    </div>
                  ))}
                </div>

                {horarioSubido ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center', padding: 24, background: 'rgba(74,222,128,0.1)', borderRadius: 16, border: '1px solid rgba(74,222,128,0.3)', marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                    <p style={{ color: '#4ade80', fontWeight: 700, margin: 0, fontSize: 16 }}>¡Horario guardado!</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>Tus clases ya están sincronizadas</p>
                  </motion.div>
                ) : bloquesPreview ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 12, maxHeight: 180, overflowY: 'auto' }}>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 8px', fontWeight: 600 }}>Se detectaron {bloquesPreview.length} bloques:</p>
                      {bloquesPreview.map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < bloquesPreview.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <span style={{ color: 'white', fontSize: 13 }}>{b.ramo}</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{b.dia} {b.hora_inicio}</span>
                        </div>
                      ))}
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarHorario} disabled={guardandoHorario}
                      style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                        background: guardandoHorario ? 'rgba(255,255,255,0.2)' : '#4ade80',
                        color: guardandoHorario ? 'rgba(255,255,255,0.5)' : '#0a0a1a',
                        fontSize: 15, fontWeight: 700, cursor: guardandoHorario ? 'not-allowed' : 'pointer' }}>
                      {guardandoHorario ? '⏳ Guardando...' : '✅ Confirmar y guardar horario'}
                    </motion.button>
                    <button onClick={() => setBloquesPreview(null)} style={{ width: '100%', marginTop: 8, padding: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Subir otro archivo</button>
                  </div>
                ) : (
                  <div>
                    <input ref={inputRef} type="file" accept="image/*,.pdf,.xls,.xlsx" style={{ display: 'none' }} onChange={handleArchivo} />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => inputRef.current?.click()} disabled={extrayendo}
                      style={{ width: '100%', padding: '18px', borderRadius: 14, border: `2px dashed ${colorPrincipal}80`,
                        background: `${colorPrincipal}10`, color: 'white', fontSize: 15, fontWeight: 600,
                        cursor: extrayendo ? 'not-allowed' : 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      {extrayendo ? (
                        <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⏳</motion.span> Analizando tu horario...</>
                      ) : (
                        <><span style={{ fontSize: 24 }}>📤</span> Subir foto, PDF o Excel del horario</>
                      )}
                    </motion.button>
                    {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', margin: 0 }}>Acepta imágenes, PDF y archivos Excel (.xls, .xlsx)</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaso(3)}
                    style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>← Volver</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPaso(5)}
                    style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                      background: horarioSubido ? colorPrincipal : 'rgba(255,255,255,0.1)',
                      color: horarioSubido ? 'white' : 'rgba(255,255,255,0.5)',
                      fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                    {horarioSubido ? 'Continuar →' : 'Saltar por ahora →'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* PASO 5: Notificaciones */}
            {paso === 5 && (
              <motion.div key="p5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>🔔 Activa las notificaciones</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 16px' }}>
                  Recibe recordatorios de tus evaluaciones y avisos de clases
                </p>

                <div style={{ background: `${colorPrincipal}18`, border: `1px solid ${colorPrincipal}40`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  {[
                    { icon: '📚', text: 'Recordatorio antes de cada evaluación' },
                    { icon: '🏫', text: 'Aviso 15 min antes de cada clase' },
                    { icon: '💡', text: 'Alertas de ventanas de estudio disponibles' },
                  ].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                      <span style={{ fontSize: 20 }}>{b.icon}</span>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>{b.text}</p>
                    </div>
                  ))}
                </div>

                {notifEstado === 'ok' ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center', padding: 24, background: 'rgba(74,222,128,0.1)', borderRadius: 16, border: '1px solid rgba(74,222,128,0.3)', marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🔔</div>
                    <p style={{ color: '#4ade80', fontWeight: 700, margin: 0, fontSize: 16 }}>¡Notificaciones activadas!</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>Te avisaremos cuando importa</p>
                  </motion.div>
                ) : notifEstado === 'error' ? (
                  <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                    <p style={{ color: '#f87171', margin: 0, fontSize: 14 }}>⚠️ No se pudieron activar. Puedes hacerlo después desde el panel de notificaciones.</p>
                  </div>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={activarNotificaciones} disabled={notifEstado === 'activando'}
                    style={{ width: '100%', padding: '18px', borderRadius: 14, border: 'none',
                      background: notifEstado === 'activando' ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${colorPrincipal}, ${colorPrincipal}cc)`,
                      color: 'white', fontSize: 16, fontWeight: 700, cursor: notifEstado === 'activando' ? 'not-allowed' : 'pointer',
                      marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {notifEstado === 'activando' ? (
                      <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⏳</motion.span> Activando...</>
                    ) : '🔔 Activar notificaciones'}
                  </motion.button>
                )}

                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaso(4)}
                    style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>← Volver</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleFinalizar} disabled={loading}
                    style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                      background: loading ? 'rgba(255,255,255,0.2)' : colorPrincipal,
                      color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? '⏳ Guardando...' : '¡Empezar! 🚀'}
                  </motion.button>
                </div>
                {(notifEstado === 'idle' || notifEstado === 'error') && (
                  <button onClick={handleFinalizar} disabled={loading}
                    style={{ width: '100%', marginTop: 10, padding: '10px', background: 'transparent',
                      border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>
                    Saltar y empezar sin notificaciones
                  </button>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20 }}>
          Puedes cambiar todo esto después desde tu perfil
        </p>
      </motion.div>
    </div>
  )
}
