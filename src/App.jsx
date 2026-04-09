import { useState, useEffect, useRef } from 'react'
import PanelNotificaciones from './Notificaciones'
import { motion, AnimatePresence } from 'framer-motion'
import PlanEstudio from './PlanEstudio'
import OnboardingScreen from './OnboardingScreen.jsx'
import { useTheme } from './useTheme'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })


function BannerInstalar() {
  const [mostrar, setMostrar] = useState(false)
  const [esIOS, setEsIOS] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.navigator.standalone
    const yaVisto = localStorage.getItem('banner_instalar_visto')
    setEsIOS(ios)
    if (!standalone && !yaVisto) setMostrar(true)
  }, [])

  if (!mostrar) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 9999,
      background: 'linear-gradient(135deg, #1e1b4b, #2d1b69)',
      border: '1px solid var(--shadow-color)',
      borderRadius: 18, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <img src="/icon-192.png" style={{ width: 44, height: 44, borderRadius: 10 }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'white' }}>Instala APPrueba 📲</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          {esIOS ? 'Toca Compartir → "Agregar a inicio"' : 'Agrega la app a tu pantalla de inicio'}
        </p>
      </div>
      <button onClick={() => { setMostrar(false); localStorage.setItem('banner_instalar_visto', '1') }}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
    </div>
  )
}

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
  if (dias < 0) return <span style={{ fontSize: 10, background: 'var(--bg-secondary)', color: '#9ca3af', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Pasada</span>
  if (dias === 0) return <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>¡Hoy!</span>
  if (dias === 1) return <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>¡Mañana!</span>
  if (dias <= 7) return <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
  if (dias <= 14) return <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
  return <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
}

function BackgroundOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, var(--shadow-color) 0%, transparent 70%)', top: -80, left: -80, animation: 'orbMove1 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', top: '40%', right: -60, animation: 'orbMove2 15s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', bottom: 100, left: '20%', animation: 'orbMove3 18s ease-in-out infinite' }} />
      <style>{`
        @keyframes orbMove1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
        @keyframes orbMove2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,40px)} }
        @keyframes orbMove3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes float { 0%{transform:translateY(0) scale(1)} 40%{transform:translateY(-16px) scale(1.07)} 55%{transform:translateY(-14px) scale(1.06)} 70%{transform:translateY(-18px) scale(1.08)} 100%{transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}

function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, left: Math.random() * 100,
    color: ['var(--color-primary)','var(--color-secondary)','#f59e0b','#22c55e','#ec4899','#38bdf8'][Math.floor(Math.random() * 6)],
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

function TipInteligente({ ramos }) {
  const tips = []

  ramos.forEach(r => {
    const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
    if (evs.length === 0) return
    const calc = calcular(evs, r.min_aprobacion, r)
    if (!calc) return

    if (calc.estado === 'con_examen') {
      tips.push({ icon: '📝', text: `Tienes examen en ${r.nombre}. Repasa los contenidos con más peso en la nota final.`, color: '#fbbf24' })
    }
    if (calc.necesaria !== null && calc.necesaria > 6) {
      tips.push({ icon: '⚠️', text: `En ${r.nombre} necesitas un ${calc.necesaria.toFixed(1)}. Considera hablar con tu profe sobre opciones.`, color: '#f87171' })
    }
    if (calc.necesaria !== null && calc.necesaria <= 4.5 && calc.necesaria > 0) {
      tips.push({ icon: '✅', text: `Vas bien en ${r.nombre}! Solo necesitas un ${calc.necesaria.toFixed(1)} para aprobar.`, color: '#4ade80' })
    }
    if (calc.estado === 'aprobado') {
      tips.push({ icon: '🎉', text: `¡Ya aprobaste ${r.nombre}! Mantén el ritmo para subir aún más tu nota.`, color: '#4ade80' })
    }
    if (calc.estado === 'eximido') {
      tips.push({ icon: '🎓', text: `¡Puedes eximirte de ${r.nombre}! Revisa los requisitos con tu profe.`, color: 'var(--color-secondary)' })
    }
  })

  const genericos = [
    { icon: '📅', text: 'Agrega fechas a tus evaluaciones para ver el conteo regresivo en el dashboard.', color: 'var(--color-primary)' },
    { icon: '⚖️', text: 'Asegúrate de que los porcentajes de tus evaluaciones sumen 100% para un cálculo preciso.', color: 'var(--color-primary)' },
    { icon: '🎯', text: 'Puedes configurar nota de eximición por ramo al crearlo o editarlo.', color: 'var(--color-secondary)' },
    { icon: '📊', text: 'El promedio ponderado considera el peso de cada evaluación. ¡No todas valen igual!', color: 'var(--color-primary)' },
  ]

  const lista = tips.length > 0 ? tips : genericos
  const tip = lista[new Date().getMinutes() % lista.length]

  return (
    <div style={{ background: `linear-gradient(135deg, ${tip.color}18, ${tip.color}08)`, border: `1px solid ${tip.color}30`, borderRadius: 16, padding: '14px 16px', marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: tip.color, letterSpacing: 1, margin: '0 0 6px', textTransform: 'uppercase' }}>💡 Tip para ti</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>{tip.icon} {tip.text}</p>
    </div>
  )
}

function calcular(evaluaciones, min, ramo) {
  const evs = evaluaciones.map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0, nota: (e.nota !== null && e.nota !== undefined && e.nota !== '') ? parseFloat(e.nota) : null }))
  const pendientes = evs.filter(e => e.nota === null)
  const completadas = evs.filter(e => e.nota !== null)
  const pesoTotal = evs.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoCompleto = Math.abs(pesoTotal - 100) < 0.01

  if (pendientes.length === 0 && completadas.length === 0) return { promedio: null, necesaria: null, necesariaExamen: null, estado: null, pendientesCount: 0, pesoCompleto: false, pesoTotal, eximido: false }

  const ponderacionExamen = ramo?.ponderacion_examen ? parseFloat(ramo.ponderacion_examen) / 100 : 0.25
  const ponderacionSemestre = 1 - ponderacionExamen
  const notaEximicion = ramo?.nota_eximicion ? parseFloat(ramo.nota_eximicion) : null
  const sinRojos = ramo?.sin_rojos || false

  if (pendientes.length === 0) {
    const promedio = completadas.reduce((acc, e) => acc + e.nota * (e.ponderacion / 100), 0)
    const tieneRojos = completadas.some(e => e.nota < 4.0)

    // Verificar eximición
    if (notaEximicion && promedio >= notaEximicion && !(sinRojos && tieneRojos)) {
      return { promedio, necesaria: null, necesariaExamen: null, estado: 'eximido', pendientesCount: 0, pesoCompleto, pesoTotal, eximido: true }
    }

    // Sin eximición: verificar si puede presentarse a examen (promedio mínimo = min_aprobacion)
    if (Math.round(promedio * 10) / 10 < parseFloat(min)) {
      return { promedio, necesaria: null, necesariaExamen: null, estado: 'reprobado_sin_examen', pendientesCount: 0, pesoCompleto, pesoTotal, eximido: false, tieneRojos }
    }
    // Calcular nota necesaria en examen
    const notaFinalSinExamen = promedio * ponderacionSemestre
    const necesariaExamenRaw = (parseFloat(min) - notaFinalSinExamen) / ponderacionExamen
    const necesariaExamen = Math.max(0, necesariaExamenRaw)
    // Si tiene rojos y sin_rojos activo → debe rendir examen aunque promedio sea suficiente
    const debeExamenPorRojos = sinRojos && tieneRojos
    if (necesariaExamenRaw <= 0 && !debeExamenPorRojos) {
      return { promedio, necesaria: null, necesariaExamen: 0, estado: 'aprobado', pendientesCount: 0, pesoCompleto, pesoTotal, eximido: false, tieneRojos }
    }
    const estadoFinal = necesariaExamenRaw > 7 ? 'reprobado_imposible' : 'con_examen'
    return { promedio, necesaria: null, necesariaExamen, estado: estadoFinal, pendientesCount: 0, pesoCompleto, pesoTotal, eximido: false, tieneRojos }
  }

  const pesoCompletado = completadas.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoPendiente = pendientes.reduce((acc, e) => acc + e.ponderacion, 0)
  const puntajeActual = completadas.reduce((acc, e) => acc + e.nota * (e.ponderacion / 100), 0)
  const promedioActual = pesoCompletado > 0 ? (puntajeActual / (pesoCompletado / 100)) : null
  const necesariaRaw = (pesoCompleto && pesoPendiente > 0) ? ((parseFloat(min) - puntajeActual) / (pesoPendiente / 100)) : null
  const necesaria = necesariaRaw
  const estadoPendiente = necesariaRaw !== null && necesariaRaw > 7 ? 'imposible' : necesariaRaw !== null && necesariaRaw < 0 ? 'aprobado' : null
  return { promedio: promedioActual, necesaria, necesariaExamen: null, estado: estadoPendiente, pendientesCount: pendientes.length, pesoCompleto, pesoTotal, eximido: false }
}

function notaColor(nota) {
  if (nota === null || nota === undefined) return 'var(--color-secondary)'
  if (nota >= 5.5) return '#4ade80'
  if (nota >= 4.0) return '#fbbf24'
  return '#f87171'
}

function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <BackgroundOrbs />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'slideUp 0.6s ease' }}>
        <img src="/icon-512.png" alt="APPrueba" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16, display: 'block', margin: '0 auto 16px', animation: 'float 1.2s cubic-bezier(0.36,0.07,0.19,0.97) infinite' }} />
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: '0 0 8px', background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>APPrueba</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 48px' }}>Tu compañero académico inteligente</p>
        <button onClick={onLogin} style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'white', border: 'none', borderRadius: 16, padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto', boxShadow: '0 8px 32px var(--shadow-color)' }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.9C9.8 39.8 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24 }}>Guarda tu progreso académico de forma segura</p>
      </div>
    </div>
  )
}



function HorarioScreen({ usuario, onBack, API, authHeaders }) {
  const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const TIPOS = [
    { value: 'clase', label: 'Clase', color: '#6c63ff' },
    { value: 'topon', label: 'Topón', color: '#f59e0b' },
    { value: 'ayudantia', label: 'Ayudantía', color: '#a3e635' },
    { value: 'prueba', label: 'Prueba', color: '#f97316' },
    { value: 'otra', label: 'Otra', color: '#86efac' },
  ]

  const [horario, setHorario] = useState([])
  const [extrayendo, setExtrayendo] = useState(false)
  const [bloquesPreview, setBloquesPreview] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [editandoBloque, setEditandoBloque] = useState(null)
  const [formBloque, setFormBloque] = useState({})
  const [vistaGrid, setVistaGrid] = useState(false)
  const inputRef = useRef()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await fetch(API + '/horario', { headers: authHeaders() })
    const data = await res.json()
    setHorario(Array.isArray(data) ? data : [])
  }

  const handleImagen = async (e) => {
    // Si es Excel, usar endpoint específico
    const file = e.target.files[0]
    if (!file) return
    if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      setExtrayendo(true)
      try {
        const formData = new FormData()
        formData.append('archivo', file)
        const res = await fetch(`${API}/horario/extraer-excel`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error procesando Excel')
        setBloquesPreview(data.bloques)
      } catch(err) {
        alert('Error: ' + err.message)
      } finally {
        setExtrayendo(false)
      }
      return
    }
    setExtrayendo(true)
    setMensaje(null)
    const formData = new FormData()
    formData.append('imagen', file)
    try {
      const res = await fetch(API + '/horario/extraer', {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      })
      const data = await res.json()
      if (data.bloques) {
        setBloquesPreview(data.bloques)
      } else {
        setMensaje('❌ No se pudo extraer el horario. Intenta con otra imagen.')
      }
    } catch(e) {
      setMensaje('❌ Error al procesar la imagen.')
    }
    setExtrayendo(false)
  }

  const confirmarHorario = async () => {
    setGuardando(true)
    await fetch(API + '/horario/limpiar', { method: 'POST', headers: authHeaders() })
    for (const b of bloquesPreview) {
      await fetch(API + '/horario', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      })
    }
    await fetch(API + '/horario/sincronizar-ramos', { method: 'POST', headers: authHeaders() })
    await cargar()
    window.dispatchEvent(new Event('ramos-actualizados'))
    setBloquesPreview(null)
    setGuardando(false)
    setMensaje('✅ Horario guardado y ramos sincronizados')
    setTimeout(() => setMensaje(null), 3000)
  }

  const eliminarBloque = async (id) => {
    await fetch(API + '/horario/' + id, { method: 'DELETE', headers: authHeaders() })
    cargar()
  }

  const abrirEditar = (h) => {
    setFormBloque({ ramo_nombre: h.ramo_nombre || '', codigo: h.codigo || '', sala: h.sala || '', tipo: h.tipo || 'clase', dia: h.dia, hora_inicio: h.hora_inicio || '', hora_fin: h.hora_fin || '' })
    setEditandoBloque(h)
  }

  const guardarEdicion = async () => {
    setGuardando(true)
    await fetch(API + '/horario/' + editandoBloque.id, { method: 'DELETE', headers: authHeaders() })
    await fetch(API + '/horario', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formBloque)
    })
    await cargar()
    setEditandoBloque(null)
    setGuardando(false)
  }

  const borrarHorario = async () => {
    if (!window.confirm('¿Seguro que quieres borrar todo el horario?')) return
    await fetch(API + '/horario/limpiar', { method: 'POST', headers: authHeaders() })
    await cargar()
    setMensaje('🗑️ Horario borrado')
    setTimeout(() => setMensaje(null), 3000)
  }

  const diasConClases = [...new Set(horario.map(h => h.dia))].sort((a,b) => DIAS_ORDEN.indexOf(a) - DIAS_ORDEN.indexOf(b))

  const getTipoColor = (tipo) => TIPOS.find(t => t.value === tipo)?.color || '#6c63ff'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px 16px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}>← Volver</button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>📅 Mi Horario</h2>
        </div>

        {mensaje && (
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>{mensaje}</div>
        )}

        {/* Subir imagen */}
        {horario.length > 0 && (
          <button onClick={borrarHorario} style={{ width: '100%', marginBottom: 12, padding: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🗑️ Borrar horario completo
          </button>
        )}
        <div
          onClick={() => inputRef.current.click()}
          style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 16, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 24, background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{extrayendo ? 'Analizando imagen...' : 'Sube una foto, PDF o Excel de tu horario'}</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>La IA extrae automáticamente tus ramos, días y horarios</p>
          <input ref={inputRef} type="file" accept="image/*,.pdf,.xls,.xlsx" style={{ display: 'none' }} onChange={handleImagen} />
        </div>

        {/* Preview bloques extraídos */}
        {bloquesPreview && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>✨ Bloques detectados ({bloquesPreview.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
              {bloquesPreview.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', borderLeft: '3px solid ' + getTipoColor(b.tipo) }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.ramo_nombre}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{b.dia} · {b.hora_inicio}–{b.hora_fin} {b.sala ? '· ' + b.sala : ''}</div>
                  </div>
                  <div style={{ fontSize: 11, color: getTipoColor(b.tipo), fontWeight: 600 }}>{TIPOS.find(t=>t.value===b.tipo)?.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setBloquesPreview(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarHorario} disabled={guardando} style={{ flex: 2, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 12, padding: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {guardando ? 'Guardando...' : '✅ Confirmar y guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Horario guardado */}
        {horario.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Tu horario actual</h3>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
                <button onClick={() => setVistaGrid(false)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: !vistaGrid ? 'rgba(255,255,255,0.12)' : 'transparent', color: !vistaGrid ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>☰</button>
                <button onClick={() => setVistaGrid(true)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: vistaGrid ? 'rgba(255,255,255,0.12)' : 'transparent', color: vistaGrid ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>⊞</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TIPOS.map(t => (
                  <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />{t.label}
                  </div>
                ))}
              </div>
            </div>
            {!vistaGrid ? (
              diasConClases.map(dia => (
                <div key={dia} style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{dia}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {horario.filter(h => h.dia === dia).sort((a,b) => (a.hora_inicio||'').localeCompare(b.hora_inicio||'')).map(h => (
                      <div key={h.id} onClick={() => abrirEditar(h)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px', borderLeft: '3px solid ' + getTipoColor(h.tipo), cursor: 'pointer' }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', minWidth: 90, fontWeight: 600 }}>{h.hora_inicio}–{h.hora_fin}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{h.ramo_nombre}</div>
                          {(h.codigo || h.sala) && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{[h.codigo, h.sala].filter(Boolean).join(' · ')}</div>}
                        </div>
                        <button onClick={e => { e.stopPropagation(); eliminarBloque(h.id) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 8px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textAlign: 'left', width: 80 }}>Hora</th>
                      {diasConClases.map(d => (
                        <th key={d} style={{ padding: '6px 4px', fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textAlign: 'center' }}>{d.slice(0,3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const todasHoras = [...new Set(horario.map(h => h.hora_inicio))].sort()
                      return todasHoras.map(hora => (
                        <tr key={hora}>
                          <td style={{ padding: '4px 8px', fontSize: 10, color: 'rgba(255,255,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap', fontWeight: 600 }}>{hora}<br/><span style={{fontSize:10,opacity:0.5}}>{horario.find(h => h.hora_inicio === hora)?.hora_fin}</span></td>
                          {diasConClases.map(dia => {
                            const bloque = horario.find(h => h.dia === dia && h.hora_inicio === hora)
                            const color = bloque ? getTipoColor(bloque.tipo) : null
                            return (
                              <td key={dia} style={{ padding: 3, borderTop: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                                {bloque ? (
                                  <div onClick={() => abrirEditar(bloque)} style={{ borderRadius: 8, padding: '5px 7px', background: color + '22', border: '1px solid ' + color + '55', cursor: 'pointer', minHeight: 44 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: color, lineHeight: 1.3 }}>{bloque.ramo_nombre}</div>
                                    {bloque.sala && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{bloque.sala}</div>}
                                  </div>
                                ) : (
                                  <div style={{ minHeight: 44, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.05)' }} />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : !bloquesPreview && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Aún no tienes horario guardado. ¡Sube una imagen para comenzar!</p>
        )}
      </div>

      {/* Modal editar bloque */}
      {editandoBloque && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>✏️ Editar bloque</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nombre del ramo *" value={formBloque.ramo_nombre} onChange={e => setFormBloque({...formBloque, ramo_nombre: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none' }} />
              <select value={formBloque.dia} onChange={e => setFormBloque({...formBloque, dia: e.target.value})}
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none' }}>
                {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => <option key={d} value={d} style={{ background: '#1a1a2e' }}>{d}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Inicio (08:30)" value={formBloque.hora_inicio} onChange={e => setFormBloque({...formBloque, hora_inicio: e.target.value})}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none' }} />
                <input placeholder="Fin (09:30)" value={formBloque.hora_fin} onChange={e => setFormBloque({...formBloque, hora_fin: e.target.value})}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none' }} />
              </div>
              <input placeholder="Sala (ej: RA-2003)" value={formBloque.sala} onChange={e => setFormBloque({...formBloque, sala: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none' }} />
              <input placeholder="Código (ej: IME086-6)" value={formBloque.codigo} onChange={e => setFormBloque({...formBloque, codigo: e.target.value})}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{value:'clase',label:'Clase',color:'#6c63ff'},{value:'topon',label:'Topón',color:'#f59e0b'},{value:'ayudantia',label:'Ayudantía',color:'#a3e635'},{value:'prueba',label:'Prueba',color:'#f97316'},{value:'otra',label:'Otra',color:'#86efac'}].map(t => (
                  <button key={t.value} onClick={() => setFormBloque({...formBloque, tipo: t.value})}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (formBloque.tipo === t.value ? t.color : 'rgba(255,255,255,0.1)'),
                      background: formBloque.tipo === t.value ? t.color + '33' : 'transparent', color: formBloque.tipo === t.value ? t.color : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setEditandoBloque(null)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardando || !formBloque.ramo_nombre.trim()}
                style={{ flex: 2, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 12, padding: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !formBloque.ramo_nombre.trim() ? 0.5 : 1 }}>
                {guardando ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RamosScreen({ ramos, onSelect, onAdd, onLogout, onAdmin, onHorario, usuario, onUniversidad, horario }) {
  const [nuevo, setNuevo] = useState('')
  const [min, setMin] = useState('4.0')
  const [exim, setExim] = useState('')
  const [condExim, setCondExim] = useState('')
  const [mostrarExim, setMostrarExim] = useState(false)
  const [mostrando, setMostrando] = useState(false)
  const [mostrarNotif, setMostrarNotif] = useState(false)

  const agregar = () => {
    if (!nuevo.trim()) return
    onAdd({ nombre: nuevo.trim(), min_aprobacion: parseFloat(min) || 4.0, nota_eximicion: exim ? parseFloat(exim) : null, condiciones_eximicion: condExim === 'sin_rojos' ? 'sin_rojos' : null, sin_rojos: condExim === 'sin_rojos' })
    setNuevo(''); setMin('4.0'); setExim(''); setCondExim(''); setMostrarExim(false); setMostrando(false)
  }

  // Stats globales
  const statsRamos = ramos.map(r => {
    const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
    return evs.length > 0 ? calcular(evs, r.min_aprobacion, r) : null
  })
  const aprobados = statsRamos.filter(c => c && (c.estado === 'aprobado' || c.estado === 'eximido')).length
  const conExamen = statsRamos.filter(c => c && c.estado === 'con_examen').length
  const enCurso = statsRamos.filter(c => !c || c.estado === null).length

  // Clases de hoy
  const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const diaHoy = DIAS_ES[new Date().getDay()]
  const clasesHoy = (horario || []).filter(h => h.dia === diaHoy).sort((a,b) => (a.hora_inicio||'').localeCompare(b.hora_inicio||''))
  const ahoraStr = new Date().toTimeString().slice(0,5)
  const claseActual = clasesHoy.find(h => h.hora_inicio <= ahoraStr && h.hora_fin > ahoraStr)
  const proximaClase = clasesHoy.find(h => h.hora_inicio > ahoraStr)

  // Próximas evaluaciones (todas las evaluaciones con fecha, ordenadas)
  const proximas = ramos.flatMap(r =>
    (r.evaluaciones || [])
      .filter(e => e.fecha && (e.nota === null || e.nota === undefined || e.nota === ''))
      .map(e => ({ ...e, ramoNombre: r.nombre, ramoId: r.id }))
  ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 5)

  // Badge notificaciones (evaluaciones en los próximos 3 días)
  const evalProximas3dias = proximas.filter(e => {
    const dias = Math.ceil((new Date(e.fecha) - new Date()) / 86400000)
    return dias >= 0 && dias <= 3
  }).length

  const hoy = new Date()
  const diasRestantes = (fecha) => {
    const diff = Math.ceil((new Date(fecha) - hoy) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <>
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 120px' }}>
      <BackgroundOrbs />
          <BannerInstalar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '56px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Hola, {usuario?.nombre?.split(' ')[0] || 'estudiante'} 👋</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>Mis Ramos</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={onHorario} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>📅 Horario</button>
            <button onClick={() => setMostrarNotif(true)} style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: 'pointer' }}>
              🔔
              {evalProximas3dias > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#f87171', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{evalProximas3dias}</span>
              )}
            </button>
            {usuario?.email === 'abelespinozav@gmail.com' && (
              <button onClick={onAdmin} style={{ background: 'var(--shadow-color)', border: '1px solid var(--shadow-color)', borderRadius: 12, padding: '8px 14px', color: 'var(--color-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🛡️ Admin</button>
            )}
            <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Salir</button>
          </div>

        </div>
        <div style={{ padding: '0 16px' }}>
          <TipInteligente ramos={ramos} />
          {/* Mini stats */}
          {ramos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'En curso', value: enCurso, color: 'var(--color-secondary)', bg: 'rgba(167,139,250,0.1)' },
                { label: 'Con examen', value: conExamen, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                { label: 'Aprobados', value: aprobados, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: 'backOut' }}
                  style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Clases de hoy */}
          {clasesHoy.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, margin: '0 0 10px', textTransform: 'uppercase' }}>🗓️ Hoy · {diaHoy}</p>
              {claseActual && (
                <div style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#a78bfa' }}>{claseActual.ramo_nombre}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{claseActual.hora_inicio}–{claseActual.hora_fin} {claseActual.sala ? '· ' + claseActual.sala : ''}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(108,99,255,0.2)', padding: '3px 8px', borderRadius: 6 }}>EN CURSO</span>
                  </div>
                </div>
              )}
              {proximaClase && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 14px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{proximaClase.ramo_nombre}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{proximaClase.hora_inicio}–{proximaClase.hora_fin} {proximaClase.sala ? '· ' + proximaClase.sala : ''}</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>próxima</span>
                  </div>
                </div>
              )}
              {!claseActual && !proximaClase && (
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No quedan más clases por hoy 🎉</p>
              )}
              <button onClick={onHorario} style={{ marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', padding: 0 }}>Ver horario completo →</button>
            </motion.div>
          )}

          {/* Próximas evaluaciones */}
          {proximas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
              style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, margin: '0 0 10px', textTransform: 'uppercase' }}>📅 Próximas evaluaciones</p>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {proximas.map((ev, i) => {
                  const dias = diasRestantes(ev.fecha)
                  const urgente = dias <= 3
                  const pronto = dias <= 7
                  const borderColor = urgente ? '#f87171' : pronto ? '#fbbf24' : 'rgba(255,255,255,0.08)'
                  const diasColor = urgente ? '#f87171' : pronto ? '#fbbf24' : 'rgba(255,255,255,0.4)'
                  return (
                    <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '12px 14px', border: `1px solid ${borderColor}`, flexShrink: 0, minWidth: 140, maxWidth: 160 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.nombre}</p>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginBottom: 8, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.ramoNombre}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: diasColor, margin: 0 }}>
                          {dias === 0 ? '¡Hoy!' : dias === 1 ? 'Mañana' : dias < 0 ? 'Vencida' : `${dias}d`}
                        </p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 600 }}>{ev.ponderacion}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Grid de ramos */}
          {ramos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Aún no tienes ramos.<br/>¡Agrega tu primer ramo!</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, margin: '0 0 10px', textTransform: 'uppercase' }}>📚 Ramos</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {ramos.map((r, i) => {
                  const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
                  const calc = evs.length > 0 ? calcular(evs, r.min_aprobacion, r) : null
                  const completadas = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '').length
                  const total = evs.length
                  const progreso = total > 0 ? (completadas / total) * 100 : 0
                  const estadoColor = !calc ? 'var(--color-primary)' : calc.estado === 'eximido' ? 'var(--color-secondary)' : calc.estado === 'aprobado' ? '#4ade80' : calc.estado === 'con_examen' ? '#fbbf24' : calc.estado === 'reprobado_sin_examen' || calc.estado === 'reprobado_imposible' || calc.estado === 'imposible' ? '#f87171' : 'var(--color-primary)'
                  const estadoLabel = !calc ? null : calc.estado === 'eximido' ? '🎓 Eximido' : calc.estado === 'aprobado' ? '✓ Aprobado' : calc.estado === 'con_examen' ? '📝 Examen' : calc.estado === 'reprobado_sin_examen' ? '🚫 Sin examen' : calc.estado === 'reprobado_imposible' || calc.estado === 'imposible' ? '✗ Reprobado' : null
                  return (
                    <div key={r.id} onClick={() => onSelect(r)}
                      style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '16px', cursor: 'pointer', border: `1px solid ${estadoColor}25`, animation: `slideUp 0.4s ${i * 0.07}s ease both`, transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 140 }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${estadoColor}20` }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.3 }}>{r.nombre}</p>
                        {estadoLabel && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: estadoColor, background: `${estadoColor}18`, padding: '3px 7px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>{estadoLabel}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        {calc?.promedio !== null && calc?.promedio !== undefined ? (
                          <div>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Promedio</p>
                            <p style={{ fontSize: 28, fontWeight: 800, color: notaColor(calc.promedio), margin: 0, lineHeight: 1 }}>{calc.promedio.toFixed(1)}</p>
                          </div>
                        ) : calc?.necesaria !== null && calc?.necesaria !== undefined ? (
                          <div>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>Necesitas</p>
                            <p style={{ fontSize: 28, fontWeight: 800, color: calc.necesaria > 6 ? '#f87171' : calc.necesaria > 5 ? '#fbbf24' : '#4ade80', margin: 0, lineHeight: 1 }}>{calc.necesaria > 7 ? '✗' : calc.necesaria.toFixed(1)}</p>
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Sin notas aún</p>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 5px' }}>{completadas}/{total} evaluaciones</p>
                        {total > 0 && (
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progreso}%`, background: `linear-gradient(90deg, ${estadoColor}, ${estadoColor}aa)`, borderRadius: 99, transition: 'width 0.5s ease' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {mostrando ? (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '20px', border: '1.5px solid rgba(108,99,255,0.3)', animation: 'slideUp 0.3s ease' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 16px' }}>Nuevo ramo</p>
              <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Nombre del ramo" onKeyDown={e => e.key === 'Enter' && agregar()}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Nota mínima de aprobación</p>
                <input type="number" min="1" max="7" step="0.1" value={min} onChange={e => setMin(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <button onClick={() => setMostrarExim(!mostrarExim)} style={{ background: 'none', border: 'none', color: 'rgba(167,139,250,0.8)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 8 }}>
                  {mostrarExim ? '▼' : '▶'} Configurar eximición (opcional)
                </button>
                {mostrarExim && (
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Nota mínima para eximirse</p>
                    <input type="number" min="1" max="7" step="0.1" value={exim} onChange={e => setExim(e.target.value)} placeholder="Ej: 5.0"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setCondExim(condExim === 'sin_rojos' ? '' : 'sin_rojos')}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid rgba(167,139,250,0.5)', background: condExim === 'sin_rojos' ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {condExim === 'sin_rojos' && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Requiere sin notas rojas (bajo 4.0)</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setMostrando(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={agregar} style={{ flex: 2, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setMostrando(true)} style={{ width: '100%', background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 16, padding: '16px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
              + Agregar ramo
            </button>
          )}
        </div>
      </div>
    </div>
    {mostrarNotif && <PanelNotificaciones onClose={() => setMostrarNotif(false)} proximas={proximas} />}
    </>
  )
}

function RamoScreen({ ramo, onBack, onUpdate, onDelete, onPlan }) {
  const [notas, setNotas] = useState({})
  const [editando, setEditando] = useState({})
  const [nuevaEv, setNuevaEv] = useState({ nombre: '', ponderacion: '', fecha: '' })
  const [mostrando, setMostrando] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [editandoRamo, setEditandoRamo] = useState(false)
  const [editNombre, setEditNombre] = useState(ramo.nombre)
  const [editMin, setEditMin] = useState(ramo.min_aprobacion)
  const [editExim, setEditExim] = useState(ramo.nota_eximicion || '')
  const [editCondExim, setEditCondExim] = useState(ramo.condiciones_eximicion || '')
  const [editPondExamen, setEditPondExamen] = useState(ramo.ponderacion_examen || 25)
  const [notaExamen, setNotaExamen] = useState(ramo.nota_examen || '')
  const [editSinRojos, setEditSinRojos] = useState(ramo.sin_rojos || false)

  const evs = (ramo.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
  const { promedio, necesaria, necesariaExamen, estado, pendientesCount, pesoCompleto, pesoTotal, eximido, tieneRojos } = calcular(evs, ramo.min_aprobacion, ramo)
  const pesoUsado = evs.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoDisponible = Math.round((100 - pesoUsado) * 10) / 10
  const completadasCount = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '').length
  const colorNecesaria = necesaria === null ? 'var(--color-secondary)' : necesaria > 6 ? '#f87171' : necesaria > 5 ? '#fbbf24' : '#4ade80'

  const guardarEdicionRamo = () => {
    if (!editNombre.trim()) return
    onUpdate({ ...ramo, nombre: editNombre.trim(), min_aprobacion: parseFloat(editMin) || 4.0, nota_eximicion: editExim ? parseFloat(editExim) : null, condiciones_eximicion: editCondExim.trim() || null, ponderacion_examen: parseFloat(editPondExamen) || 25, sin_rojos: editSinRojos, nota_examen: ramo.nota_examen })
    setEditandoRamo(false)
  }

  const guardarNota = (ev) => {
    if (!notas[ev.id] || notas[ev.id] === '') {
      borrarNota(ev.id)
      setEditando({ ...editando, [ev.id]: false })
      return
    }
    const nota = notas[ev.id]
    if (nota === undefined || nota === '') return
    const nueva = parseFloat(nota)
    if (isNaN(nueva) || nueva < 1 || nueva > 7) return
    const nuevasEvs = evs.map(e => e.id === ev.id ? { ...e, nota: nueva } : e)
    onUpdate({ ...ramo, evaluaciones: nuevasEvs })
    setEditando({ ...editando, [ev.id]: false })
    setNotas({ ...notas, [ev.id]: undefined })
    const calc = calcular(nuevasEvs, ramo.min_aprobacion, ramo)
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
  const borrarNota = (id) => onUpdate({ ...ramo, evaluaciones: evs.map(e => e.id === id ? { ...e, nota: null } : e) })

  const proximaEv = evs.filter(e => (e.nota === null || e.nota === undefined || e.nota === '') && e.fecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]

  // Mensaje resumen inteligente
  const MensajeResumen = () => {
    if (estado) return null
    // Faltan evaluaciones para llegar al 100%
    if (!pesoCompleto && pesoDisponible > 0) {
      return (
        <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid var(--shadow-color)', borderRadius: 14, padding: '12px 16px' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
            ⚠️ Aún te faltan evaluaciones — llevas <strong style={{ color: 'var(--color-secondary)' }}>{pesoTotal}%</strong> del 100% del ramo. Agrega las evaluaciones restantes para calcular tu nota necesaria.
          </p>
        </div>
      )
    }
    // 100% cargado, sin notas aún
    if (pesoCompleto && completadasCount === 0) {
      return (
        <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid var(--shadow-color)', borderRadius: 14, padding: '12px 16px' }}>
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
            {necesaria > 6.5 && necesaria <= 7 && <span style={{ color: '#f87171' }}> — muy difícil, pero no imposible 😓</span>}
            {necesaria > 7 && <span style={{ color: '#f87171' }}> — no es posible aprobar este ramo 😔</span>}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
      <Confetti active={confetti} />
      {editandoRamo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setEditandoRamo(false)}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '24px 24px 0 0', padding: '28px 20px 40px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 20px' }}>✏️ Editar ramo</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Nombre del ramo</p>
            <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Nota mínima para aprobar</p>
            <input type="number" min="1" max="7" step="0.1" value={editMin} onChange={e => setEditMin(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Nota de eximición (opcional)</p>
            <input type="number" min="1" max="7" step="0.1" value={editExim} onChange={e => setEditExim(e.target.value)} placeholder="Ej: 5.0"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }} onClick={() => setEditSinRojos(!editSinRojos)}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid rgba(167,139,250,0.5)', background: editSinRojos ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {editSinRojos && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Eximición requiere sin notas rojas (bajo 4.0)</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditandoRamo(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarEdicionRamo} style={{ flex: 2, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
      <BackgroundOrbs />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a1a 100%)', padding: '56px 20px 24px' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>← Volver</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>{ramo.nombre}</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Mínimo para aprobar: {ramo.min_aprobacion}</p>
              {ramo.nota_eximicion && (
                <p style={{ fontSize: 12, color: 'rgba(167,139,250,0.6)', margin: '2px 0 0' }}>
                  🎓 Eximición: {ramo.nota_eximicion}{ramo.condiciones_eximicion ? ` · ${ramo.condiciones_eximicion}` : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditandoRamo(true)} style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid var(--shadow-color)', borderRadius: 12, padding: '8px 12px', color: 'var(--color-secondary)', fontSize: 12, cursor: 'pointer' }}>✏️</button>
              <button onClick={() => { if(window.confirm('¿Eliminar este ramo?')) onDelete(ramo.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '8px 12px', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
            </div>
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
            <div style={{
              background: estado === 'eximido' ? 'rgba(167,139,250,0.15)' : estado === 'aprobado' ? 'rgba(34,197,94,0.15)' : estado === 'con_examen' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              borderRadius: 20, padding: '20px',
              border: `1px solid ${estado === 'eximido' ? 'rgba(167,139,250,0.3)' : estado === 'aprobado' ? 'rgba(34,197,94,0.3)' : estado === 'con_examen' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              textAlign: 'center', animation: 'slideUp 0.4s ease' }}>
              <p style={{ fontSize: 32 }}>{estado === 'eximido' ? '🎓' : estado === 'aprobado' ? '🎉' : estado === 'con_examen' ? '📝' : '😔'}</p>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
                {estado === 'eximido' ? '¡Estás eximido!' : estado === 'aprobado' ? '¡Ramo aprobado!' : estado === 'con_examen' ? 'Debes rendir examen' : 'Ramo reprobado'}
              </p>
              {estado === 'eximido' && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio semestre: <strong style={{ color: 'var(--color-secondary)' }}>{promedio?.toFixed(1)}</strong></p>}
              {estado === 'aprobado' && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio final: <strong style={{ color: '#4ade80' }}>{promedio?.toFixed(1)}</strong></p>}
              {estado === 'con_examen' && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 8px' }}>Promedio semestre: <strong style={{ color: '#fbbf24' }}>{promedio?.toFixed(1)}</strong></p>
                  {tieneRojos && ramo.sin_rojos && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 6px' }}>⚠️ Tienes notas rojas — no cumples condición de eximición</p>}
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 12px' }}>
                    Necesitas <strong style={{ color: necesariaExamen > 6 ? '#f87171' : necesariaExamen > 5 ? '#fbbf24' : '#4ade80', fontSize: 20 }}>{necesariaExamen?.toFixed(1)}</strong> en el examen ({ramo.ponderacion_examen || 25}%)
                  </p>
                  {/* Recuadro para ingresar nota del examen */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>📋 ¿Ya rendiste el examen?</p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="number" min="1" max="7" step="0.1"
                        placeholder="Nota examen"
                        value={notaExamen}
                        onChange={e => setNotaExamen(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const nota = parseFloat(notaExamen)
                            if (isNaN(nota) || nota < 1 || nota > 7) return
                            const pondEx = (ramo.ponderacion_examen || 25) / 100
                            const pondSem = 1 - pondEx
                            const notaFinal = promedio * pondSem + nota * pondEx
                            onUpdate({ ...ramo, nota_examen: nota, nota_final: parseFloat(notaFinal.toFixed(1)), estado_final: parseFloat(notaFinal.toFixed(1)) >= ramo.min_aprobacion ? 'aprobado' : 'reprobado' })
                          }
                        }}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 16, fontWeight: 700, outline: 'none' }}
                      />
                      <button onClick={() => {
                        const nota = parseFloat(notaExamen)
                        if (isNaN(nota) || nota < 1 || nota > 7) return
                        const pondEx = (ramo.ponderacion_examen || 25) / 100
                        const pondSem = 1 - pondEx
                        const notaFinal = promedio * pondSem + nota * pondEx
                        console.log('DEBUG examen:', { promedio, pondEx, pondSem, nota, notaFinal, min: ramo.min_aprobacion })
                        onUpdate({ ...ramo, nota_examen: nota, nota_final: parseFloat(notaFinal.toFixed(1)), estado_final: parseFloat(notaFinal.toFixed(1)) >= ramo.min_aprobacion ? 'aprobado' : 'reprobado' })
                      }} style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 10, padding: '10px 18px', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        Guardar
                      </button>
                    </div>
                    {ramo.nota_examen && ramo.nota_final && (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: ramo.estado_final === 'aprobado' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${ramo.estado_final === 'aprobado' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                          Nota examen: <strong style={{ color: 'white' }}>{ramo.nota_examen}</strong> · Nota final: <strong style={{ color: ramo.estado_final === 'aprobado' ? '#4ade80' : '#f87171', fontSize: 18 }}>{ramo.nota_final}</strong>
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 700, color: ramo.estado_final === 'aprobado' ? '#4ade80' : '#f87171' }}>
                          {ramo.estado_final === 'aprobado' ? '🎉 ¡Ramo aprobado!' : '😔 Ramo reprobado'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {estado === 'reprobado_imposible' && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio semestre: <strong style={{ color: '#f87171' }}>{promedio?.toFixed(1)}</strong> — imposible aprobar con examen</p>}
              {estado === 'reprobado_sin_examen' && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio semestre: <strong style={{ color: '#f87171' }}>{promedio?.toFixed(1)}</strong> — no alcanzas el mínimo ({ramo.min_aprobacion}) para presentarte a examen</p>}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: 'var(--shadow-color)', borderRadius: 16, padding: '14px 10px', border: '1px solid var(--shadow-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', lineHeight: 1.4 }}>Promedio{'\n'}actual</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: promedio ? notaColor(promedio) : 'rgba(255,255,255,0.3)', margin: 0 }}>{promedio ? promedio.toFixed(1) : '—'}</p>
                </div>
                <div style={{ background: 'var(--shadow-color)', borderRadius: 16, padding: '14px 10px', border: '1px solid var(--shadow-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', lineHeight: 1.4 }}>Nota{'\n'}necesaria</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: colorNecesaria, margin: 0 }}>
                    {necesaria === null ? '—' : necesaria.toFixed(1)}
                  </p>
                </div>
                <div style={{ background: 'var(--shadow-color)', borderRadius: 16, padding: '14px 10px', border: '1px solid var(--shadow-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', lineHeight: 1.4 }}>Evaluaciones{'\n'}pendientes</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: pendientesCount === 0 ? '#4ade80' : 'var(--color-secondary)', margin: 0 }}>{pendientesCount}</p>
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
                <div key={ev.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '14px 16px', border: tieneNota && !estaEditando ? '1px solid var(--shadow-color)' : '1.5px dashed rgba(108,99,255,0.3)', animation: `slideUp 0.3s ${idx * 0.05}s ease both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: tieneNota && !estaEditando ? `${notaColor(notaVal)}22` : 'var(--shadow-color)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tieneNota && !estaEditando ? 15 : 18, fontWeight: 800, color: tieneNota && !estaEditando ? notaColor(notaVal) : 'var(--color-primary)', flexShrink: 0, border: tieneNota && !estaEditando ? `1.5px solid ${notaColor(notaVal)}44` : '1.5px solid var(--shadow-color)' }}>
                      {tieneNota && !estaEditando ? notaVal.toFixed(1) : '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{ev.nombre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: 20 }}>{ev.ponderacion}%</span>
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
                        <button onClick={() => guardarNota(ev)} style={{ background: 'var(--color-primary)', border: 'none', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>✓</button>
                        <button onClick={() => setEditando({ ...editando, [ev.id]: false })} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setEditando({ ...editando, [ev.id]: true })} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '7px 12px', color: 'rgba(255,255,255,0.85)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            {tieneNota ? '✏️ Editar' : '+ Nota'}
                          </button>
                          <button onClick={() => eliminarEv(ev.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 10, padding: '7px 10px', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onPlan(ev) }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '7px 12px', color: 'rgba(255,255,255,0.85)', fontSize: 12, cursor: 'pointer', fontWeight: 600, width: '100%' }}>🤖 Plan IA</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {pesoDisponible > 0 && (
            mostrando ? (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '20px', border: '1.5px solid rgba(108,99,255,0.3)', animation: 'slideUp 0.3s ease' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 16px' }}>Nueva evaluación <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 400 }}>({pesoDisponible}% disponible)</span></p>
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
                  <button onClick={agregarEv} style={{ flex: 2, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setMostrando(true)} style={{ width: '100%', background: 'var(--shadow-color)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 16, padding: '14px', color: 'var(--color-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                + Agregar evaluación ({pesoDisponible}% disponible)
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}


function AdminScreen({ usuario, onBack }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [resetando, setResetando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [detalleUsuario, setDetalleUsuario] = useState(null)
  const [detalleData, setDetalleData] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [limiteGlobal, setLimiteGlobal] = useState(100)
  const [limiteInput, setLimiteInput] = useState('100')
  const [guardandoLimite, setGuardandoLimite] = useState(false)

  const aplicarLimiteGlobal = async () => {
    const nuevo = parseInt(limiteInput)
    if (isNaN(nuevo) || nuevo < 0) return alert('Ingresa un número válido')
    setGuardandoLimite(true)
    try {
      const res = await fetch(`${API}/admin/limite-global`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ limite: nuevo })
      })
      if (res.ok) {
        setLimiteGlobal(nuevo)
        setMensaje(`✅ Límite global actualizado a ${nuevo} para todos los usuarios`)
        setTimeout(() => setMensaje(null), 3000)
        cargarStats()
      }
    } catch(e) { console.error(e) }
    setGuardandoLimite(false)
  }

  const cargarStats = () => {
    setLoading(true)
    fetch(`${API}/admin/stats`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
        if (data.limiteGlobal !== undefined) {
          setLimiteGlobal(data.limiteGlobal)
          setLimiteInput(String(data.limiteGlobal))
        }
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => {
    cargarStats()
    fetch(`${API}/admin/limite-global`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.limite !== undefined) {
          setLimiteGlobal(data.limite)
          setLimiteInput(String(data.limite))
        }
      })
      .catch(e => console.error(e))
  }, [])

  const resetContador = async (usuario_id, campo, nombre) => {
    const label = campo === 'todos' ? 'todos los contadores' : campo.replace('_usados', '').replace('_', ' ')
    if (!confirm(`¿Resetear ${label} de ${nombre}?`)) return
    setResetando(`${usuario_id}-${campo}`)
    try {
      const res = await fetch(`${API}/admin/reset-contadores`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ usuario_id, campo })
      })
      if (res.ok) {
        setMensaje(`✅ Reseteado ${label} de ${nombre}`)
        setTimeout(() => setMensaje(null), 3000)
        cargarStats()
      }
    } catch(e) { console.error(e) }
    setResetando(null)
  }

  const verDetalle = async (u) => {
    setDetalleUsuario(u)
    setDetalleData(null)
    setCargandoDetalle(true)
    try {
      const res = await fetch(`${API}/admin/usuario/${u.id}/detalle`, { headers: authHeaders() })
      if (res.ok) setDetalleData(await res.json())
    } catch(e) { console.error(e) }
    setCargandoDetalle(false)
  }

  const calcularPromedio = (evaluaciones) => {
    if (!evaluaciones?.length) return null
    const conNota = evaluaciones.filter(e => e.nota != null && e.ponderacion != null)
    if (!conNota.length) return null
    const totalPeso = conNota.reduce((s, e) => s + parseFloat(e.ponderacion), 0)
    const suma = conNota.reduce((s, e) => s + parseFloat(e.nota) * parseFloat(e.ponderacion), 0)
    return totalPeso > 0 ? (suma / totalPeso).toFixed(1) : null
  }

  const eliminarUsuario = async (u) => {
    if (!confirm(`⚠️ ¿Eliminar a ${u.nombre} y TODOS sus datos? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`${API}/admin/usuario/${u.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (res.ok) {
        setMensaje(`🗑️ Usuario ${u.nombre} eliminado`)
        setTimeout(() => setMensaje(null), 3000)
        if (detalleUsuario?.id === u.id) setDetalleUsuario(null)
        cargarStats()
      }
    } catch(e) { console.error(e) }
  }

  const usuariosFiltrados = stats?.usuarios?.filter(u =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const CONTADORES = [
    { campo: 'podcasts_usados', label: '🎙️', limite: limiteGlobal },
    { campo: 'ejercicios_usados', label: '📥', limite: limiteGlobal },
    { campo: 'quizzes_usados', label: '🧠', limite: limiteGlobal },
    { campo: 'planes_usados', label: '🤖', limite: limiteGlobal },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 24, color: 'white' }}>
      <BackgroundOrbs />
      <BannerInstalar />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 750, margin: '0 auto' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '8px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer', marginBottom: 24 }}>← Volver</button>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Panel Admin 🛡️</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 24px' }}>Solo visible para {usuario?.email}</p>

        {mensaje && <div style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid #4ade80', borderRadius: 10, padding: '10px 16px', color: '#4ade80', fontSize: 13, marginBottom: 16 }}>{mensaje}</div>}
        {loading && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando...</p>}
        {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}

        {stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total usuarios', value: stats.stats.total_usuarios, icon: '👥' },
                { label: 'Nuevos (7 días)', value: stats.stats.nuevos_7d, icon: '🆕' },
                { label: 'Activos (7 días)', value: stats.stats.activos_7d, icon: '🟢' },
                { label: 'Ramos creados', value: stats.ramos, icon: '📚' },
                { label: 'Evaluaciones', value: stats.evaluaciones, icon: '📝' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--shadow-color)' }}>
                  <p style={{ margin: 0, fontSize: 24 }}>{s.icon}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--color-secondary)' }}>{s.value}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--shadow-color)', marginBottom: 16 }}>
              <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 15 }}>⚙️ Límite global de uso</p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Define cuántas generaciones puede hacer cada usuario (podcasts, ejercicios, quizzes, planes)</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  value={limiteInput}
                  onChange={e => setLimiteInput(e.target.value)}
                  style={{ width: 100, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 16, fontWeight: 700, outline: 'none', textAlign: 'center' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>generaciones por usuario</span>
                <button onClick={aplicarLimiteGlobal} disabled={guardandoLimite}
                  style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 10, padding: '8px 18px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>
                  {guardandoLimite ? '⏳ Guardando...' : '💾 Aplicar'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[10, 25, 50, 100, 999].map(n => (
                  <button key={n} onClick={() => { setLimiteInput(String(n)); setLimiteGlobal(n) }}
                    style={{ background: limiteGlobal === n ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.06)', border: `1px solid ${limiteGlobal === n ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '4px 12px', color: limiteGlobal === n ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    {n === 999 ? '∞' : n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--shadow-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>👤 Usuarios registrados</p>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  <span>🎙️ Podcasts</span><span>📥 Ejercicios</span><span>🧠 Quizzes</span><span>🤖 Planes</span>
                </div>
              </div>
              <input
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {usuariosFiltrados.map((u, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => verDetalle(u)}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#a78bfa' }}>{u.nombre} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>ver detalle →</span></p>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Registro: {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CL') : '—'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: u.last_login ? '#4ade80' : 'rgba(255,255,255,0.2)' }}>Último login: {u.last_login ? new Date(u.last_login).toLocaleDateString('es-CL') : 'Sin registro'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {CONTADORES.map(({ campo, label, limite }) => {
                        const usado = u[campo] || 0
                        const lleno = usado >= limite
                        return (
                          <button key={campo} onClick={() => resetContador(u.id, campo, u.nombre)} disabled={resetando === `${u.id}-${campo}`}
                            style={{ background: lleno ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${lleno ? '#f87171' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '4px 10px', color: lleno ? '#f87171' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            {label} {usado}/{limite} {lleno ? '🔴' : ''}
                          </button>
                        )
                      })}
                      <button onClick={() => resetContador(u.id, 'todos', u.nombre)} disabled={resetando === `${u.id}-todos`}
                        style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: 8, padding: '4px 10px', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' }}>
                        {resetando === `${u.id}-todos` ? '⏳' : '🔄 Reset todo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL DETALLE USUARIO */}
      {detalleUsuario && (
        <div onClick={() => setDetalleUsuario(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 20, padding: 24, width: '100%', maxWidth: 680, border: '1px solid rgba(255,255,255,0.1)', marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{detalleUsuario.nombre}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{detalleUsuario.email}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDetalleUsuario(null); eliminarUsuario(detalleUsuario) }} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '6px 12px', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>🗑️ Eliminar</button>
                <button onClick={() => setDetalleUsuario(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>✕ Cerrar</button>
              </div>
            </div>

            {/* Uso de IA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Podcasts', valor: detalleUsuario.podcasts_usados || 0, limite: 100, icon: '🎙️' },
                { label: 'Ejercicios', valor: detalleUsuario.ejercicios_usados || 0, limite: 100, icon: '📥' },
                { label: 'Quizzes', valor: detalleUsuario.quizzes_usados || 0, limite: 100, icon: '🧠' },
                { label: 'Planes', valor: detalleUsuario.planes_usados || 0, limite: 100, icon: '🤖' },
              ].map(({ label, valor, limite, icon }) => (
                <div key={label} style={{ background: valor >= limite ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', textAlign: 'center', border: `1px solid ${valor >= limite ? '#f87171' : 'rgba(255,255,255,0.08)'}` }}>
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: valor >= limite ? '#f87171' : '#a78bfa' }}>{valor}/{limite}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                </div>
              ))}
            </div>

            {cargandoDetalle && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Cargando detalle...</p>}

            {detalleData && (
              <>
                {/* Ramos y evaluaciones */}
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>📚 Ramos ({detalleData.ramos.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {detalleData.ramos.map((r, i) => {
                    const promedio = calcularPromedio(r.evaluaciones)
                    const aprobado = promedio && parseFloat(promedio) >= (r.min_aprobacion || 4.0)
                    return (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{r.nombre}</span>
                          {promedio && <span style={{ fontWeight: 800, fontSize: 16, color: aprobado ? '#4ade80' : '#f87171' }}>{promedio}</span>}
                        </div>
                        {r.evaluaciones?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {r.evaluaciones.map((e, j) => (
                              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{e.nombre}</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  {e.ponderacion && <span style={{ color: 'rgba(255,255,255,0.3)' }}>{e.ponderacion}%</span>}
                                  {e.nota ? <span style={{ fontWeight: 700, color: parseFloat(e.nota) >= (r.min_aprobacion || 4.0) ? '#4ade80' : '#f87171' }}>{parseFloat(e.nota).toFixed(1)}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>Sin nota</span>}
                                  {e.tiene_plan && <span title="Tiene plan">🤖</span>}
                                  {e.tiene_quiz && <span title="Tiene quiz">🧠</span>}
                                  {e.archivos?.length > 0 && <span title={`${e.archivos.length} archivo(s)`}>📁{e.archivos.length}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Sin evaluaciones</p>}
                      </div>
                    )
                  })}
                </div>

                {/* Podcasts recientes */}
                {detalleData.podcasts?.length > 0 && (
                  <>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>🎙️ Podcasts generados</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {detalleData.podcasts.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.titulo || 'Sin título'} <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {p.ramo_nombre}</span></span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(p.created_at).toLocaleDateString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [pantalla, setPantalla] = useState('login')
  const [usuario, setUsuario] = useState(null)

  useTheme(usuario?.universidad)
  const [ramos, setRamos] = useState([])
  const [ramoActivo, setRamoActivo] = useState(null)
  const [planEv, setPlanEv] = useState(null)
  const [horarioGlobal, setHorarioGlobal] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('usuario')
    if (token && user) {
      setUsuario(JSON.parse(user))
      cargarRamos(token)
      cargarHorarioGlobal()
      setPantalla('ramos')
    }
    const handler = () => cargarRamos(localStorage.getItem('token'))
    window.addEventListener('ramos-actualizados', handler)
    return () => window.removeEventListener('ramos-actualizados', handler)
  }, [])

  const cargarRamos = async (token, refreshActivo = false) => {
    try {
      const res = await fetch(`${API}/ramos`, { headers: authHeaders({ 'Content-Type': 'application/json' }) })
      if (res.ok) {
        const data = await res.json()
        setRamos(data)
        if (refreshActivo && ramoActivo) {
          const ramoFresh = data.find(r => r.id === ramoActivo.id)
          if (ramoFresh) {
            setRamoActivo(ramoFresh)
            if (planEv) {
              const evFresh = ramoFresh.evaluaciones?.find(e => e.id === planEv.id)
              if (evFresh) setPlanEv(evFresh)
            }
          }
        }
      }
    } catch (e) { console.error(e) }
  }

  const cargarHorarioGlobal = async () => {
    try {
      const res = await fetch(`${API}/horario`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setHorarioGlobal(Array.isArray(data) ? data : [])
      }
    } catch(e) { console.error(e) }
  }

  const handleLogin = () => { window.location.href = `${API}/auth/google` }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, '', '/')
      fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const user = data.user || data
          localStorage.setItem('usuario', JSON.stringify(user))
          setUsuario(user)
          if (!user.onboarding_completado) {
            setPantalla('onboarding')
          } else {
            cargarRamos(token)
            cargarHorarioGlobal()
            setPantalla('ramos')
          }
        })
        .catch(e => console.error('Error auth/me:', e))
    }
  }, [])

  const handleUniversidad = async (universidad) => {
    try {
      const res = await fetch(`${API}/usuarios/universidad`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ universidad })
      })
      if (res.ok) {
        const updated = { ...usuario, universidad }
        setUsuario(updated)
        localStorage.setItem('usuario', JSON.stringify(updated))
      }
    } catch(e) { console.error(e) }
  }

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('usuario')
    setUsuario(null); setRamos([]); setRamoActivo(null); setPantalla('login')
  }

  const handleAddRamo = async (data) => {
    try {
      const res = await fetch(`${API}/ramos`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data) })
      if (res.ok) { const nuevo = await res.json(); setRamos([...ramos, nuevo]) }
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

  if (pantalla === 'admin' && usuario?.email === 'abelespinozav@gmail.com') return <AdminScreen usuario={usuario} onBack={() => setPantalla('ramos')} />
  if (pantalla === 'login') return <LoginScreen onLogin={handleLogin} />
  if (pantalla === 'onboarding') return <OnboardingScreen user={usuario} API={API} onComplete={(u) => { setUsuario({ ...usuario, ...u, name: u.nombre }); const token = localStorage.getItem('token'); cargarRamos(token); setPantalla('ramos') }} />
  if (pantalla === 'ramos') return <RamosScreen ramos={ramos} onSelect={r => { setRamoActivo(r); setPantalla('ramo') }} onAdd={handleAddRamo} onLogout={handleLogout} onAdmin={() => setPantalla('admin')} onHorario={() => setPantalla('horario')} usuario={usuario} onUniversidad={handleUniversidad} horario={horarioGlobal} />
  if (pantalla === 'ramo' && ramoActivo) return <RamoScreen ramo={ramoActivo} onBack={() => setPantalla('ramos')} onUpdate={handleUpdateRamo} onDelete={handleDeleteRamo} onPlan={(ev) => { setPlanEv(ev); setPantalla('plan') }} />
  if (pantalla === 'horario') return <HorarioScreen usuario={usuario} onBack={() => { cargarHorarioGlobal(); setPantalla('ramos') }} API={API} authHeaders={authHeaders} />
  if (pantalla === 'plan' && planEv && ramoActivo) return <PlanEstudio evaluacion={planEv} ramo={ramoActivo} onBack={async () => {
    const token = localStorage.getItem('token')
    await cargarRamos(token, true)
    setPantalla('ramo')
  }} />
  return null
}
