import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

const GlobalStyles = () => (
  <style>{`
    @keyframes fall {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(110vh) rotate(900deg) translateX(var(--drift)); opacity: 0; }
    }
    @keyframes orb-move {
      0%, 100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(30px,-20px) scale(1.1); }
      66% { transform: translate(-20px,15px) scale(0.95); }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(40px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(108,99,255,0.3); }
      50%       { box-shadow: 0 0 50px rgba(108,99,255,0.7); }
    }
    @keyframes bounce-in {
      0%   { opacity:0; transform: scale(0.5) translateY(30px); }
      60%  { transform: scale(1.08) translateY(-6px); }
      100% { opacity:1; transform: scale(1) translateY(0); }
    }
    * { box-sizing: border-box; }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  `}</style>
)

function Confetti({ active }) {
  const colors = ['#6c63ff','#8b5cf6','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899']
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 1.2, size: Math.random() * 10 + 5,
    drift: (Math.random() - 0.5) * 120
  }))
  if (!active) return null
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:999, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:-20,
          width:p.size, height:p.size,
          borderRadius: p.id%3===0 ? '50%' : 2,
          background:p.color, '--drift':`${p.drift}px`,
          animation:`fall 2.2s ease-in ${p.delay}s forwards`
        }} />
      ))}
    </div>
  )
}

function BackgroundOrbs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
      {[
        { color:'rgba(108,99,255,0.1)',  size:420, top:'-10%', left:'-10%', dur:'8s'  },
        { color:'rgba(139,92,246,0.07)', size:320, top:'40%',  right:'-15%',dur:'11s' },
        { color:'rgba(16,185,129,0.05)', size:260, bottom:'10%',left:'20%', dur:'9s'  },
      ].map((o,i) => (
        <div key={i} style={{
          position:'absolute', width:o.size, height:o.size, borderRadius:'50%',
          background:o.color, top:o.top, left:o.left, right:o.right, bottom:o.bottom,
          filter:'blur(60px)', animation:`orb-move ${o.dur} ease-in-out infinite`,
          animationDelay:`${i*2}s`
        }} />
      ))}
    </div>
  )
}

function diasParaPrueba(fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const d = new Date(fecha + 'T00:00:00')
  return Math.round((d - hoy) / 86400000)
}

function BadgeFecha({ fecha }) {
  const dias = diasParaPrueba(fecha)
  if (dias === null) return null
  const cfg =
    dias < 0  ? { bg:'rgba(255,255,255,0.08)', color:'#6b7280', label:'Pasada' } :
    dias === 0 ? { bg:'rgba(245,158,11,0.2)',   color:'#fbbf24', label:'¡Hoy!' } :
    dias === 1 ? { bg:'rgba(239,68,68,0.2)',    color:'#f87171', label:'¡Mañana!' } :
    dias <= 7  ? { bg:'rgba(239,68,68,0.15)',   color:'#f87171', label:`En ${dias} días` } :
    dias <= 14 ? { bg:'rgba(245,158,11,0.15)',  color:'#fbbf24', label:`En ${dias} días` } :
                 { bg:'rgba(108,99,255,0.2)',   color:'#a78bfa', label:`En ${dias} días` }
  return (
    <span style={{ fontSize:10, background:cfg.bg, color:cfg.color,
      padding:'2px 8px', borderRadius:20, fontWeight:700, border:`1px solid ${cfg.color}33` }}>
      {cfg.label}
    </span>
  )
}

function StatCard({ icon, value, label, color, delay }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, padding:'16px 12px', textAlign:'center', animation:`slide-up 0.5s cubic-bezier(.34,1.56,.64,1) ${delay}ms both` }}>
      <p style={{ fontSize:22, margin:'0 0 4px' }}>{icon}</p>
      <p style={{ fontSize:26, fontWeight:900, color, margin:0, lineHeight:1 }}>{value}</p>
      <p style={{ fontSize:11, color:'#4a4a6a', margin:'4px 0 0', fontWeight:600 }}>{label}</p>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [ramos, setRamos] = useState([])
  const [vista, setVista] = useState('login')
  const [step, setStep] = useState(1)
  const [nuevoRamo, setNuevoRamo] = useState({ nombre:'', minAprobacion:4.0 })
  const [evaluaciones, setEvaluaciones] = useState([])
  const [ramoActivo, setRamoActivo] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, '', '/')
    }
    if (getToken()) fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const r = await fetch(`${API}/auth/me`, { headers: authHeaders() })
      if (r.ok) { const d = await r.json(); setUser(d); fetchRamos() }
      else { localStorage.removeItem('token'); setVista('login') }
    } catch { setVista('login') }
  }

  const fetchRamos = async () => {
    const r = await fetch(`${API}/ramos`, { headers: authHeaders() })
    if (r.ok) { const d = await r.json(); setRamos(d); setVista('home') }
  }

  const calcular = (evals, min) => {
    const completadas = evals.filter(e => e.nota !== '' && e.nota !== null && e.nota !== undefined)
    const pendientes  = evals.filter(e => e.nota === '' || e.nota === null || e.nota === undefined)
    if (evals.length === 0) return { estado:'sin_evals' }
    const pesoTotal = evals.reduce((s,e) => s + Number(e.peso), 0)
    if (Math.abs(pesoTotal - 100) > 0.01) return { estado:'pesos_incompletos' }
    if (pendientes.length === 0) {
      const prom = completadas.reduce((s,e) => s + Number(e.nota) * Number(e.peso)/100, 0)
      return prom >= min
        ? { estado:'aprobado', promedio: prom.toFixed(1) }
        : { estado:'reprobado', promedio: prom.toFixed(1) }
    }
    const pesoCompletado = completadas.reduce((s,e) => s + Number(e.peso), 0)
    const pesoPendiente  = pendientes.reduce((s,e)  => s + Number(e.peso), 0)
    const notaAcumulada  = completadas.reduce((s,e) => s + Number(e.nota) * Number(e.peso)/100, 0)
    const necesaria = (min - notaAcumulada) / (pesoPendiente / 100)
    if (necesaria > 7) return { estado:'imposible', necesaria: necesaria.toFixed(1) }
    if (necesaria <= 1) return { estado:'ya_aprobado', necesaria: '1.0' }
    return { estado:'en_curso', necesaria: necesaria.toFixed(1), pendientes: pendientes.length }
  }

  const guardarRamo = async () => {
    setLoading(true); setError('')
    const pesoTotal = evaluaciones.reduce((s,e) => s + Number(e.peso), 0)
    if (Math.abs(pesoTotal - 100) > 0.01) { setError('Los pesos deben sumar 100%'); setLoading(false); return }
    const body = { ...nuevoRamo, evaluaciones }
    const r = await fetch(`${API}/ramos`, { method:'POST', headers: authHeaders({'Content-Type':'application/json'}), body: JSON.stringify(body) })
    if (r.ok) { await fetchRamos(); setVista('home'); setStep(1); setEvaluaciones([]) }
    else setError('Error al guardar')
    setLoading(false)
  }

  const actualizarNota = async (ramoId, evalId, nota) => {
    await fetch(`${API}/ramos/${ramoId}/evaluaciones/${evalId}`, {
      method:'PATCH', headers: authHeaders({'Content-Type':'application/json'}),
      body: JSON.stringify({ nota })
    })
    setRamos(prev => prev.map(r => r.id === ramoId
      ? { ...r, evaluaciones: r.evaluaciones.map(e => e.id === evalId ? { ...e, nota } : e) }
      : r
    ))
    if (ramoActivo?.id === ramoId) {
      setRamoActivo(prev => ({ ...prev, evaluaciones: prev.evaluaciones.map(e => e.id === evalId ? { ...e, nota } : e) }))
    }
  }

  const eliminarRamo = async (id) => {
    await fetch(`${API}/ramos/${id}`, { method:'DELETE', headers: authHeaders() })
    setRamos(prev => prev.filter(r => r.id !== id))
    setRamoActivo(null)
  }

  const pesoUsado = evaluaciones.reduce((s,e) => s + Number(e.peso||0), 0)
  const pesoRestante = 100 - pesoUsado

  const card = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:24, marginBottom:16, animation:'slide-up 0.5s cubic-bezier(.34,1.56,.64,1) both' }
  const inp  = { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px 14px', color:'white', fontSize:15, outline:'none' }
  const btn  = (bg='#6c63ff') => ({ background:bg, color:'white', border:'none', borderRadius:14, padding:'13px 20px', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s' })

  if (vista === 'login') return (
    <div style={{ minHeight:'100vh', background:'#0a0a1a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif", position:'relative' }}>
      <GlobalStyles /><BackgroundOrbs />
      <div style={{ ...card, textAlign:'center', maxWidth:380, width:'90%', padding:40, position:'relative', zIndex:1 }}>
        <div style={{ fontSize:64, animation:'float 3s ease-in-out infinite' }}>📚</div>
        <h1 style={{ fontSize:32, fontWeight:900, background:'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'12px 0 6px' }}>APPrueba</h1>
        <p style={{ color:'#4a4a6a', fontSize:14, marginBottom:32 }}>Controla tus notas universitarias</p>
        <a href={`${API}/auth/google`} style={{ display:'block', background:'white', color:'#1a1a2e', borderRadius:14, padding:'14px 20px', fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
          🔑 Continuar con Google
        </a>
      </div>
    </div>
  )

  if (vista === 'nuevo') return (
    <div style={{ minHeight:'100vh', background:'#0a0a1a', fontFamily:"'Inter',sans-serif", position:'relative', zIndex:1 }}>
      <GlobalStyles /><BackgroundOrbs />
      <div style={{ maxWidth:480, margin:'0 auto', padding:'24px 16px' }}>
        <button onClick={()=>setVista('home')} style={{ background:'none', border:'none', color:'#6c63ff', fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:16 }}>← Volver</button>
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {['Tu ramo','Evaluaciones','Notas'].map((s,i) => (
            <div key={i} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:4, borderRadius:2, background: step>i ? 'linear-gradient(90deg,#6c63ff,#8b5cf6)' : 'rgba(255,255,255,0.08)', marginBottom:6, transition:'all 0.3s' }} />
              <span style={{ fontSize:10, color: step>i ? '#a78bfa' : '#3a3a5a', fontWeight:700 }}>{s}</span>
            </div>
          ))}
        </div>

        {step===1 && (
          <div style={card}>
            <h2 style={{ color:'white', fontWeight:800, marginBottom:20 }}>📖 Tu ramo</h2>
            <label style={{ color:'#6b7280', fontSize:12, fontWeight:600 }}>NOMBRE DEL RAMO</label>
            <input style={{ ...inp, marginTop:6, marginBottom:16 }} placeholder="Ej: Cálculo II" value={nuevoRamo.nombre} onChange={e=>setNuevoRamo({...nuevoRamo,nombre:e.target.value})} />
            <label style={{ color:'#6b7280', fontSize:12, fontWeight:600 }}>NOTA MÍNIMA PARA APROBAR</label>
            <input type="number" min="1" max="7" step="0.1" style={{ ...inp, marginTop:6 }} value={nuevoRamo.minAprobacion} onChange={e=>setNuevoRamo({...nuevoRamo,minAprobacion:parseFloat(e.target.value)})} />
            <button onClick={()=>nuevoRamo.nombre.trim() && setStep(2)} style={{ ...btn(), width:'100%', marginTop:20, opacity: nuevoRamo.nombre.trim()?1:0.4 }}>Siguiente →</button>
          </div>
        )}

        {step===2 && (
          <div style={card}>
            <h2 style={{ color:'white', fontWeight:800, marginBottom:4 }}>⚖️ Evaluaciones</h2>
            <p style={{ color: Math.abs(pesoRestante)<0.01 ? '#10b981' : '#f59e0b', fontSize:13, fontWeight:700, marginBottom:16 }}>
              {Math.abs(pesoRestante)<0.01 ? '✅ Pesos completos (100%)' : `Restante: ${pesoRestante.toFixed(0)}%`}
            </p>
            {evaluaciones.map((ev,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:14, marginBottom:10 }}>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <input style={{ ...inp, flex:2 }} placeholder="Nombre (ej: Solemne 1)" value={ev.nombre} onChange={e=>{ const a=[...evaluaciones]; a[i].nombre=e.target.value; setEvaluaciones(a) }} />
                  <input type="number" style={{ ...inp, flex:1 }} placeholder="%" min="1" max="100" value={ev.peso} onChange={e=>{ const a=[...evaluaciones]; a[i].peso=e.target.value; setEvaluaciones(a) }} />
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="date" style={{ ...inp, flex:1, fontSize:13 }} value={ev.fecha||''} onChange={e=>{ const a=[...evaluaciones]; a[i].fecha=e.target.value; setEvaluaciones(a) }} />
                  <button onClick={()=>setEvaluaciones(evaluaciones.filter((_,j)=>j!==i))} style={{ background:'rgba(239,68,68,0.2)', color:'#f87171', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontWeight:700 }}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={()=>setEvaluaciones([...evaluaciones,{nombre:'',peso:'',fecha:''}])} style={{ ...btn('rgba(108,99,255,0.2)'), width:'100%', color:'#a78bfa', marginBottom:12 }}>+ Agregar evaluación</button>
            <button onClick={()=>setStep(3)} style={{ ...btn(), width:'100%', opacity: Math.abs(pesoRestante)<0.01 && evaluaciones.length>0 ? 1:0.4 }} disabled={!(Math.abs(pesoRestante)<0.01 && evaluaciones.length>0)}>Siguiente →</button>
          </div>
        )}

        {step===3 && (
          <div style={card}>
            <h2 style={{ color:'white', fontWeight:800, marginBottom:4 }}>🎯 Tus notas</h2>
            <p style={{ color:'#4a4a6a', fontSize:13, marginBottom:16 }}>Deja en blanco las evaluaciones pendientes</p>
            {evaluaciones.map((ev,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ color:'white', fontSize:14, fontWeight:600, margin:'0 0 2px' }}>{ev.nombre}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:'#4a4a6a', fontSize:12 }}>{ev.peso}%</span>
                    <BadgeFecha fecha={ev.fecha} />
                  </div>
                </div>
                <input type="number" min="1" max="7" step="0.1" style={{ ...inp, width:80, textAlign:'center' }} placeholder="–" value={ev.nota||''} onChange={e=>{ const a=[...evaluaciones]; a[i].nota=e.target.value; setEvaluaciones(a) }} />
              </div>
            ))}
            {error && <p style={{ color:'#f87171', fontSize:13, marginBottom:8 }}>{error}</p>}
            <button onClick={guardarRamo} style={{ ...btn(), width:'100%', marginTop:8, opacity:loading?0.6:1 }} disabled={loading}>{loading?'Guardando...':'💾 Guardar ramo'}</button>
          </div>
        )}
      </div>
    </div>
  )

  if (ramoActivo) {
    const res = calcular(ramoActivo.evaluaciones, ramoActivo.minAprobacion)
    const completadas = ramoActivo.evaluaciones.filter(e=>e.nota!==''&&e.nota!==null&&e.nota!==undefined)
    const promActual = completadas.length ? (completadas.reduce((s,e)=>s+Number(e.nota)*Number(e.peso)/100,0) / (completadas.reduce((s,e)=>s+Number(e.peso),0)/100)).toFixed(1) : '–'
    return (
      <div style={{ minHeight:'100vh', background:'#0a0a1a', fontFamily:"'Inter',sans-serif", position:'relative' }}>
        <GlobalStyles /><BackgroundOrbs /><Confetti active={confetti} />
        <div style={{ maxWidth:480, margin:'0 auto', padding:'24px 16px', position:'relative', zIndex:1 }}>
          <button onClick={()=>setRamoActivo(null)} style={{ background:'none', border:'none', color:'#6c63ff', fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:16 }}>← Volver</button>
          <div style={{ ...card, background:'linear-gradient(135deg,rgba(108,99,255,0.15),rgba(139,92,246,0.1))' }}>
            <h2 style={{ color:'white', fontWeight:900, fontSize:22, margin:'0 0 4px' }}>{ramoActivo.nombre}</h2>
            <p style={{ color:'#4a4a6a', fontSize:13, margin:'0 0 16px' }}>Mínimo para aprobar: {ramoActivo.minAprobacion}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
              <StatCard icon="📊" value={promActual} label="Prom. actual" color="#a78bfa" delay={0} />
              <StatCard icon="🎯" value={res.necesaria||res.promedio||'–'} label={res.estado==='aprobado'||res.estado==='reprobado'?'Promedio final':'Nota necesaria'} color={res.estado==='aprobado'?'#10b981':res.estado==='imposible'?'#ef4444':'#f59e0b'} delay={100} />
              <StatCard icon="📝" value={ramoActivo.evaluaciones.filter(e=>e.nota===''||e.nota===null||e.nota===undefined).length} label="Pendientes" color="#6c63ff" delay={200} />
            </div>
            <div style={{ borderRadius:14, padding:14, textAlign:'center', background:
              res.estado==='aprobado'   ? 'rgba(16,185,129,0.15)' :
              res.estado==='reprobado'  ? 'rgba(239,68,68,0.15)'  :
              res.estado==='imposible'  ? 'rgba(239,68,68,0.1)'   :
              res.estado==='ya_aprobado'? 'rgba(16,185,129,0.1)'  : 'rgba(108,99,255,0.1)' }}>
              <p style={{ color:'white', fontWeight:800, fontSize:15, margin:0 }}>
                {res.estado==='aprobado'    && `🎉 ¡Aprobado con ${res.promedio}!`}
                {res.estado==='reprobado'   && `😞 Reprobado con ${res.promedio}`}
                {res.estado==='imposible'   && `💀 Necesitarías ${res.necesaria} — imposible`}
                {res.estado==='ya_aprobado' && `✅ ¡Ya aprobaste! Solo necesitas un 1.0`}
                {res.estado==='en_curso'    && `📌 Necesitas ${res.necesaria} en promedio en las ${res.pendientes} restantes`}
                {res.estado==='sin_evals'   && `➕ Agrega evaluaciones para calcular`}
                {res.estado==='pesos_incompletos' && `⚠️ Los pesos no suman 100%`}
              </p>
            </div>
          </div>
          {ramoActivo.evaluaciones.map((ev,i) => (
            <div key={ev.id||i} style={{ ...card, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ color:'white', fontSize:15, fontWeight:700, margin:'0 0 2px' }}>{ev.nombre}</p>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ color:'#4a4a6a', fontSize:12 }}>{ev.peso}%</span>
                    <BadgeFecha fecha={ev.fecha} />
                  </div>
                </div>
                <input type="number" min="1" max="7" step="0.1" style={{ ...inp, width:80, textAlign:'center' }} placeholder="–" value={ev.nota||''} onChange={e=>actualizarNota(ramoActivo.id, ev.id, e.target.value)} />
              </div>
            </div>
          ))}
          <button onClick={()=>eliminarRamo(ramoActivo.id)} style={{ ...btn('rgba(239,68,68,0.15)'), width:'100%', color:'#f87171', marginTop:8 }}>🗑 Eliminar ramo</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a1a', fontFamily:"'Inter',sans-serif", position:'relative' }}>
      <GlobalStyles /><BackgroundOrbs />
      <div style={{ maxWidth:480, margin:'0 auto', padding:'24px 16px', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:900, background:'linear-gradient(135deg,#6c63ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:0 }}>APPrueba</h1>
            <p style={{ color:'#4a4a6a', fontSize:13, margin:'2px 0 0' }}>Hola, {user?.nombre?.split(' ')[0]} 👋</p>
          </div>
          <img src={user?.foto} alt="" style={{ width:40, height:40, borderRadius:'50%', border:'2px solid #6c63ff' }} />
        </div>
        {ramos.length===0 ? (
          <div style={{ ...card, textAlign:'center', padding:40 }}>
            <div style={{ fontSize:48, marginBottom:12, animation:'float 3s ease-in-out infinite' }}>📚</div>
            <p style={{ color:'white', fontWeight:700, fontSize:18 }}>Sin ramos aún</p>
            <p style={{ color:'#4a4a6a', fontSize:14 }}>Agrega tu primer ramo para empezar</p>
          </div>
        ) : ramos.map((r,i) => {
          const res = calcular(r.evaluaciones||[], r.minAprobacion)
          const color = res.estado==='aprobado'||res.estado==='ya_aprobado' ? '#10b981' : res.estado==='reprobado'||res.estado==='imposible' ? '#ef4444' : '#f59e0b'
          return (
            <div key={r.id} onClick={()=>setRamoActivo(r)} style={{ ...card, cursor:'pointer', animationDelay:`${i*80}ms`, borderLeft:`3px solid ${color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ color:'white', fontWeight:800, fontSize:16, margin:'0 0 4px' }}>{r.nombre}</p>
                  <p style={{ color:'#4a4a6a', fontSize:12, margin:0 }}>Mín: {r.minAprobacion} · {(r.evaluaciones||[]).length} evaluaciones</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ color, fontWeight:900, fontSize:20, margin:'0 0 2px' }}>
                    {res.estado==='aprobado'||res.estado==='reprobado' ? res.promedio : res.necesaria||'–'}
                  </p>
                  <p style={{ color:'#4a4a6a', fontSize:10, margin:0 }}>
                    {res.estado==='aprobado'?'✅ Aprobado':res.estado==='reprobado'?'❌ Reprobado':res.estado==='imposible'?'💀 Imposible':res.estado==='ya_aprobado'?'✅ Salvado':'📌 Necesitas'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <button onClick={()=>{setVista('nuevo');setStep(1);setNuevoRamo({nombre:'',minAprobacion:4.0});setEvaluaciones([])}}
          style={{ width:'100%', background:'linear-gradient(135deg,#6c63ff,#8b5cf6)', color:'white', border:'none', borderRadius:18, padding:'16px', fontSize:15, fontWeight:800, marginTop:8, cursor:'pointer', boxShadow:'0 8px 30px rgba(108,99,255,0.4)', animation:'pulse-glow 2s ease-in-out infinite' }}>
          + Agregar ramo
        </button>
        <button onClick={()=>fetch(`${API}/auth/logout`,{method:'POST',headers:authHeaders()}).then(()=>{localStorage.removeItem('token');setUser(null);setVista('login')})}
          style={{ width:'100%', background:'transparent', color:'#3a3a5a', border:'none', padding:'12px', fontSize:12, cursor:'pointer', marginTop:4, fontWeight:600 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
