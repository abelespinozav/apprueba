import { useState } from 'react'

export default function App() {
  const [notaMinima, setNotaMinima] = useState(4.0)
  const [evaluaciones, setEvaluaciones] = useState([])
  const [nombre, setNombre] = useState('')
  const [ponderacion, setPonderacion] = useState('')
  const [nota, setNota] = useState('')
  const [step, setStep] = useState('setup')

  const totalPonderacion = evaluaciones.reduce((acc, e) => acc + e.ponderacion, 0)

  const agregarEvaluacion = () => {
    const p = parseFloat(ponderacion)
    if (!nombre || isNaN(p) || p <= 0 || totalPonderacion + p > 100) return
    setEvaluaciones([...evaluaciones, { nombre, ponderacion: p, nota: null }])
    setNombre('')
    setPonderacion('')
  }

  const iniciarSemestre = () => {
    if (evaluaciones.length === 0 || Math.abs(totalPonderacion - 100) > 0.01) return
    setStep('notas')
  }

  const ingresarNota = (index) => {
    const n = parseFloat(nota)
    if (isNaN(n) || n < 1 || n > 7) return
    const nuevas = [...evaluaciones]
    nuevas[index].nota = n
    setEvaluaciones(nuevas)
    setNota('')
  }

  const calcularNotaMinima = () => {
    const rendidas = evaluaciones.filter(e => e.nota !== null)
    const pendientes = evaluaciones.filter(e => e.nota === null)
    if (pendientes.length === 0) return null

    const puntajeObtenido = rendidas.reduce((acc, e) => acc + (e.nota * e.ponderacion / 100), 0)
    const ponderacionPendiente = pendientes.reduce((acc, e) => acc + e.ponderacion, 0)
    const necesario = (notaMinima - puntajeObtenido) / (ponderacionPendiente / 100)

    return necesario
  }

  const notaNecesaria = calcularNotaMinima()
  const rendidas = evaluaciones.filter(e => e.nota !== null)
  const pendientes = evaluaciones.filter(e => e.nota === null)
  const promedioActual = rendidas.length > 0
    ? rendidas.reduce((acc, e) => acc + (e.nota * e.ponderacion / 100), 0) /
      (rendidas.reduce((acc, e) => acc + e.ponderacion, 0) / 100)
    : null

  const notaFinal = pendientes.length === 0
    ? evaluaciones.reduce((acc, e) => acc + (e.nota * e.ponderacion / 100), 0)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8 pt-6">
          <h1 className="text-4xl font-bold text-indigo-700">APPrueba</h1>
          <p className="text-gray-500 mt-1">Calcula cuánto necesitas para aprobar 🎓</p>
        </div>

        {step === 'setup' && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Configura tu ramo</h2>

            <div className="mb-4">
              <label className="text-sm text-gray-500">Nota mínima de aprobación</label>
              <input
                type="number" step="0.1" min="1" max="7"
                value={notaMinima}
                onChange={e => setNotaMinima(parseFloat(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="mb-2">
              <label className="text-sm text-gray-500">Nombre de la evaluación</label>
              <input
                type="text" placeholder="Ej: Certamen 1"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-500">Ponderación (%)</label>
              <input
                type="number" placeholder="Ej: 30"
                value={ponderacion}
                onChange={e => setPonderacion(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <button
              onClick={agregarEvaluacion}
              disabled={totalPonderacion >= 100}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg mb-4 disabled:opacity-40"
            >
              + Agregar evaluación
            </button>

            {evaluaciones.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Evaluaciones agregadas:</p>
                {evaluaciones.map((e, i) => (
                  <div key={i} className="flex justify-between items-center bg-indigo-50 rounded-lg px-3 py-2 mb-1">
                    <span className="text-gray-700">{e.nombre}</span>
                    <span className="text-indigo-600 font-semibold">{e.ponderacion}%</span>
                  </div>
                ))}
                <p className="text-right text-sm mt-1 font-semibold text-gray-600">
                  Total: <span className={totalPonderacion === 100 ? 'text-green-500' : 'text-orange-400'}>{totalPonderacion}%</span>
                </p>
              </div>
            )}

            <button
              onClick={iniciarSemestre}
              disabled={Math.abs(totalPonderacion - 100) > 0.01}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg disabled:opacity-40"
            >
              ¡Comenzar semestre! 🚀
            </button>
            {evaluaciones.length > 0 && Math.abs(totalPonderacion - 100) > 0.01 && (
              <p className="text-center text-xs text-orange-400 mt-2">La ponderación total debe ser exactamente 100%</p>
            )}
          </div>
        )}

        {step === 'notas' && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Ingresa tus notas</h2>

            {evaluaciones.map((e, i) => (
              <div key={i} className="mb-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-700">{e.nombre}</p>
                    <p className="text-xs text-gray-400">{e.ponderacion}%</p>
                  </div>
                  {e.nota !== null ? (
                    <span className={`text-lg font-bold ${e.nota >= notaMinima ? 'text-green-500' : 'text-red-400'}`}>
                      {e.nota.toFixed(1)}
                    </span>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number" step="0.1" min="1" max="7"
                        placeholder="1.0-7.0"
                        value={nota}
                        onChange={e => setNota(e.target.value)}
                        className="w-24 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        onClick={() => ingresarNota(i)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded-lg"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {notaFinal !== null ? (
              <div className={`mt-4 p-4 rounded-xl text-center ${notaFinal >= notaMinima ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="text-sm text-gray-500">Nota final</p>
                <p className={`text-4xl font-bold ${notaFinal >= notaMinima ? 'text-green-600' : 'text-red-500'}`}>
                  {notaFinal.toFixed(1)}
                </p>
                <p className={`text-sm font-semibold mt-1 ${notaFinal >= notaMinima ? 'text-green-600' : 'text-red-500'}`}>
                  {notaFinal >= notaMinima ? '¡Aprobaste el ramo! 🎉' : 'Reprobaste el ramo 😔'}
                </p>
              </div>
            ) : (
              <>
                {rendidas.length > 0 && notaNecesaria !== null && (
                  <div className={`mt-4 p-4 rounded-xl text-center ${notaNecesaria > 7 ? 'bg-red-100' : notaNecesaria <= 1 ? 'bg-green-100' : 'bg-indigo-50'}`}>
                    <p className="text-sm text-gray-500">Necesitas sacar en promedio</p>
                    <p className={`text-4xl font-bold ${notaNecesaria > 7 ? 'text-red-500' : notaNecesaria <= 1 ? 'text-green-500' : 'text-indigo-600'}`}>
                      {notaNecesaria > 7 ? '+7.0' : notaNecesaria < 1 ? '1.0' : notaNecesaria.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">en las {pendientes.length} evaluación(es) restante(s)</p>
                    {notaNecesaria > 7 && <p className="text-red-500 text-sm font-semibold mt-1">Ya no es posible aprobar 😔</p>}
                    {notaNecesaria <= 1 && <p className="text-green-500 text-sm font-semibold mt-1">¡Ya tienes el ramo aprobado! 🎉</p>}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => { setEvaluaciones([]); setStep('setup') }}
              className="w-full mt-4 border border-gray-300 text-gray-500 hover:bg-gray-50 py-2 rounded-lg text-sm"
            >
              Empezar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
