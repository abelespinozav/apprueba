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
    color: 'from-slate-600 to-slate-700',
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
    color: 'from-blue-600 to-blue-700',
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
    color: 'from-purple-600 to-purple-700',
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-lg">Cargando planes...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Elige tu plan 🎓</h1>
          <p className="text-gray-400 text-lg">
            Todos los planes incluyen acceso completo a las herramientas IA. Los créditos determinan cuánto puedes usar.
          </p>
          {estado && (
            <div className="mt-4 inline-block bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
              Plan actual: <span className="text-white font-semibold">{estado.plan || 'Aprobado'}</span>
              {' · '}Créditos: <span className="text-yellow-400 font-semibold">{estado.creditos_total}</span>
            </div>
          )}
        </div>

        {/* Mensaje de resultado de pago */}
        {mensaje && (
          <div className={`mb-8 p-4 rounded-xl text-center ${mensaje.tipo === 'ok' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Cards de planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANES.map(plan => {
            const esActual = estado?.plan === plan.id || (!estado?.plan && plan.id === 'aprobado')
            return (
              <div key={plan.id}
                className={`relative rounded-2xl p-6 border ${esActual ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-900'} transition-all`}>

                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {plan.badge}
                  </div>
                )}

                {esActual && (
                  <div className="absolute -top-3 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    Tu plan actual
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} mb-4 flex items-center justify-center text-2xl`}>
                  {plan.id === 'aprobado' ? '📚' : plan.id === 'con_distincion' ? '🎯' : '🏆'}
                </div>

                <h2 className="text-xl font-bold mb-1">{plan.nombre}</h2>
                <p className="text-gray-400 text-sm mb-4">{plan.descripcion}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.precio}</span>
                  {plan.periodo && <span className="text-gray-400 text-sm">{plan.periodo}</span>}
                </div>

                {plan.creditos_mes && (
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg text-center">
                    <span className="text-yellow-400 font-bold text-lg">{plan.creditos_mes}</span>
                    <span className="text-gray-400 text-sm"> créditos/mes</span>
                  </div>
                )}

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'aprobado' ? (
                  <button disabled className="w-full py-3 rounded-xl bg-gray-700 text-gray-400 text-sm cursor-default">
                    {esActual ? 'Plan actual' : 'Plan gratuito'}
                  </button>
                ) : esActual ? (
                  <button onClick={cancelar}
                    className="w-full py-3 rounded-xl border border-red-700 text-red-400 text-sm hover:bg-red-900/30 transition-colors">
                    Cancelar suscripción
                  </button>
                ) : (
                  <button
                    onClick={() => suscribirse(plan.id)}
                    disabled={!!pagando}
                    className={`w-full py-3 rounded-xl bg-gradient-to-r ${plan.color} text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50`}>
                    {pagando === plan.id ? 'Redirigiendo...' : `Suscribirse por ${plan.precio}/mes`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Tabla de créditos por función */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">¿Cuántos créditos usa cada función? 💡</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { nombre: 'Quiz', costo: 10, icono: '📝' },
              { nombre: 'Plan de estudio', costo: 15, icono: '📅' },
              { nombre: 'Guía de tarea', costo: 8, icono: '📖' },
              { nombre: 'Ejercicios PDF', costo: 12, icono: '✏️' },
              { nombre: 'Podcast IA', costo: 30, icono: '🎙️' },
              { nombre: 'Subir material', costo: '¡Gratis!', icono: '📎', gratis: true },
            ].map(fn => (
              <div key={fn.nombre} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                <span className="text-2xl">{fn.icono}</span>
                <div>
                  <div className="text-sm font-medium">{fn.nombre}</div>
                  <div className={`text-xs font-bold ${fn.gratis ? 'text-green-400' : 'text-yellow-400'}`}>
                    {fn.gratis ? fn.costo : `${fn.costo} créditos`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer legal */}
        <p className="text-center text-gray-600 text-xs mt-8">
          Pagos procesados por Khipu. Los créditos de suscripción se renuevan mensualmente.
          Los créditos ganados por gamificación y comprados no vencen.
        </p>
      </div>
    </div>
  )
}
