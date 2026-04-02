import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

function calcular(evaluaciones, notaMinima) {
  const conNota = evaluaciones.filter(e => e.nota !== null && e.nota !== '')
  const sinNota = evaluaciones.filter(e => e.nota === null || e.nota === '')
  const pesoSinNota = sinNota.reduce((s, e) => s + Number(e.ponderacion), 0)
  const sumaActual = conNota.reduce((s, e) => s + (Number(e.nota) * Number(e.ponderacion) / 100), 0)
  const notaMin = Number(notaMinima)
  if (pesoSinNota === 0) {
    return sumaActual >= notaMin
      ? { tipo: 'aprobado', promedio: sumaActual.toFixed(1) }
      : { tipo: 'reprobado', promedio: sumaActual.toFixed(1) }
  }
  const necesaria = (notaMin - sumaActual) / (pesoSinNota / 100)
  if (necesaria > 7) return { tipo: 'imposible', necesaria: necesaria.toFixed(1) }
  if (necesaria <= 1) return { tipo: 'aprobado_seguro', pendientes: sinNota.length }
  return { tipo: 'posible', necesaria: necesaria.toFixed(1), pendientes: sinNota.length }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ramos, setRamos] = useState([])
  const [view, setView] = useState('dashboard')
  const [ramoActivo, setRamoActivo] = useState(null)
  const [step, setStep] = useState(0)
  const [nuevoRamo, setNuevoRamo] = useState({ nombre: '', notaMinima: 4.0 })
  const [evaluaciones, setEvaluaciones] = useState([])
  const [newEval, setNewEval] = useState({ nombre: '', ponderacion: '' })

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(u => { setUser(u); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user) {
      fetch(`${API}/ramos`, { credentials: 'include' })
        .then(r => r.json())
        .then(setRamos)
    }
  }, [user])

  const login = () => { window.location.href = `${API}/auth/google` }
  const logout = () => {
    fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
      .then(() => { setUser(null); setRamos([]) })
  }

  const totalPonderacion = evaluaciones.reduce((s, e) => s + Number(e.ponderacion), 0)
  const restante = 100 - totalPonderacion

  const agregarEval = () => {
    if (!newEval.nombre || !newEval.ponderacion) return
    if (totalPonderacion + Number(newEval.ponderacion) > 100) return
    setEvaluaciones([...evaluaciones, { ...newEval, nota: '' }])
    setNewEval({ nombre: '', ponderacion: '' })
  }

  const guardarRamo = async () => {
    await fetch(`${API}/ramos`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoRamo.nombre, nota_minima: nuevoRamo.notaMinima, evaluaciones })
    })
    await fetch(`${API}/ramos`, { credentials: 'include' })
      .then(r => r.json()).then(setRamos)
    setView('dashboard'); setStep(0)
    setNuevoRamo({ nombre: '', notaMinima: 4.0 }); setEvaluaciones([])
  }

  const actualizarNota = async (ramoId, evalId, nota) => {
    const updatedRamos = ramos.map(r => {
      if (r.id !== ramoId) return r
      return { ...r, evaluaciones: r.evaluaciones.map(e => e.id === evalId ? { ...e, nota } : e) }
    })
    setRamos(updatedRamos)
    const ramo = updatedRamos.find(r => r.id === ramoId)
    await fetch(`${API}/ramos/${ramoId}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluaciones: ramo.evaluaciones })
    })
  }

  const eliminarRamo = async (id) => {
    await fetch(`${API}/ramos/${id}`, { method: 'DELETE', credentials: 'include' })
    setRamos(ramos.filter(r => r.id !== id)); setView('dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
      <div className="text-indigo-600 text-xl font-bold animate-pulse">Cargando...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold text-indigo-700">APPrueba</h1>
          <p className="text-gray-500 mt-2">Calcula cuánto necesitas para aprobar 🎓</p>
        </div>
        <div className="space-y-2 text-sm text-gray-500">
          <p>✅ Guarda tus ramos y notas</p>
          <p>📊 Calcula lo que necesitas</p>
          <p>🔄 Accede desde cualquier dispositivo</p>
        </div>
        <button onClick={login}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-all font-medium text-gray-700">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Continuar con Google
        </button>
      </div>
    </div>
  )

  if (view === 'nuevo') return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700">APPrueba</h1>
          <p className="text-gray-500 mt-1">Calcula cuánto necesitas para aprobar 🎓</p>
        </div>
        <div className="flex items-center justify-center mb-6 gap-2">
          {['Ramo', 'Evaluaciones', 'Notas'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step === i ? 'bg-indigo-600 text-white scale-110' : step > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === i ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <div className={`w-8 h-0.5 ${step > i ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">📚 Tu ramo</h2>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del ramo</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                  placeholder="Ej: Cálculo II" value={nuevoRamo.nombre}
                  onChange={e => setNuevoRamo({ ...nuevoRamo, nombre: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nota mínima para aprobar</label>
                <input type="number" min="1" max="7" step="0.1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                  value={nuevoRamo.notaMinima} onChange={e => setNuevoRamo({ ...nuevoRamo, notaMinima: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setView('dashboard')} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50">← Volver</button>
                <button disabled={!nuevoRamo.nombre} onClick={() => setStep(1)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all">
                  Siguiente →
                </button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">📝 Evaluaciones de <span className="text-indigo-600">{nuevoRamo.nombre}</span></h2>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Ponderación asignada</span>
                  <span className={totalPonderacion === 100 ? 'text-green-600 font-bold' : 'text-indigo-600 font-bold'}>{totalPonderacion}% / 100%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${totalPonderacion === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(totalPonderacion, 100)}%` }} />
                </div>
              </div>
              {evaluaciones.length > 0 && (
                <div className="space-y-2">
                  {evaluaciones.map((e, i) => (
                    <div key={i} className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-2">
                      <span className="text-sm font-medium text-gray-700">{e.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-indigo-600 font-bold">{e.ponderacion}%</span>
                        <button onClick={() => setEvaluaciones(evaluaciones.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {restante > 0 && (
                <div className="space-y-2">
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                    placeholder="Nombre (Ej: Certamen 1)" value={newEval.nombre}
                    onChange={e => setNewEval({ ...newEval, nombre: e.target.value })} />
                  <div className="flex gap-2">
                    <input type="number" min="1" max={restante}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                      placeholder={`Ponderación (máx ${restante}%)`} value={newEval.ponderacion}
                      onChange={e => setNewEval({ ...newEval, ponderacion: e.target.value })} />
                    <button onClick={agregarEval} disabled={!newEval.nombre || !newEval.ponderacion}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white px-4 rounded-xl font-bold">+</button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50">← Volver</button>
                <button disabled={totalPonderacion !== 100 || evaluaciones.length === 0} onClick={() => setStep(2)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all">
                  Siguiente →
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">🎯 Notas actuales</h2>
              <p className="text-sm text-gray-500">Deja en blanco las evaluaciones pendientes</p>
              <div className="space-y-3">
                {evaluaciones.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{e.nombre}</p>
                      <p className="text-xs text-gray-400">{e.ponderacion}%</p>
                    </div>
                    <input type="number" min="1" max="7" step="0.1"
                      className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                      placeholder="—" value={e.nota}
                      onChange={ev => { const updated = [...evaluaciones]; updated[i].nota = ev.target.value; setEvaluaciones(updated) }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50">← Volver</button>
                <button onClick={guardarRamo} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all">
                  Guardar ramo 💾
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (view === 'ramo' && ramoActivo) {
    const r = ramos.find(r => r.id === ramoActivo)
    const evals = r.evaluaciones?.filter(Boolean) || []
    const resultado = calcular(evals, r.nota_minima)

    const notaPorEval = (e) => {
      if (e.nota !== null && e.nota !== '') return null
      if (resultado.tipo === 'aprobado_seguro') return { valor: 1.0, color: 'text-green-500' }
      if (resultado.tipo === 'imposible') {
        // Calcular cuánto necesita solo en esta eval ignorando las demás pendientes
        const conNota = evals.filter(ev => ev.nota !== null && ev.nota !== '' && ev.id !== e.id)
        const sumaActual = conNota.reduce((s, ev) => s + (Number(ev.nota) * Number(ev.ponderacion) / 100), 0)
        const necesaria = (Number(r.nota_minima) - sumaActual) / (Number(e.ponderacion) / 100)
        return { valor: necesaria.toFixed(1), color: 'text-red-500', imposible: necesaria > 7 }
      }
      if (resultado.tipo === 'posible') {
        const necesaria = Number(resultado.necesaria)
        const color = necesaria >= 6 ? 'text-red-500' : necesaria >= 5 ? 'text-yellow-500' : 'text-green-500'
        return { valor: necesaria.toFixed(1), color }
      }
      return null
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setView('dashboard')} className="text-indigo-600 font-medium">← Volver</button>
            <button onClick={() => eliminarRamo(r.id)} className="text-red-400 text-sm hover:text-red-600">Eliminar ramo</button>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-800">{r.nombre}</h2>
              <p className="text-sm text-gray-400">Nota mínima: {r.nota_minima}</p>
            </div>
            <div className="space-y-3">
              {evals.map(e => {
                const info = notaPorEval(e)
                const esPendiente = e.nota === null || e.nota === ''
                return (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{e.nombre}</p>
                      <p className="text-xs text-gray-400">{e.ponderacion}%</p>
                    </div>
                    <input type="number" min="1" max="7" step="0.1"
                      className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                      placeholder="—" value={e.nota || ''}
                      onChange={ev => actualizarNota(r.id, e.id, ev.target.value)} />
                    {esPendiente && info && (
                      <div className="text-right min-w-[64px]">
                        <p className="text-xs text-gray-400">necesitas</p>
                        <p className={`text-sm font-bold ${info.imposible ? 'text-red-500' : info.color}`}>
                          {info.imposible ? '> 7.0' : info.valor}
                        </p>
                      </div>
                    )}
                    {!esPendiente && <div className="min-w-[64px]" />}
                  </div>
                )
              })}
            </div>
            <div className={`rounded-xl p-4 text-center ${resultado.tipo === 'aprobado' || resultado.tipo === 'aprobado_seguro' ? 'bg-green-50' : resultado.tipo === 'posible' ? 'bg-indigo-50' : 'bg-red-50'}`}>
              {resultado.tipo === 'aprobado' && <><p className="text-2xl">🎉</p><p className="font-bold text-green-600">¡Aprobaste! Promedio: {resultado.promedio}</p></>}
              {resultado.tipo === 'aprobado_seguro' && <><p className="text-2xl">😎</p><p className="font-bold text-green-600">¡Ya tienes el ramo aunque saques 1.0!</p></>}
              {resultado.tipo === 'posible' && <><p className="text-2xl">💪</p><p className="font-bold text-indigo-600">Necesitas un <span className="text-3xl">{resultado.necesaria}</span> en {resultado.pendientes} evaluación{resultado.pendientes > 1 ? 'es' : ''} pendiente{resultado.pendientes > 1 ? 's' : ''}</p></>}
              {resultado.tipo === 'reprobado' && <><p className="text-2xl">😔</p><p className="font-bold text-red-500">Ramo reprobado. Promedio: {resultado.promedio}</p></>}
              {resultado.tipo === 'imposible' && <><p className="text-2xl">😬</p><p className="font-bold text-red-500">Necesitarías un {resultado.necesaria} en promedio, fuera de escala</p></>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-indigo-700">APPrueba</h1>
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-8 h-8 rounded-full" />
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">Salir</button>
          </div>
        </div>
        <p className="text-gray-500 text-sm">Hola, {user.nombre.split(' ')[0]} 👋</p>
        {ramos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
            <p className="text-4xl">📚</p>
            <p className="text-gray-500">Aún no tienes ramos agregados</p>
            <button onClick={() => { setView('nuevo'); setStep(0) }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">
              + Agregar primer ramo
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {ramos.map(r => {
                const evals = r.evaluaciones?.filter(Boolean) || []
                const resultado = calcular(evals, r.nota_minima)
                const colorMap = { aprobado: 'text-green-600', aprobado_seguro: 'text-green-600', posible: 'text-indigo-600', reprobado: 'text-red-500', imposible: 'text-red-500' }
                const labelMap = { aprobado: `✅ Aprobado (${resultado.promedio})`, aprobado_seguro: '😎 ¡Ya lo tienes!', posible: `💪 Necesitas ${resultado.necesaria}`, reprobado: `😔 Reprobado (${resultado.promedio})`, imposible: '😬 Muy difícil' }
                return (
                  <button key={r.id} onClick={() => { setRamoActivo(r.id); setView('ramo') }}
                    className="w-full bg-white rounded-2xl shadow p-4 text-left hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800">{r.nombre}</p>
                      <span className={`text-sm font-semibold ${colorMap[resultado.tipo]}`}>{labelMap[resultado.tipo]}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{evals.length} evaluaciones · mín {r.nota_minima}</p>
                  </button>
                )
              })}
            </div>
            <button onClick={() => { setView('nuevo'); setStep(0) }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all">
              + Agregar ramo
            </button>
          </>
        )}
      </div>
    </div>
  )
}
