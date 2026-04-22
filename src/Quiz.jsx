import { useState, useEffect } from 'react'
import { useNotificaciones, NudgeActivarCard } from './Notificaciones'
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })
const COSTO_QUIZ = 10

// Copia local (no importar desde App para evitar ciclo — App ya importa Quiz).
function CreditBadge({ costo, creditos }) {
  const sinCreditos = creditos !== null && creditos !== undefined && creditos < costo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: sinCreditos ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
      border: `1px solid ${sinCreditos ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.3)'}`,
      borderRadius: 20, padding: '2px 8px',
      fontSize: 11, fontWeight: 700,
      color: sinCreditos ? '#f87171' : '#fbbf24',
      whiteSpace: 'nowrap', marginLeft: 6
    }}>⚡ {costo} cr</span>
  )
}

const DIFICULTAD_COLOR = { facil: '#4ade80', media: '#fbbf24', dificil: '#f87171' }

// Hint dentro del loader del quiz. Source of truth: endpoint backend
// /notificaciones/estado que consolida (subs en DB + config.activo).
// Antes chequeaba solo Notification.permission del browser, lo que
// mentía en 3 cases (config.activo=false, config=null, subs vencida).
// Ahora solo promete "te avisaremos" si el backend confirma puede_recibir.
function LoaderNotifHint() {
  const soportado = typeof window !== 'undefined' && 'Notification' in window
  if (!soportado) return null
  return <LoaderNotifHintInner />
}

function LoaderNotifHintInner() {
  const { permiso, activar, cargando } = useNotificaciones()
  const [estado, setEstado] = useState(null) // { puede_recibir, razon } del backend
  const [cargandoEstado, setCargandoEstado] = useState(true)

  const refrescarEstado = () => {
    fetch(`${API}/notificaciones/estado`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setEstado(d); setCargandoEstado(false) })
      .catch(() => setCargandoEstado(false))
  }
  useEffect(() => { refrescarEstado() }, [])

  const activarYRefrescar = async () => {
    await activar()
    // activar() ya hace subscribe + POST config con activo:true, pero usa el
    // config actual del hook — si el user tenía notif_clases o notif_ventanas
    // en false, quedarían así. Desde este pill el usuario está pidiendo "dale,
    // actívamelas todas", así que forzamos el full-on con defaults sensatos.
    try {
      await fetch(`${API}/notificaciones/config`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          activo: true,
          dias_antes: [1, 2, 5],
          notif_clases: true,
          notif_ventanas: true
        })
      })
    } catch(e) { console.error(e) }
    setTimeout(refrescarEstado, 400)
  }

  const baseStyle = { fontSize: 12, margin: '0 0 2px', maxWidth: 360, lineHeight: 1.5 }

  // Mientras carga el estado inicial, silencio (no mostrar nada para no parpadear).
  if (cargandoEstado) return null

  // Source of truth: si el backend dice que puede recibir, prometer.
  if (estado?.puede_recibir) {
    return <p style={{ ...baseStyle, color: '#34d399' }}>✅ Te avisaremos cuando esté listo</p>
  }

  // Desde acá: no puede recibir — razones distintas requieren CTA distintos.
  const razon = estado?.razon
  const pillStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380, margin: '0 auto', padding: '8px 12px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12 }
  const btnActivar = (label = 'Activar') => (
    <button
      onClick={activarYRefrescar}
      disabled={cargando}
      style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 800, cursor: cargando ? 'wait' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
    >
      {cargando ? '…' : label}
    </button>
  )

  // Permiso del browser denegado: no podemos re-preguntar desde JS, el
  // user tiene que ir a settings del browser manualmente.
  if (permiso === 'denied') {
    return (
      <p style={{ ...baseStyle, color: 'rgba(255,255,255,0.38)' }}>
        Activalas desde settings del navegador para futuras — por ahora quédate en la pantalla.
      </p>
    )
  }

  // Resto de los cases no-recibir (sin_subscription, config_off, sin_config)
  // → misma CTA: pill con texto + botón "Activar". activarYRefrescar() llama
  // al hook que hace requestPermission + SW + subscribe + guardarConfig(
  // activo: true), por lo tanto también cubre el case config_off (no solo
  // re-suscribe, también re-activa el toggle en el backend).
  const copy = razon === 'sin_subscription'
    ? '🔔 Activa las notificaciones y te avisamos cuando esté listo'
    : razon === 'config_off'
      ? '🔔 Activa las notificaciones y te avisamos cuando esté listo'
      : '🔔 ¿Activar notificaciones y te avisamos cuando esté listo?'

  return (
    <div style={pillStyle}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{copy}</span>
      {btnActivar()}
    </div>
  )
}

export default function Quiz({ evaluacion, ramo, onBack, onGeneracionExitosa = () => {} }) {
  const [estado, setEstado] = useState('inicio') // inicio | cargando | quiz | resultado
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false)
  const [error, setError] = useState(null)
  const [creditos, setCreditos] = useState(null)
  const [historialGuardado, setHistorialGuardado] = useState(false)

  useEffect(() => {
    if (estado === 'resultado' && !historialGuardado) {
      const { correctas, total } = calcularResultado()
      fetch(`${API}/quiz/historial`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ramo_id: ramo?.id, ramo_nombre: ramo?.nombre, puntaje: correctas, total })
      }).catch(e => console.error('Error guardando historial:', e))
      setHistorialGuardado(true)
    }
  }, [estado])
  const [progresoMsg, setProgresoMsg] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)

  const cargarContador = async () => {
    try {
      const res = await fetch(`${API}/usuarios/creditos`, { headers: authHeaders() })
      if (res.ok) {
        const d = await res.json()
        setCreditos(d.total ?? d.creditos_total ?? 0)
      }
    } catch(e) {}
  }

  // Cargar contador al montar. Ya NO auto-saltamos a 'quiz' aunque haya
  // quiz_generado: ahora la pantalla 'inicio' muestra dos botones
  // (📋 Responder existente · 🔄 Generar nuevo) y el user elige. La primera
  // opción llama verQuizGuardado() que hace el parse + setEstado('quiz').
  useEffect(() => {
    cargarContador()
  }, [evaluacion.id])

  const generarQuiz = async (forzar = false) => {
    setEstado('cargando')
    setError(null)
    setProgresoMsg('🧠 Iniciando...')
    setMostrarModal(false)
    try {
      const res = await fetch(`${API}/evaluaciones/${evaluacion.id}/quiz`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ forzar })
      })

      // Respuesta JSON directa (cache o error antes de SSE)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const data = await res.json()
        if (res.status === 403 && data.error === 'creditos_insuficientes') {
          setCreditos(data.saldo ?? 0)
          alert(`Sin créditos suficientes. Necesitas ${data.creditos_necesarios} cr, tienes ${data.saldo} cr. Ve a Perfil → Ver planes para conseguir más.`)
          setEstado('inicio'); return
        }
        if (!res.ok) { setError(data.error || 'Error desconocido'); setEstado('inicio'); return }
        setPreguntas(data.preguntas)
        setRespuestas({})
        setPreguntaActual(0)
        setMostrarExplicacion(false)
        setEstado('quiz')
        return
      }

      // SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evento = JSON.parse(line.slice(6))
            if (evento.tipo === 'progreso') {
              setProgresoMsg(evento.msg)
            } else if (evento.tipo === 'iniciado') {
              setMostrarModal(true)
            } else if (evento.tipo === 'quiz') {
              setMostrarModal(false)
              setPreguntas(evento.preguntas)
              setRespuestas({})
              setPreguntaActual(0)
              setMostrarExplicacion(false)
              // Optimistic: el backend ya descontó. Resincronizamos con GET
              // /usuarios/creditos en background por si hubo bonos u otras
              // transacciones concurrentes.
              setCreditos(prev => prev !== null ? Math.max(0, prev - COSTO_QUIZ) : prev)
              cargarContador()
              onGeneracionExitosa()
              setEstado('quiz')
            } else if (evento.tipo === 'error') {
              if (evento.error === 'creditos_insuficientes') {
                setCreditos(evento.saldo ?? 0)
                alert('Sin créditos suficientes para generar el quiz.')
              } else {
                setError(evento.mensaje || 'Error generando quiz')
              }
              setMostrarModal(false)
              setEstado('inicio')
            }
          } catch(e) {}
        }
      }
    } catch (e) {
      setError('Error de conexión')
      setMostrarModal(false)
      setEstado('inicio')
    }
    setProgresoMsg('')
  }

  const verQuizGuardado = () => {
    if (evaluacion.quiz_generado) {
      const pregs = typeof evaluacion.quiz_generado === 'string'
        ? JSON.parse(evaluacion.quiz_generado)
        : evaluacion.quiz_generado
      setPreguntas(pregs)
      setRespuestas({})
      setPreguntaActual(0)
      setMostrarExplicacion(false)
      setEstado('quiz')
    }
  }

  const responder = (letra) => {
    if (respuestas[preguntaActual] !== undefined) return
    setRespuestas(prev => ({ ...prev, [preguntaActual]: letra }))
    setMostrarExplicacion(true)
  }

  const siguiente = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(prev => prev + 1)
      setMostrarExplicacion(false)
    } else {
      setEstado('resultado')
    }
  }

  const calcularResultado = () => {
    let correctas = 0
    preguntas.forEach((p, i) => { if (respuestas[i] === p.correcta) correctas++ })
    return { correctas, total: preguntas.length, porcentaje: Math.round((correctas / preguntas.length) * 100) }
  }

  const s = { container: { maxWidth: 700, margin: '0 auto', padding: 20 }, card: { background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginBottom: 16 }, btn: { background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }, btnSecondary: { background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '8px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' } }

  const modalStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: 24
  }
  const modalCardStyle = {
    background: 'var(--bg-card)', border: '1px solid rgba(46,125,209,0.4)',
    borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center'
  }

  if (estado === 'inicio') return (
    <div style={s.container}>
      {mostrarModal && (
        <div style={modalStyle}>
          <div style={modalCardStyle}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
            <h3 style={{ color: '#fff', marginBottom: 8 }}>Generando tu quiz...</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 16 }}>
              Puedes cerrar esta pantalla. Te avisaremos cuando tu quiz esté listo.
            </p>
            <div style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ color: 'var(--color-secondary)', fontSize: 13, margin: 0 }}>{progresoMsg}</p>
            </div>
            <button onClick={() => setMostrarModal(false)} style={{ ...s.btnSecondary, fontSize: 13 }}>
              Entendido, volver al inicio
            </button>
          </div>
        </div>
      )}
      <button onClick={onBack} style={s.btnSecondary}>← Volver</button>
      <div style={{ ...s.card, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Quiz de {evaluacion.nombre}</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{ramo.nombre}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
          20 preguntas generadas por IA basadas en tu material de estudio
        </p>
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', borderRadius: 10, padding: 12, color: '#f87171', marginBottom: 16, fontSize: 13 }}>
            {error}
            {(error.toLowerCase().includes('material') || error.toLowerCase().includes('subir')) && (
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  📎 Subir material ahora
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.webp,.heic,.mp3,.m4a,.wav,.ogg,.mp4,.mov" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    if (!evaluacion?.id) { alert('⚠️ No hay evaluación seleccionada. Entrá a un ramo y elegí una evaluación primero.'); return }
                    const fd = new FormData()
                    fd.append('archivo', file)
                    const r = await fetch(`${API}/evaluaciones/${evaluacion.id}/archivos`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: fd })
                    if (r.ok) { setError(null); alert('✅ Material subido. Ahora puedes generar el quiz.') }
                    else { alert('❌ Error al subir el archivo') }
                  }} />
                </label>
              </div>
            )}
          </div>
        )}

        {creditos !== null && creditos < COSTO_QUIZ ? (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: 10, padding: 12, color: '#f87171', fontSize: 13, marginBottom: 16 }}>
            🔒 Sin créditos suficientes. Necesitas {COSTO_QUIZ} cr, tienes {creditos}. Ve a Perfil → Ver planes.
          </div>
        ) : null}
        {/* Con quiz guardado: primario = responder existente, secundario =
            regenerar con confirm. Sin quiz: botón único como antes. El branch
            de cargando es igual en ambos casos — disabled con progresoMsg. */}
        {estado === 'cargando' ? (
          <button disabled style={{ ...s.btn, background: 'rgba(108,99,255,0.5)', cursor: 'not-allowed' }}>
            ⏳ {progresoMsg || 'Iniciando...'}
          </button>
        ) : evaluacion.quiz_generado ? (
          <>
            <button
              onClick={verQuizGuardado}
              style={{ ...s.btn, background: 'linear-gradient(135deg, #059669, #34d399)', marginBottom: 10 }}
            >
              📋 Responder quiz existente
            </button>
            <button
              onClick={() => {
                if (creditos !== null && creditos < COSTO_QUIZ) return
                if (!window.confirm('¿Seguro que quieres generar un quiz nuevo? El quiz actual será reemplazado.')) return
                generarQuiz(true)
              }}
              disabled={creditos !== null && creditos < COSTO_QUIZ}
              style={{
                ...s.btn,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: (creditos !== null && creditos < COSTO_QUIZ) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.72)',
                fontSize: 13,
                fontWeight: 600,
                cursor: (creditos !== null && creditos < COSTO_QUIZ) ? 'not-allowed' : 'pointer'
              }}
            >
              {(creditos !== null && creditos < COSTO_QUIZ)
                ? '🔒 Sin créditos suficientes'
                : <>🔄 Generar nuevo quiz <CreditBadge costo={COSTO_QUIZ} creditos={creditos} /></>}
            </button>
          </>
        ) : (
          <button
            onClick={() => generarQuiz(false)}
            disabled={creditos !== null && creditos < COSTO_QUIZ}
            style={{ ...s.btn, background: (creditos !== null && creditos < COSTO_QUIZ) ? 'rgba(46,125,209,0.3)' : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', cursor: (creditos !== null && creditos < COSTO_QUIZ) ? 'not-allowed' : 'pointer' }}
          >
            {(creditos !== null && creditos < COSTO_QUIZ)
              ? '🔒 Sin créditos suficientes'
              : <>🤖 Generar Quiz con IA <CreditBadge costo={COSTO_QUIZ} creditos={creditos} /></>}
          </button>
        )}
      </div>
    </div>
  )

  // Loader full-screen durante toda la generación. Antes tenía la condición
  // extra `&& !mostrarModal`, pero el evento SSE 'iniciado' setea
  // mostrarModal=true → ningún branch renderizaba → pantalla negra por varios
  // segundos hasta que llegaba el evento 'quiz'. Ahora siempre cubre el caso.
  if (estado === 'cargando') return (
    <>
      <style>{`
        @keyframes quizSpin { to { transform: rotate(360deg) } }
        @keyframes quizDotPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8) } 40% { opacity: 1; transform: scale(1) } }
        .quiz-loader-spinner { width: 64px; height: 64px; border: 4px solid rgba(255,255,255,0.08); border-top-color: var(--color-primary, #2e7dd1); border-right-color: var(--color-secondary, #a78bfa); border-radius: 50%; animation: quizSpin 0.9s linear infinite; margin-bottom: 28px; }
        .quiz-loader-dots { display: inline-flex; gap: 6px; margin-top: 14px; }
        .quiz-loader-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--color-secondary, #a78bfa); animation: quizDotPulse 1.2s ease-in-out infinite; }
        .quiz-loader-dots span:nth-child(2) { animation-delay: 0.15s }
        .quiz-loader-dots span:nth-child(3) { animation-delay: 0.3s }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a1628)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px 40px', textAlign: 'center', boxSizing: 'border-box' }}>
        <div className="quiz-loader-spinner" />
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.01em' }}>🧠 Generando tu quiz</h2>
        <p style={{ color: 'var(--color-secondary, #a78bfa)', fontSize: 14, margin: '0 0 6px', maxWidth: 420, lineHeight: 1.5 }}>
          {progresoMsg || 'Analizando tu material de estudio…'}
        </p>
        <LoaderNotifHint />
        <div className="quiz-loader-dots"><span/><span/><span/></div>
      </div>
    </>
  )

  if (estado === 'quiz' && preguntas.length === 0) return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingTop: 80, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <p style={{ color: 'var(--color-secondary)', fontSize: 16 }}>Cargando quiz...</p>
    </div>
  )

  if (estado === 'quiz') {
    const p = preguntas[preguntaActual]
    const respuesta = respuestas[preguntaActual]
    const esCorrecta = respuesta === p.correcta
    return (
      <div style={s.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={onBack} style={s.btnSecondary}>← Salir</button>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{preguntaActual + 1} / {preguntas.length}</span>
          <span style={{ background: `${DIFICULTAD_COLOR[p.dificultad]}22`, color: DIFICULTAD_COLOR[p.dificultad], borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{p.dificultad}</span>
        </div>
        <div style={{ background: 'rgba(108,99,255,0.08)', borderRadius: 4, height: 6, marginBottom: 20 }}>
          <div style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        <div style={s.card}>
          <p style={{ color: '#fff', fontSize: 17, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{p.pregunta}</p>
          {Object.entries(p.alternativas).map(([letra, texto]) => {
            let bg = 'rgba(255,255,255,0.05)'
            let border = '1.5px solid rgba(255,255,255,0.1)'
            let color = 'rgba(255,255,255,0.8)'
            if (respuesta) {
              if (letra === p.correcta) { bg = 'rgba(74,222,128,0.15)'; border = '1.5px solid #4ade80'; color = '#4ade80' }
              else if (letra === respuesta && !esCorrecta) { bg = 'rgba(248,113,113,0.15)'; border = '1.5px solid #f87171'; color = '#f87171' }
            }
            return (
              <button key={letra} onClick={() => responder(letra)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', background: bg, border, borderRadius: 10, padding: '12px 16px', color, fontSize: 14, cursor: respuesta ? 'default' : 'pointer', marginBottom: 8, textAlign: 'left', transition: 'all 0.2s' }}>
                <span style={{ fontWeight: 700, minWidth: 20 }}>{letra}.</span>
                <span>{texto}</span>
                {respuesta && letra === p.correcta && <span style={{ marginLeft: 'auto' }}>✓</span>}
                {respuesta && letra === respuesta && !esCorrecta && <span style={{ marginLeft: 'auto' }}>✗</span>}
              </button>
            )
          })}
        </div>
        {mostrarExplicacion && (
          <div style={{ background: esCorrecta ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${esCorrecta ? '#4ade80' : '#f87171'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ color: esCorrecta ? '#4ade80' : '#f87171', fontWeight: 700, marginBottom: 6 }}>{esCorrecta ? '✅ ¡Correcto!' : `❌ Incorrecto — La respuesta era ${p.correcta}`}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{p.explicacion}</p>
          </div>
        )}
        {respuesta && (
          <button onClick={siguiente} style={s.btn}>
            {preguntaActual < preguntas.length - 1 ? 'Siguiente pregunta →' : 'Ver resultado final'}
          </button>
        )}
      </div>
    )
  }

  if (estado === 'resultado') {
    const { correctas, total, porcentaje } = calcularResultado()
    const nota = (1 + (porcentaje / 100) * 6).toFixed(1)
    const aprobado = parseFloat(nota) >= (ramo.min_aprobacion || 4.0)
    return (
      <div style={s.container}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{porcentaje >= 70 ? '🎉' : porcentaje >= 50 ? '😅' : '📚'}</div>
          <h2 style={{ color: '#fff', marginBottom: 4 }}>Resultado del Quiz</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>{evaluacion.nombre} — {ramo.nombre}</p>
          <div style={{ fontSize: 64, fontWeight: 900, color: aprobado ? '#4ade80' : '#f87171', marginBottom: 4 }}>{nota}</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>{correctas} de {total} correctas ({porcentaje}%)</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {['facil','media','dificil'].map(d => {
                const psDif = preguntas.filter(p => p.dificultad === d)
                const corrDif = psDif.filter((p, i) => respuestas[preguntas.indexOf(p)] === p.correcta).length
                return (
                  <div key={d} style={{ textAlign: 'center' }}>
                    <div style={{ color: DIFICULTAD_COLOR[d], fontWeight: 700, fontSize: 18 }}>{corrDif}/{psDif.length}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{d}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => generarQuiz(true)} disabled={creditos !== null && creditos < COSTO_QUIZ} style={{ ...s.btn, flex: 1, background: (creditos !== null && creditos < COSTO_QUIZ) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)', cursor: (creditos !== null && creditos < COSTO_QUIZ) ? 'not-allowed' : 'pointer' }}>
              {(creditos !== null && creditos < COSTO_QUIZ) ? '🔒 Sin créditos' : <>🔄 Nuevo quiz <CreditBadge costo={COSTO_QUIZ} creditos={creditos} /></>}
            </button>
            <button onClick={onBack} style={{ ...s.btn, flex: 1 }}>← Volver</button>
          </div>
        </div>
        <div style={s.card}>
          <h3 style={{ color: '#fff', marginBottom: 16 }}>Revisión de respuestas</h3>
          {preguntas.map((p, i) => {
            const resp = respuestas[i]
            const ok = resp === p.correcta
            return (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ color: ok ? '#4ade80' : '#f87171', fontWeight: 700, minWidth: 20 }}>{ok ? '✓' : '✗'}</span>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>{i+1}. {p.pregunta}</p>
                </div>
                {!ok && <p style={{ color: '#f87171', fontSize: 12, marginLeft: 28 }}>Tu respuesta: {resp} — Correcta: {p.correcta}</p>}
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 28 }}>{p.explicacion}</p>
              </div>
            )
          })}
        </div>
        <NudgeActivarCard texto="🔔 La próxima vez te avisamos cuando tu quiz esté listo — activa las notificaciones" />
      </div>
    )
  }
}
