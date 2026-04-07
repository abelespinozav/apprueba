import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const UNIVERSIDADES = [
  { id: 'ufro', nombre: 'Universidad de La Frontera', color: '#006847', secundario: '#004d33', emoji: '🟢' },
  { id: 'umayor', nombre: 'Universidad Mayor', color: '#C8102E', secundario: '#9b0d24', emoji: '🔴' },
  { id: 'uautonoma', nombre: 'Universidad Autónoma de Chile', color: '#003087', secundario: '#002266', emoji: '🔵' },
  { id: 'inacap', nombre: 'INACAP', color: '#E31837', secundario: '#b01229', emoji: '🔴' },
  { id: 'santotomas', nombre: 'Universidad Santo Tomás', color: '#1B3A6B', secundario: '#122a52', emoji: '🔵' },
  { id: 'uctemuco', nombre: 'Universidad Católica de Temuco', color: '#003087', secundario: '#002266', emoji: '⚪' },
]

export default function OnboardingScreen({ user, onComplete, API }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState(user?.name?.split(' ')[0] || '')
  const [universidad, setUniversidad] = useState(null)
  const [carrera, setCarrera] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const univSeleccionada = UNIVERSIDADES.find(u => u.id === universidad)
  const colorPrincipal = univSeleccionada?.color || '#6366f1'

  const handleContinuarPaso1 = () => {
    if (!nombre.trim()) { setError('Ingresa tu nombre o apodo'); return }
    setError('')
    setPaso(2)
  }

  const handleContinuarPaso2 = () => {
    if (!universidad) { setError('Selecciona tu universidad'); return }
    setError('')
    setPaso(3)
  }

  const handleFinalizar = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), universidad, carrera: carrera.trim() || null })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onComplete(data.usuario)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at 20% 50%, ${colorPrincipal}22 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 20%, ${colorPrincipal}15 0%, transparent 50%),
                   linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`,
      transition: 'background 0.8s ease',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
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

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 48, marginBottom: 8 }}>📚</motion.div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>APPrueba</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: 14 }}>Configuremos tu cuenta</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(n => (
            <motion.div key={n}
              animate={{ width: paso === n ? 32 : 8, background: paso >= n ? colorPrincipal : 'rgba(255,255,255,0.2)' }}
              transition={{ duration: 0.3 }}
              style={{ height: 8, borderRadius: 4 }} />
          ))}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 32,
          overflow: 'hidden'
        }}>
          <AnimatePresence mode="wait">

            {paso === 1 && (
              <motion.div key="paso1" variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
                  👋 ¿Cómo te llamamos?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>
                  Puede ser tu nombre, apodo o como prefieras
                </p>
                <input
                  autoFocus
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleContinuarPaso1()}
                  placeholder="Ej: Cami, Benja, Profe..."
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
                    background: 'rgba(255,255,255,0.08)',
                    border: `2px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                    color: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                />
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleContinuarPaso1}
                  style={{
                    width: '100%', marginTop: 20, padding: '14px', borderRadius: 12, border: 'none',
                    background: colorPrincipal, color: 'white', fontSize: 16, fontWeight: 600,
                    cursor: 'pointer', transition: 'background 0.3s'
                  }}>
                  Continuar →
                </motion.button>
              </motion.div>
            )}

            {paso === 2 && (
              <motion.div key="paso2" variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
                  🎓 ¿En qué universidad estudias?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 20px' }}>
                  Personalizaremos la app con los colores de tu universidad
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {UNIVERSIDADES.map(u => (
                    <motion.button key={u.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => { setUniversidad(u.id); setError('') }}
                      style={{
                        padding: '14px 16px', borderRadius: 12,
                        border: `2px solid ${universidad === u.id ? u.color : 'rgba(255,255,255,0.1)'}`,
                        background: universidad === u.id ? `${u.color}30` : 'rgba(255,255,255,0.04)',
                        color: 'white', fontSize: 14, cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s'
                      }}>
                      <span style={{ fontSize: 20 }}>{u.emoji}</span>
                      <span style={{ fontWeight: universidad === u.id ? 700 : 400, flex: 1 }}>{u.nombre}</span>
                      {universidad === u.id && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          style={{ color: u.color, fontWeight: 700, fontSize: 16 }}>✓</motion.span>
                      )}
                    </motion.button>
                  ))}
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setPaso(1)}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>
                    ← Volver
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleContinuarPaso2}
                    style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                      background: colorPrincipal, color: 'white', fontSize: 15, fontWeight: 600,
                      cursor: 'pointer', transition: 'background 0.3s' }}>
                    Continuar →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {paso === 3 && (
              <motion.div key="paso3" variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3 }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
                  📖 ¿Qué estudias?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>
                  Opcional — puedes saltarte esto tranquilamente
                </p>
                <input
                  autoFocus
                  value={carrera}
                  onChange={e => setCarrera(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFinalizar()}
                  placeholder="Ej: Ingeniería Civil, Medicina, Derecho..."
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
                    background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)',
                    color: 'white', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setPaso(2)}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15, cursor: 'pointer' }}>
                    ← Volver
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleFinalizar} disabled={loading}
                    style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                      background: loading ? 'rgba(255,255,255,0.2)' : colorPrincipal,
                      color: 'white', fontSize: 15, fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
                    {loading ? '⏳ Guardando...' : '¡Listo! Empezar →'}
                  </motion.button>
                </div>
                <button onClick={handleFinalizar} disabled={loading}
                  style={{ width: '100%', marginTop: 10, padding: '10px', background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>
                  Saltar por ahora
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20 }}>
          Puedes cambiar esto después en tu perfil
        </p>
      </motion.div>
    </div>
  )
}
