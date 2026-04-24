import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const PLANES = [
  {
    id: 'aprobado',
    nombre: 'Aprobado',
    precio: 'Gratis',
    creditos: '150 al registrarse',
    creditos_mes: null,
    descripcion: 'Para comenzar a estudiar con IA',
    features: [
      'Acceso a todas las herramientas IA',
      '150 créditos de bienvenida',
      'Créditos de gamificación mensuales',
      'Quizzes, planes de estudio y más'
    ],
    color: '#475569',
    badge: null
  },
  {
    id: 'con_distincion',
    nombre: 'Con Distinción',
    precio: '$2.990',
    periodo: '/mes',
    creditos_mes: 400,
    descripcion: 'Para estudiantes comprometidos',
    features: [
      'Todo lo del plan Aprobado',
      '400 créditos de suscripción/mes',
      'Los créditos comprados no vencen',
      'Soporte prioritario'
    ],
    color: '#6366f1',
    badge: 'Popular'
  },
  {
    id: 'con_distincion_maxima',
    nombre: 'Con Distinción Máxima',
    precio: '$4.990',
    periodo: '/mes',
    creditos_mes: 1200,
    descripcion: 'Para quienes van por todo',
    features: [
      'Todo lo del plan Con Distinción',
      '1200 créditos de suscripción/mes',
      'Modo Intensivo (próximamente)',
      'Acceso anticipado a nuevas features'
    ],
    color: '#7c3aed',
    badge: 'Máximo'
  }
]

export default function Planes() {
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pagando, setPagando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const navigate = useNavigate()

  const urlParams = new URLSearchParams(window.location.search)
  const pagoResultado = urlParams.get('pago')

  useEffect(() => {
    fetch(`${API}/suscripcion/estado`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(d => { setEstado(d); setCargando(false) })
      .catch(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (pagoResultado === 'exitoso') {
      setMensaje({ tipo: 'ok', texto: '¡Pago recibido! Tu suscripción se activará en segundos. Si no ves el cambio, recarga la página.' })
    } else if (pagoResultado === 'cancelado') {
      setMensaje({ tipo: 'error', texto: 'Pago cancelado. Puedes intentarlo cuando quieras.' })
    }
  }, [pagoResultado])

  async function suscribirse(planId) {
    if (planId === 'aprobado') return
    setPagando(planId)
    try {
      const r = await fetch(`${API}/suscripcion/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan: planId })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detalle || data.error || 'Error al crear el pago')
      window.location.href = data.payment_url
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
      setPagando(null)
    }
  }

  async function cancelar() {
    if (!confirm('¿Confirmas que quieres cancelar tu suscripción? Los créditos que ya tienes no se eliminarán.')) return
    const r = await fetch(`${API}/suscripcion/cancelar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await r.json()
    if (data.ok) {
      setMensaje({ tipo: 'ok', texto: 'Suscripción cancelada. Tus créditos actuales se mantienen.' })
      setEstado(prev => ({ ...prev, plan: 'aprobado', suscripcion_activa: false }))
    }
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: '#08080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#94a3b8', fontSize: 16 }}>Cargando planes...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#08080f', color: '#f1f5f9', padding: '48px 16px 64px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Botón volver */}
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: '#94a3b8', fontSize: 14,
          cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6
        }}>
          ← Volver
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
            Elige tu plan 🎓
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
            Todos los planes incluyen acceso completo a las herramientas IA. Los créditos determinan cuánto puedes usar.
          </p>
          {estado && (
            <div style={{
              marginTop: 16, display: 'inline-block', background: '#1e293b',
              borderRadius: 99, padding: '6px 16px', fontSize: 13, color: '#94a3b8'
            }}>
              Plan actual: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{estado.plan || 'Aprobado'}</span>
              {' · '}Créditos: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{estado.creditos_total}</span>
            </div>
          )}
        </div>

        {/* Mensaje resultado de pago */}
        {mensaje && (
          <div style={{
            marginBottom: 32, padding: '14px 20px', borderRadius: 12, textAlign: 'center', fontSize: 14,
            background: mensaje.tipo === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${mensaje.tipo === 'ok' ? '#16a34a' : '#dc2626'}`,
            color: mensaje.tipo === 'ok' ? '#4ade80' : '#f87171'
          }}>
            {mensaje.texto}
          </div>
        )}

        {/* Cards de planes */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
          {PLANES.map(plan => {
            const esActual = estado?.plan === plan.id || (!estado?.plan && plan.id === 'aprobado')
            const esDestacado = plan.id === 'con_distincion'
            return (
              <div key={plan.id} style={{
                position: 'relative', borderRadius: 20, padding: '28px 24px',
                minWidth: 240, maxWidth: 280, flex: '1 1 240px',
                background: esActual ? '#1e293b' : '#0f172a',
                border: `2px solid ${esActual ? '#fbbf24' : esDestacado ? plan.color : '#1e293b'}`,
                boxShadow: esDestacado ? `0 8px 32px ${plan.color}33` : '0 2px 8px rgba(0,0,0,0.3)',
                transform: esDestacado ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.2s'
              }}>

                {/* Badge Popular/Máximo */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '3px 12px', borderRadius: 99, whiteSpace: 'nowrap'
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Badge plan actual */}
                {esActual && (
                  <div style={{
                    position: 'absolute', top: -12, right: 16,
                    background: '#fbbf24', color: '#1e293b', fontSize: 11, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 99
                  }}>
                    Tu plan actual
                  </div>
                )}

                {/* Ícono */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: plan.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 16
                }}>
                  {plan.id === 'aprobado' ? '📚' : plan.id === 'con_distincion' ? '🎯' : '🏆'}
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#f1f5f9' }}>
                  {plan.nombre}
                </h2>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                  {plan.descripcion}
                </p>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: '#f1f5f9' }}>{plan.precio}</span>
                  {plan.periodo && <span style={{ color: '#64748b', fontSize: 13 }}>{plan.periodo}</span>}
                </div>

                {plan.creditos_mes && (
                  <div style={{
                    marginBottom: 16, padding: '8px 12px', background: '#1e293b',
                    borderRadius: 10, textAlign: 'center'
                  }}>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 18 }}>{plan.creditos_mes}</span>
                    <span style={{ color: '#64748b', fontSize: 12 }}> créditos/mes</span>
                  </div>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      fontSize: 13, color: '#94a3b8', marginBottom: 8
                    }}>
                      <span style={{ color: '#4ade80', marginTop: 1 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'aprobado' ? (
                  <button disabled style={{
                    width: '100%', padding: '12px 0', borderRadius: 12,
                    background: '#1e293b', color: '#475569', fontSize: 13,
                    border: 'none', cursor: 'default'
                  }}>
                    {esActual ? 'Plan actual' : 'Plan gratuito'}
                  </button>
                ) : esActual ? (
                  <button onClick={cancelar} style={{
                    width: '100%', padding: '12px 0', borderRadius: 12,
                    background: 'transparent', color: '#f87171', fontSize: 13,
                    border: '1px solid #dc2626', cursor: 'pointer'
                  }}>
                    Cancelar suscripción
                  </button>
                ) : (
                  <button
                    onClick={() => suscribirse(plan.id)}
                    disabled={!!pagando}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 12,
                      background: pagando ? '#334155' : plan.color,
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      border: 'none', cursor: pagando ? 'default' : 'pointer',
                      opacity: pagando === plan.id ? 0.7 : 1
                    }}>
                    {pagando === plan.id ? 'Redirigiendo...' : `Suscribirse por ${plan.precio}/mes`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Tabla créditos por función */}
        <div style={{
          background: '#0f172a', borderRadius: 20, padding: '24px',
          border: '1px solid #1e293b', marginBottom: 24
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
            ¿Cuántos créditos usa cada función? 💡
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {[
              { nombre: 'Quiz', costo: 10, icono: '🧠' },
              { nombre: 'Plan de estudio', costo: 15, icono: '📅' },
              { nombre: 'Guía de tarea', costo: 8, icono: '📖' },
              { nombre: 'Ejercicios PDF', costo: 12, icono: '✏️' },
              { nombre: 'Podcast IA', costo: 30, icono: '🎙️' },
              { nombre: 'Subir material', costo: '¡Gratis!', icono: '📎', gratis: true },
            ].map(fn => (
              <div key={fn.nombre} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: '#1e293b', borderRadius: 12
              }}>
                <span style={{ fontSize: 20 }}>{fn.icono}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{fn.nombre}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: fn.gratis ? '#4ade80' : '#fbbf24' }}>
                    {fn.gratis ? fn.costo : `${fn.costo} cr`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer legal */}
        <p style={{ textAlign: 'center', color: '#334155', fontSize: 11, marginTop: 16 }}>
          Pagos procesados por Khipu. Los créditos de suscripción se renuevan mensualmente.
          Los créditos ganados por gamificación y comprados no vencen.
        </p>

      </div>
    </div>
  )
}
