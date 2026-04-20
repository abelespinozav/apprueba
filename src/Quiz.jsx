import { useState, useEffect } from 'react'
import { useNotificaciones } from './Notificaciones'
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

const DIFICULTAD_COLOR = { facil: '#4ade80', media: '#fbbf24', dificil: '#f87171' }

// Hint dentro del loader del quiz: si el usuario ya tiene notifs push
// activadas, le confirma que le avisaremos. Si no, ofrece activarlas
// inline con un botón pequeño (reutiliza el hook compartido que hace
// requestPermission + SW register + push subscribe + POST backend).
function LoaderNotifHint() {
  const soportado = typeof window !== 'undefined' && 'Notification' in window
  if (!soportado) return null
  return <LoaderNotifHintInner />
}

function LoaderNotifHintInner() {
  const { permiso, activar, cargando } = useNotificaciones()
  const baseStyle = { fontSize: 12, margin: '0 0 2px', maxWidth: 340, lineHeight: 1.5 }
  if (permiso === 'granted') {
    return <p style={{ ...baseStyle, color: '#34d399' }}>✅ Te avisaremos cuando esté listo</p>
  }
  if (permiso === 'denied') {
    return <p style={{ ...baseStyle, color: 'rgba(255,255,255,0.38)' }}>Esto puede tardar un momento. Quédate en la pantalla.</p>
  }
  // default: ofrecemos activar inline
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360, margin: '0 auto', padding: '8px 12px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
        🔔 ¿Activar notificaciones para avisarte cuando esté listo?
      </span>
      <button
        onClick={activar}
        disabled={cargando}
        style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 800, cursor: cargando ? 'wait' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
      >
        {cargando ? '…' : 'Activar'}
      </button>
    </div>
  )
}

export default function Quiz({ evaluacion, ramo, onBack }) {
  const [estado, setEstado] = useState('inicio') // inicio | cargando | quiz | resultado
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false)
  const [error, setError] = useState(null)
  const [quizzesUsados, setQuizzesUsados] = useState(null)
  const [limiteGlobal, setLimiteGlobal] = useState(100)
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
      const [meRes, limRes] = await Promise.all([
        fetch(API + '/auth/me', { headers: authHeaders() }),
        fetch(API + '/config/limite-global', { headers: authHeaders() })
      ])
      if (meRes.ok) { const d = await meRes.json(); setQuizzesUsados(d.quizzes_usados || 0) }
      if (limRes.ok) { const d = await limRes.json(); if (d.limite !== undefined) setLimiteGlobal(d.limite) }
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
        if (res.status === 403 && data.error === 'limite_alcanzado') {
          setQuizzesUsados(limiteGlobal); setEstado('inicio'); return
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
              setQuizzesUsados(prev => (prev || 0) + 1)
              setEstado('quiz')
            } else if (evento.tipo === 'error') {
              if (evento.error === 'limite_alcanzado') setQuizzesUsados(limiteGlobal)
              else setError(evento.mensaje || 'Error generando quiz')
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

        {quizzesUsados >= limiteGlobal ? (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: 10, padding: 12, color: '#f87171', fontSize: 13, marginBottom: 16 }}>
            🔒 Alcanzaste el límite de {limiteGlobal} quizzes.
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
                if (quizzesUsados >= limiteGlobal) return
                if (!window.confirm('¿Seguro que quieres generar un quiz nuevo? El quiz actual será reemplazado.')) return
                generarQuiz(true)
              }}
              disabled={quizzesUsados >= limiteGlobal}
              style={{
                ...s.btn,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: quizzesUsados >= limiteGlobal ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.72)',
                fontSize: 13,
                fontWeight: 600,
                cursor: quizzesUsados >= limiteGlobal ? 'not-allowed' : 'pointer'
              }}
            >
              {quizzesUsados >= limiteGlobal
                ? '🔒 Límite alcanzado'
                : `🔄 Generar nuevo quiz (${limiteGlobal - (quizzesUsados || 0)} restantes)`}
            </button>
          </>
        ) : (
          <button
            onClick={() => generarQuiz(false)}
            disabled={quizzesUsados >= limiteGlobal}
            style={{ ...s.btn, background: quizzesUsados >= limiteGlobal ? 'rgba(46,125,209,0.3)' : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', cursor: quizzesUsados >= limiteGlobal ? 'not-allowed' : 'pointer' }}
          >
            {quizzesUsados >= limiteGlobal
              ? '🔒 Límite alcanzado'
              : `🤖 Generar Quiz con IA (${limiteGlobal - (quizzesUsados || 0)} restantes)`}
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
            <button onClick={() => generarQuiz(true)} disabled={quizzesUsados >= limiteGlobal} style={{ ...s.btn, flex: 1, background: quizzesUsados >= limiteGlobal ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)', cursor: quizzesUsados >= limiteGlobal ? 'not-allowed' : 'pointer' }}>
              {quizzesUsados >= limiteGlobal ? '🔒 Límite' : '🔄 Nuevo quiz'}
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
      </div>
    )
  }
}
