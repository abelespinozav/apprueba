import { useState } from 'react'

const STEPS = ['ramo', 'evaluaciones', 'notas', 'resultado']

export default function App() {
  const [step, setStep] = useState(0)
  const [ramo, setRamo] = useState({ nombre: '', notaMinima: 4.0 })
  const [evaluaciones, setEvaluaciones] = useState([])
  const [newEval, setNewEval] = useState({ nombre: '', ponderacion: '' })

  const totalPonderacion = evaluaciones.reduce((s, e) => s + Number(e.ponderacion), 0)
  const restante = 100 - totalPonderacion

  const agregarEval = () => {
    if (!newEval.nombre || !newEval.ponderacion) return
    if (totalPonderacion + Number(newEval.ponderacion) > 100) return
    setEvaluaciones([...evaluaciones, { ...newEval, nota: '' }])
    setNewEval({ nombre: '', ponderacion: '' })
  }

  const updateNota = (i, val) => {
    const updated = [...evaluaciones]
    updated[i].nota = val
    setEvaluaciones(updated)
  }

  const calcular = () => {
    const conNota = evaluaciones.filter(e => e.nota !== '')
    const sinNota = evaluaciones.filter(e => e.nota === '')
    const pesoConNota = conNota.reduce((s, e) => s + Number(e.ponderacion), 0)
    const pesoSinNota = sinNota.reduce((s, e) => s + Number(e.ponderacion), 0)
    const promedioActual = conNota.reduce((s, e) => s + (Number(e.nota) * Number(e.ponderacion) / 100), 0)
    const notaMin = Number(ramo.notaMinima)

    if (pesoSinNota === 0) {
      const promFinal = promedioActual
      return promFinal >= notaMin
        ? { tipo: 'aprobado', promedio: promFinal.toFixed(1) }
        : { tipo: 'reprobado', promedio: promFinal.toFixed(1) }
    }

    const necesaria = (notaMin - promedioActual) / (pesoSinNota / 100)
    if (necesaria > 7) return { tipo: 'imposible', necesaria: necesaria.toFixed(1) }
    if (necesaria <= 1) return { tipo: 'aprobado_seguro', promedio: promedioActual.toFixed(1) }
    return { tipo: 'posible', necesaria: necesaria.toFixed(1), pendientes: sinNota.length }
  }

  const resultado = step === 3 ? calcular() : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">APPrueba</h1>
          <p className="text-gray-500 mt-1">Calcula cuánto necesitas para aprobar 🎓</p>
        </div>

        {/* Stepper */}
        {step < 3 && (
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
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">

          {/* PASO 1: Ramo */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">📚 Tu ramo</h2>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del ramo</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                  placeholder="Ej: Cálculo II"
                  value={ramo.nombre}
                  onChange={e => setRamo({ ...ramo, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nota mínima para aprobar</label>
                <input
                  type="number" min="1" max="7" step="0.1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                  value={ramo.notaMinima}
                  onChange={e => setRamo({ ...ramo, notaMinima: e.target.value })}
                />
              </div>
              <button
                disabled={!ramo.nombre}
                onClick={() => setStep(1)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all">
                Siguiente →
              </button>
            </div>
          )}

          {/* PASO 2: Evaluaciones */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">📝 Evaluaciones de <span className="text-indigo-600">{ramo.nombre}</span></h2>

              {/* Barra de progreso */}
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

              {/* Lista de evaluaciones */}
              {evaluaciones.length > 0 && (
                <div className="space-y-2">
                  {evaluaciones.map((e, i) => (
                    <div key={i} className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-2">
                      <span className="text-sm font-medium text-gray-700">{e.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-indigo-600 font-bold">{e.ponderacion}%</span>
                        <button onClick={() => setEvaluaciones(evaluaciones.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar evaluación */}
              {restante > 0 && (
                <div className="space-y-2">
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                    placeholder="Nombre (Ej: Certamen 1)"
                    value={newEval.nombre}
                    onChange={e => setNewEval({ ...newEval, nombre: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number" min="1" max={restante}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                      placeholder={`Ponderación (máx ${restante}%)`}
                      value={newEval.ponderacion}
                      onChange={e => setNewEval({ ...newEval, ponderacion: e.target.value })}
                    />
                    <button onClick={agregarEval}
                      disabled={!newEval.nombre || !newEval.ponderacion}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white px-4 rounded-xl font-bold transition-all">
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all">← Volver</button>
                <button
                  disabled={totalPonderacion !== 100 || evaluaciones.length === 0}
                  onClick={() => setStep(2)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all">
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Notas */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">🎯 Ingresa tus notas</h2>
              <p className="text-sm text-gray-500">Deja en blanco las evaluaciones pendientes</p>
              <div className="space-y-3">
                {evaluaciones.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{e.nombre}</p>
                      <p className="text-xs text-gray-400">{e.ponderacion}%</p>
                    </div>
                    <input
                      type="number" min="1" max="7" step="0.1"
                      className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                      placeholder="—"
                      value={e.nota}
                      onChange={ev => updateNota(i, ev.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all">← Volver</button>
                <button onClick={() => setStep(3)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all">
                  Calcular 🚀
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Resultado */}
          {step === 3 && resultado && (
            <div className="text-center space-y-4">
              {resultado.tipo === 'aprobado' && (
                <>
                  <div className="text-6xl">🎉</div>
                  <h2 className="text-2xl font-extrabold text-green-600">¡Aprobaste!</h2>
                  <p className="text-gray-600">Tu promedio final es <span className="font-bold text-green-600">{resultado.promedio}</span></p>
                </>
              )}
              {resultado.tipo === 'aprobado_seguro' && (
                <>
                  <div className="text-6xl">😎</div>
                  <h2 className="text-2xl font-extrabold text-green-600">¡Ya tienes el ramo!</h2>
                  <p className="text-gray-600">Con lo que llevas ({resultado.promedio}) ya aprobas aunque saques un 1.0</p>
                </>
              )}
              {resultado.tipo === 'posible' && (
                <>
                  <div className="text-6xl">💪</div>
                  <h2 className="text-2xl font-extrabold text-indigo-600">¡Puedes lograrlo!</h2>
                  <p className="text-gray-600">Necesitas sacar un promedio de</p>
                  <div className="text-5xl font-extrabold text-indigo-700">{resultado.necesaria}</div>
                  <p className="text-gray-500 text-sm">en {resultado.pendientes} evaluación{resultado.pendientes > 1 ? 'es' : ''} pendiente{resultado.pendientes > 1 ? 's' : ''}</p>
                </>
              )}
              {resultado.tipo === 'reprobado' && (
                <>
                  <div className="text-6xl">😔</div>
                  <h2 className="text-2xl font-extrabold text-red-500">Ramo reprobado</h2>
                  <p className="text-gray-600">Tu promedio final fue <span className="font-bold text-red-500">{resultado.promedio}</span></p>
                </>
              )}
              {resultado.tipo === 'imposible' && (
                <>
                  <div className="text-6xl">😬</div>
                  <h2 className="text-2xl font-extrabold text-red-500">Muy difícil...</h2>
                  <p className="text-gray-600">Necesitarías un <span className="font-bold text-red-500">{resultado.necesaria}</span>, lo cual está fuera de la escala</p>
                </>
              )}
              <button onClick={() => { setStep(0); setRamo({ nombre: '', notaMinima: 4.0 }); setEvaluaciones([]); setNewEval({ nombre: '', ponderacion: '' }) }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all mt-4">
                Calcular otro ramo 🔄
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
