import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ramos, setRamos] = useState([])
  const [vista, setVista] = useState('dashboard')
  const [ramoActivo, setRamoActivo] = useState(null)
  const [step, setStep] = useState(1)
  const [nuevoRamo, setNuevoRamo] = useState({ nombre: '', minAprobacion: 4.0 })
  const [evaluaciones, setEvaluaciones] = useState([])
  const [evalTemp, setEvalTemp] = useState({ nombre: '', ponderacion: '' })
  const [notas, setNotas] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

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

  const calcularNecesaria = (ramo) => {
    const evsPendientes = ramo.evaluaciones.filter(e => e.nota === null || e.nota === undefined || e.nota === '')
    const evsRendidas = ramo.evaluaciones.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '')
    if (evsPendientes.length === 0) return null
    const pesoRendido = evsRendidas.reduce((s, e) => s + e.ponderacion, 0)
    const pesoPendiente = evsPendientes.reduce((s, e) => s + e.ponderacion, 0)
    const sumaRendida = evsRendidas.reduce((s, e) => s + (parseFloat(e.nota) * e.ponderacion), 0)
    const min = ramo.min_aprobacion || 4.0
    const necesaria = (min * 100 - sumaRendida) / pesoPendiente
    return necesaria
  }

  const calcularPromedio = (ramo) => {
    const rendidas = ramo.evaluaciones.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '')
    if (rendidas.length === 0) return null
    const pesoTotal = rendidas.reduce((s, e) => s + e.ponderacion, 0)
    const suma = rendidas.reduce((s, e) => s + (parseFloat(e.nota) * e.ponderacion), 0)
    return suma / pesoTotal
  }

  const getEstado = (ramo) => {
    const necesaria = calcularNecesaria(ramo)
    const promedio = calcularPromedio(ramo)
    if (necesaria === null) {
      if (promedio >= (ramo.min_aprobacion || 4.0)) return 'aprobado'
      return 'reprobado'
    }
    if (necesaria <= (ramo.min_aprobacion || 4.0)) return 'al_dia'
    if (necesaria <= 5.5) return 'en_riesgo'
    return 'critico'
  }

  const estadoConfig = {
    aprobado: { color: '#22c55e', bg: '#dcfce7', text: '#16a34a', label: '✅ Aprobado', border: '#22c55e' },
    al_dia: { color: '#22c55e', bg: '#dcfce7', text: '#16a34a', label: '👍 Al día', border: '#22c55e' },
    en_riesgo: { color: '#f59e0b', bg: '#fef3c7', text: '#d97706', label: '💪 En riesgo', border: '#f59e0b' },
    critico: { color: '#ef4444', bg: '#fee2e2', text: '#dc2626', label: '😬 Crítico', border: '#ef4444' },
    reprobado: { color: '#ef4444', bg: '#fee2e2', text: '#dc2626', label: '❌ Reprobado', border: '#ef4444' },
  }

  const ponderacionUsada = evaluaciones.reduce((s, e) => s + Number(e.ponderacion), 0)
  const ponderacionRestante = 100 - ponderacionUsada

  const agregarEval = () => {
    if (!evalTemp.nombre || !evalTemp.ponderacion) return
    const p = Number(evalTemp.ponderacion)
    if (p <= 0 || ponderacionUsada + p > 100) return
    setEvaluaciones([...evaluaciones, { nombre: evalTemp.nombre, ponderacion: p }])
    setEvalTemp({ nombre: '', ponderacion: '' })
  }

  const guardarRamo = async () => {
    if (ponderacionUsada !== 100) { showToast('Las ponderaciones deben sumar 100%', 'error'); return }
    setGuardando(true)
    try {
      const r = await fetch(`${API}/ramos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoRamo.nombre, minAprobacion: nuevoRamo.minAprobacion, evaluaciones })
      })
      const d = await r.json()
      setRamos([...ramos, d])
      setVista('dashboard')
      setStep(1)
      setNuevoRamo({ nombre: '', minAprobacion: 4.0 })
      setEvaluaciones([])
      showToast('Ramo guardado correctamente 🎉')
    } catch { showToast('Error al guardar', 'error') }
    setGuardando(false)
  }

  const guardarNotas = async () => {
    setGuardando(true)
    try {
      for (const [evalId, nota] of Object.entries(notas)) {
        if (nota !== '' && nota !== null) {
          await fetch(`${API}/evaluaciones/${evalId}/nota`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota: parseFloat(nota) })
          })
        }
      }
      await cargarRamos()
      const ramoActualizado = ramos.find(r => r.id === ramoActivo.id)
      if (ramoActualizado) setRamoActivo(ramoActualizado)
      showToast('Notas guardadas ✅')
    } catch { showToast('Error al guardar notas', 'error') }
    setGuardando(false)
  }

  const eliminarRamo = async (id) => {
    try {
      await fetch(`${API}/ramos/${id}`, { method: 'DELETE', credentials: 'include' })
      setRamos(ramos.filter(r => r.id !== id))
      setVista('dashboard')
      showToast('Ramo eliminado')
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
            { icon: '🎯', title: 'Nunca más sorpresas', sub: 'Planifica con tiempo tus evaluaciones' },
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

      {vista === 'dashboard' && (
        <>
          <div style={{ background: '#6c63ff', padding: '48px 20px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Hola de nuevo 👋</p>
                <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>{user.name?.split(' ')[0]}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {user.picture
                  ? <img src={user.picture} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{user.name?.[0]}</div>
                }
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              <div>
                <p style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0 }}>{ramos.length}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Ramos</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ color: '#86efac', fontSize: 24, fontWeight: 700, margin: 0 }}>{ramosAprobados}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>Al día</p>
              </div>
              <div>
                <p style={{ color: ramosCriticos > 0 ? '#fca5a5' : '#fde68a', fontSize: 24, fontWeight: 700, margin: 0 }}>{ramosCriticos || ramosEnRiesgo}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{ramosCriticos > 0 ? 'Críticos' : 'En riesgo'}</p>
              </div>
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
                const promedio = calcularPromedio(ramo)
                const necesaria = calcularNecesaria(ramo)
                const progreso = promedio ? Math.min((promedio / 7) * 100, 100) : 0
                return (
                  <div key={ramo.id} onClick={() => { setRamoActivo(ramo); setNotas({}); setVista('ramo') }}
                    style={{ background: 'white', borderRadius: 18, padding: '16px', borderLeft: `4px solid ${cfg.border}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{ramo.nombre}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: '3px 0 0' }}>{ramo.evaluaciones?.length || 0} evaluaciones · mín {ramo.min_aprobacion}</p>
                      </div>
                      <span style={{ background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                        {estado === 'aprobado' || estado === 'al_dia' ? `✅ ${promedio?.toFixed(1) || '-'}` : necesaria ? `💪 ${necesaria.toFixed(1)}` : cfg.label}
                      </span>
                    </div>
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
            <button onClick={() => { fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).then(() => setUser(null)) }}
              style={{ width: '100%', background: 'transparent', color: '#aaa', border: 'none', padding: '12px', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      {vista === 'ramo' && ramoActivo && (() => {
        const ramo = ramos.find(r => r.id === ramoActivo.id) || ramoActivo
        const necesaria = calcularNecesaria(ramo)
        const promedio = calcularPromedio(ramo)
        const estado = getEstado(ramo)
        const cfg = estadoConfig[estado]
        const pesoPendiente = ramo.evaluaciones.filter(e => !e.nota).reduce((s, e) => s + e.ponderacion, 0)
        return (
          <>
            <div style={{ background: '#6c63ff', padding: '48px 20px 48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setVista('dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
                <p style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: 0 }}>{ramo.nombre}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>Promedio actual</p>
                  <p style={{ color: 'white', fontSize: 32, fontWeight: 700, margin: 0 }}>{promedio ? promedio.toFixed(1) : '—'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>Necesitas</p>
                  <p style={{ color: necesaria > 6 ? '#fca5a5' : necesaria > 5 ? '#fde68a' : '#86efac', fontSize: 32, fontWeight: 700, margin: 0 }}>
                    {necesaria === null ? (promedio >= ramo.min_aprobacion ? '✅' : '❌') : necesaria > 7 ? '+7.0' : necesaria.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ background: '#f4f3ff', borderRadius: '24px 24px 0 0', marginTop: -20, padding: '24px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 14 }}>Evaluaciones</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ramo.evaluaciones?.map(ev => {
                  const tieneNota = ev.nota !== null && ev.nota !== undefined && ev.nota !== ''
                  const notaNecesariaEv = !tieneNota && necesaria !== null ? necesaria : null
                  return (
                    <div key={ev.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: tieneNota ? 'none' : '1.5px dashed #e0deff' }}>
                      <div style={{ width: 44, height: 44, background: tieneNota ? '#dcfce7' : '#ede9fe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: tieneNota ? '#16a34a' : '#6c63ff', flexShrink: 0 }}>
                        {tieneNota ? parseFloat(ev.nota).toFixed(1) : notaNecesariaEv ? notaNecesariaEv.toFixed(1) : '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{ev.nombre}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{ev.ponderacion}% del ramo</p>
                      </div>
                      {!tieneNota ? (
                        <input
                          type="number" min="1" max="7" step="0.1"
                          placeholder="Nota"
                          value={notas[ev.id] || ''}
                          onChange={e => setNotas({ ...notas, [ev.id]: e.target.value })}
                          style={{ width: 64, border: '1.5px solid #e0deff', borderRadius: 10, padding: '8px', fontSize: 13, textAlign: 'center', outline: 'none' }}
                        />
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>✓ Rendida</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {Object.keys(notas).some(k => notas[k] !== '') && (
                <button onClick={guardarNotas} disabled={guardando}
                  style={{ width: '100%', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 600, marginTop: 16, cursor: 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando...' : 'Guardar notas ✅'}
                </button>
              )}
              <button onClick={() => eliminarRamo(ramo.id)}
                style={{ width: '100%', background: 'transparent', color: '#ef4444', border: '1.5px solid #fee2e2', borderRadius: 16, padding: '12px', fontSize: 13, fontWeight: 600, marginTop: 10, cursor: 'pointer' }}>
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
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: step > i + 1 ? '#86efac' : step === i + 1 ? 'white' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: step === i + 1 ? '#6c63ff' : step > i + 1 ? '#16a34a' : 'white' }}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <span style={{ color: step === i + 1 ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
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
                        <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{ev.ponderacion}%</p>
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
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="number" value={evalTemp.ponderacion} onChange={e => setEvalTemp({ ...evalTemp, ponderacion: e.target.value })}
                      placeholder="%" min="1" max="100"
                      style={{ width: 70, border: '1.5px solid #e0deff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none' }} />
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e8e6ff', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: ponderacionUsada >= 100 ? '#ef4444' : '#6c63ff', width: `${Math.min(ponderacionUsada, 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ponderacionRestante === 0 ? '#22c55e' : '#6c63ff', minWidth: 36 }}>{ponderacionRestante}%</span>
                  </div>
                  <button onClick={agregarEval} disabled={!evalTemp.nombre || !evalTemp.ponderacion || ponderacionRestante <= 0}
                    style={{ width: '100%', background: '#ede9fe', color: '#6c63ff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, marginTop: 10, cursor: 'pointer' }}>
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
                        <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{ev.ponderacion}%</p>
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
