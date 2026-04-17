import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'


function esColorClaro(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return (r*299 + g*587 + b*114) / 1000 > 128
}

const UNIVERSIDADES = [
  { id: 'ufro', nombre: 'Universidad de La Frontera', color: '#003087', secundario: '#002266', logo: '/logos/ufro.png' },
  { id: 'umayor', nombre: 'Universidad Mayor', color: '#F5C800', secundario: '#c9a800', logo: '/logos/umayor.png', darkText: true },
  { id: 'uautonoma', nombre: 'Universidad Autónoma de Chile', color: '#C8102E', secundario: '#9b0d24', logo: '/logos/uautonoma.png' },
  { id: 'inacap', nombre: 'INACAP', color: '#CC0000', secundario: '#990000', logo: '/logos/inacap.png' },
  { id: 'santotomas', nombre: 'Universidad Santo Tomás', color: '#1B5E3B', secundario: '#144d2f', logo: '/logos/santotomas.png' },
  { id: 'uctemuco', nombre: 'Universidad Católica de Temuco', color: '#003087', secundario: '#F5C400', logo: '/logos/uctemuco.png' },
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
  const [datosFundador, setDatosFundador] = useState(null)
  const inputRef = useRef()

  const univSeleccionada = UNIVERSIDADES.find(u => u.id === universidad)
  const colorPrincipal = univSeleccionada?.color || '#6366f1'
  const bgMap = {
    'ufro': '#020d1f', 'umayor': '#0a0a0a', 'uautonoma': '#0a0a0a',
    'inacap': '#0f0a0a', 'santotomas': '#0a1a0f', 'uctemuco': '#0a0f1a'
  }
  const bgSecMap = {
    'ufro': '#0a1f3d', 'umayor': '#161616', 'uautonoma': '#1a1a1a',
    'inacap': '#1a0a0a', 'santotomas': '#1a4a2e', 'uctemuco': '#001a4d'
  }
  const bgPrincipal = universidad ? (bgMap[universidad] || '#0f0c29') : '#0f0c29'
  const bgSecundario = universidad ? (bgSecMap[universidad] || '#302b63') : '#302b63'
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
      if (data.usuario?.es_fundador) {
        setDatosFundador({ numero: data.usuario.numero_registro })
        setLoading(false)
        return
      }
      onComplete(data.usuario)
    } catch(err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (datosFundador) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🏅</div>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>¡Eres fundador!</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: '0 0 24px' }}>
          Eres el usuario <span style={{ color: '#a5b4fc', fontWeight: 700 }}>#{datosFundador.numero}</span> de APPrueba.<br/>
          Tienes acceso <span style={{ color: '#4ade80', fontWeight: 700 }}>ilimitado de por vida</span> 🎉
        </p>
        <button onClick={() => { fetch(`${API}/auth/me`, { headers: authHeaders() }).then(r => r.json()).then(d => onComplete(d.user || d.usuario)) }} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          Entrar a APPrueba →
        </button>
      </div>
    </div>
  )

  const totalPasos = 5

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 20% 50%, ${colorPrincipal}22 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 20%, ${colorPrincipal}15 0%, transparent 50%),
                   linear-gradient(135deg, ${bgPrincipal} 0%, ${bgSecundario} 100%)`,
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
                    background: 'rgba(255,255,255,0.08)', color: universidad === 'ufro' ? 'white' : colorPrincipal, fontSize: 16, fontWeight: 600, cursor: 'pointer', border: `1px solid ${colorPrincipal}60` }}>
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
                      background: 'rgba(255,255,255,0.08)', color: universidad === 'ufro' ? 'white' : colorPrincipal, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: `1px solid ${colorPrincipal}60` }}>Continuar →</motion.button>
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
                    color: 'white', outline: 'none', WebkitAppearance: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaso(2)}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>← Volver</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePaso3}
                    style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                      background: 'rgba(255,255,255,0.08)', color: universidad === 'ufro' ? 'white' : colorPrincipal, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: `1px solid ${colorPrincipal}60` }}>Continuar →</motion.button>
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
                        color: guardandoHorario ? 'rgba(255,255,255,0.5)' : 'var(--bg-primary)',
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

                    {universidad === 'ufro' && (
                      <div style={{ marginTop: 14, background: 'rgba(0,100,200,0.08)', border: '1px solid rgba(0,150,255,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13, color: '#60a5fa' }}>🎓 Tip para estudiantes UFRO</p>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Descarga tu horario en Excel desde la Intranet:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                          <span>1️⃣ Intranet → Alumno → Horarios</span>
                          <span>2️⃣ Haz clic en <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Exportar a Excel</strong></span>
                          <span>3️⃣ Sube el archivo .xls aquí arriba ⬆️</span>
                        </div>
                        <a href="https://intranet.ufro.cl/alumno/ver_horario.php" target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', background: 'rgba(0,150,255,0.15)', border: '1px solid rgba(0,150,255,0.3)', borderRadius: 8, padding: '6px 12px', color: '#60a5fa', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          🔗 Ir a Intranet UFRO →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaso(3)}
                    style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>← Volver</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPaso(5)}
                    style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                      background: 'rgba(255,255,255,0.08)', border: `1px solid ${colorPrincipal}60`,
                      color: universidad === 'ufro' ? 'white' : colorPrincipal,
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
                      background: 'rgba(255,255,255,0.08)', border: `1px solid ${colorPrincipal}60`,
                      color: universidad === 'ufro' ? 'white' : colorPrincipal, fontSize: 16, fontWeight: 700, cursor: notifEstado === 'activando' ? 'not-allowed' : 'pointer',
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
                      background: 'rgba(255,255,255,0.08)', border: `1px solid ${colorPrincipal}60`,
                      color: universidad === 'ufro' ? 'white' : colorPrincipal, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
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
