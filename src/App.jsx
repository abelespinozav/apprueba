import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import PanelNotificaciones from './Notificaciones'
import PlanEstudio from './PlanEstudio'
import Quiz from './Quiz'
import OnboardingScreen from './OnboardingScreen.jsx'
import { useTheme } from './useTheme'
import { colorTextoSobreHeader } from './theme'

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
      position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 9999,
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
  return <span style={{ fontSize: 10, background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>En {dias} días</span>
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
      <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0, lineHeight: 1.5 }}>{tip.icon} {tip.text}</p>
    </div>
  )
}



// ============================================================
// HOME SCREEN (Dashboard)
// ============================================================
const diasRestantes = (fecha) => {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + 'T00:00:00')
  return Math.round((f - hoy) / (1000 * 60 * 60 * 24))
}

const HOME_CSS = `
  .home-root { background: transparent; padding: 0 0 120px; height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .home-hero { padding: 56px 20px 20px; position: relative; z-index: 1; }
  .home-hero-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .home-saludo { font-size: 32px; font-weight: 900; letter-spacing: -0.035em; line-height: 1; color: var(--color-text); }
  .home-wave { display: inline-block; animation: homeWave 2.5s ease-in-out infinite; transform-origin: 70% 70%; }
  @keyframes homeWave { 0%, 60%, 100% { transform: rotate(0); } 10%, 30% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 40%, 50% { transform: rotate(14deg); } }
  .home-actions { display: flex; align-items: center; gap: 8px; }
  .home-iconbtn { background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 38px; height: 38px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; color: var(--color-text); }
  .home-notif-badge { position: absolute; top: -2px; right: -2px; background: #f87171; color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .home-avatar { width: 44px; height: 44px; border-radius: 999px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); display: grid; place-items: center; font-weight: 900; font-size: 17px; color: #fff; box-shadow: 0 8px 20px var(--shadow-color), inset 0 1px 0 rgba(255,255,255,0.3); cursor: pointer; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .home-avatar:hover { transform: scale(1.1) rotate(-6deg); }

  .home-streak-pill { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(251,146,60,0.22), rgba(251,191,36,0.12)); border: 1px solid rgba(251,146,60,0.35); border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 800; color: #fbbf24; box-shadow: 0 0 28px rgba(251,146,60,0.2); margin-bottom: 20px; }
  .home-flame { font-size: 16px; display: inline-block; animation: homeFlame 1.6s ease-in-out infinite; transform-origin: center bottom; filter: drop-shadow(0 0 10px rgba(251,146,60,0.8)); }
  @keyframes homeFlame { 0%, 100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(1.18) rotate(4deg); } }

  .home-promedio-block { text-align: center; padding: 8px 0 12px; }
  .home-promedio-giga { font-size: clamp(88px, 22vw, 130px); font-weight: 900; letter-spacing: -0.07em; line-height: 0.82; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: homeGradientSlide 7s linear infinite; background-size: 200% 200%; }
  @keyframes homeGradientSlide { to { background-position: 200% 0; } }
  .home-promedio-giga.nivel-excelente { background-image: linear-gradient(135deg, #10b981, #34d399 50%, #fbbf24 100%); filter: drop-shadow(0 0 40px rgba(16,185,129,0.5)); }
  .home-promedio-giga.nivel-bien { background-image: linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-accent)); filter: drop-shadow(0 0 40px var(--shadow-color)); }
  .home-promedio-giga.nivel-apretado { background-image: linear-gradient(135deg, #f59e0b, #fbbf24, #fde047); filter: drop-shadow(0 0 40px rgba(245,158,11,0.5)); }
  .home-promedio-giga.nivel-riesgo { background-image: linear-gradient(135deg, #dc2626, #ef4444, #fb7185); filter: drop-shadow(0 0 40px rgba(239,68,68,0.5)); }
  .home-promedio-giga.nivel-none { color: rgba(255,255,255,0.25); background: none; -webkit-text-fill-color: rgba(255,255,255,0.25); animation: none; }
  .home-promedio-caption { margin-top: 12px; font-size: 11px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; color: var(--color-text-muted); }

  .home-promedio-dots { display: inline-flex; gap: 8px; margin-top: 12px; padding: 8px 14px; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.09); border-radius: 999px; flex-wrap: wrap; justify-content: center; max-width: 260px; }
  .home-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; animation: homeDotPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
  .home-dot:nth-child(1) { animation-delay: 0.05s; }
  .home-dot:nth-child(2) { animation-delay: 0.12s; }
  .home-dot:nth-child(3) { animation-delay: 0.19s; }
  .home-dot:nth-child(4) { animation-delay: 0.26s; }
  .home-dot:nth-child(5) { animation-delay: 0.33s; }
  .home-dot:nth-child(6) { animation-delay: 0.4s; }
  .home-dot:nth-child(7) { animation-delay: 0.47s; }
  .home-dot:nth-child(8) { animation-delay: 0.54s; }
  @keyframes homeDotPop { from { transform: scale(0); opacity: 0; } }
  .home-dot.ok { background: #34d399; box-shadow: 0 0 10px rgba(52,211,153,0.7); }
  .home-dot.critico { background: #f87171; box-shadow: 0 0 10px rgba(248,113,113,0.8); animation: homeDotPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards, homeDotCritical 1.4s 0.6s ease-in-out infinite; }
  .home-dot.reprobado { background: #dc2626; box-shadow: 0 0 10px rgba(220,38,38,0.7); }
  .home-dot.extra { background: rgba(255,255,255,0.28); box-shadow: 0 0 6px rgba(255,255,255,0.12); cursor: help; }
  @keyframes homeDotCritical { 0%, 100% { box-shadow: 0 0 10px rgba(248,113,113,0.8); transform: scale(1); } 50% { box-shadow: 0 0 20px rgba(248,113,113,1); transform: scale(1.18); } }
  .home-promedio-context { margin-top: 8px; font-size: 12px; color: var(--color-text-muted); font-weight: 700; }
  .home-promedio-context .sep { opacity: 0.4; margin: 0 6px; }
  .home-promedio-context .c-ok { color: #34d399; }
  .home-promedio-context .c-crit { color: #f87171; }

  .home-suggest-card { margin: 20px 20px 0; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--color-primary); border-radius: 22px; padding: 20px; position: relative; overflow: hidden; color: #fff; }
  .home-suggest-tag { position: relative; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-primary); margin-bottom: 8px; display: block; }
  .home-suggest-card h3 { position: relative; font-size: 22px; font-weight: 900; letter-spacing: -0.02em; margin: 0 0 4px; }
  .home-suggest-sub { position: relative; font-size: 13px; opacity: 0.85; margin: 0 0 16px; }
  .home-btn-suggest { position: relative; width: 100%; padding: 13px; background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: #fff; border: 1px solid var(--color-primary); border-radius: 16px; font-family: inherit; font-weight: 900; font-size: 14px; cursor: pointer; transition: background 0.2s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .home-btn-suggest:hover { background: color-mix(in srgb, var(--color-primary) 20%, transparent); transform: scale(1.02); }
  .home-btn-suggest:active { transform: scale(0.97); }

  .home-section-block { padding: 28px 20px 0; }
  .home-section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .home-section-title h4 { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; }
  .home-section-title .link { font-size: 12px; font-weight: 700; color: var(--color-secondary); text-decoration: none; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; }
  .home-urgente-label h4 { color: #fbbf24 !important; letter-spacing: 0.18em !important; }

  .home-clase-card { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; padding: 16px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; position: relative; overflow: hidden; }
  .home-clase-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--urgency-color, #10b981); }
  .home-clase-urgencia { width: 56px; height: 56px; border-radius: 16px; background: color-mix(in srgb, var(--urgency-color, #10b981) 20%, transparent); color: var(--urgency-color, #10b981); display: grid; place-items: center; font-size: 22px; border: 1px solid color-mix(in srgb, var(--urgency-color, #10b981) 40%, transparent); }
  .home-clase-info .home-clase-nombre { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 2px; color: var(--color-text); }
  .home-clase-info .home-clase-meta { font-size: 12px; color: var(--color-text-muted); }
  .home-clase-cuanto { text-align: right; }
  .home-clase-cuanto .home-tiempo { font-size: 15px; font-weight: 900; color: var(--urgency-color, #10b981); letter-spacing: -0.02em; line-height: 1; }
  .home-clase-cuanto .home-subtime { font-size: 10px; color: var(--color-text-muted); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
  .home-clase-card.urgencia-amarillo { --urgency-color: #f59e0b; background: rgba(245,158,11,0.09); border-color: rgba(245,158,11,0.35); animation: homePulseAmber 2s ease-in-out infinite; }
  @keyframes homePulseAmber { 0%, 100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.25), 0 8px 32px -8px rgba(245,158,11,0.25); border-color: rgba(245,158,11,0.35); } 50% { box-shadow: 0 0 0 3px rgba(245,158,11,0.4), 0 12px 40px -8px rgba(245,158,11,0.4); border-color: rgba(245,158,11,0.7); } }
  .home-clase-card.urgencia-rojo { --urgency-color: #ef4444; background: rgba(239,68,68,0.11); border-color: rgba(239,68,68,0.45); animation: homePulseRed 1.4s ease-in-out infinite; }
  @keyframes homePulseRed { 0%, 100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.3), 0 8px 32px -8px rgba(239,68,68,0.35); border-color: rgba(239,68,68,0.45); } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.5), 0 16px 48px -8px rgba(239,68,68,0.5); border-color: rgba(239,68,68,0.9); } }

  .home-clase-empty { text-align: center; padding: 28px 16px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px dashed rgba(255,255,255,0.12); border-radius: 22px; }
  .home-clase-empty .home-empty-emoji { font-size: 44px; margin-bottom: 8px; display: inline-block; animation: homeFloaty 3s ease-in-out infinite; }
  @keyframes homeFloaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .home-clase-empty .home-empty-txt { font-size: 16px; font-weight: 800; margin-bottom: 4px; color: var(--color-text); }
  .home-clase-empty .home-empty-sub { font-size: 13px; color: var(--color-text-muted); }

  .home-ramos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .home-ramo-card { position: relative; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 10px; overflow: hidden; cursor: pointer; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s; }
  .home-ramo-card::after { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--accent); }
  .home-ramo-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.18); }
  .home-ramo-card > * { position: relative; }
  .home-ramo-card.accent-cyan { --accent: #06b6d4; --accent-glow: rgba(6,182,212,0.4); }
  .home-ramo-card.accent-purple { --accent: #a78bfa; --accent-glow: rgba(167,139,250,0.4); }
  .home-ramo-card.accent-pink { --accent: #ec4899; --accent-glow: rgba(236,72,153,0.4); }
  .home-ramo-card.accent-orange { --accent: #f97316; --accent-glow: rgba(249,115,22,0.4); }
  .home-ramo-card.accent-emerald { --accent: #10b981; --accent-glow: rgba(16,185,129,0.4); }
  .home-ramo-card.accent-yellow { --accent: #eab308; --accent-glow: rgba(234,179,8,0.4); }
  .home-ramo-title { font-size: 11px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.2; margin-bottom: 4px; min-height: 24px; color: var(--color-text); }
  .home-ramo-nota-wrap { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 2px; }
  .home-ramo-nota { font-size: 20px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; color: #fff; }
  .home-ramo-nota-tipo { font-size: 7px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); }
  .home-ramo-necesita { font-size: 9px; color: var(--color-text-muted); font-weight: 700; line-height: 1.25; min-height: 16px; display: flex; align-items: center; gap: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .home-ramo-necesita strong { color: #fbbf24; font-weight: 900; }
  .home-ramo-necesita.aprobado { color: #34d399; font-weight: 900; }
  .home-ramo-necesita.aprobado strong { color: #34d399; }
  .home-ramo-necesita.critico strong { color: #f87171; }
  .home-ramo-progreso { margin: 6px 0; }
  .home-prog-row { display: flex; justify-content: space-between; font-size: 8px; color: var(--color-text-muted); margin-bottom: 2px; font-weight: 700; letter-spacing: 0.03em; }
  .home-prog-track { height: 3px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
  .home-prog-fill { height: 100%; background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white)); border-radius: 999px; box-shadow: 0 0 10px var(--accent-glow); animation: homeFillIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
  @keyframes homeFillIn { from { width: 0 !important; } }
  .home-ramo-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
  .home-ramo-badge.ok { background: rgba(16,185,129,0.12); color: #34d399; border-color: rgba(16,185,129,0.3); }
  .home-ramo-badge.warn { background: rgba(245,158,11,0.12); color: #fbbf24; border-color: rgba(245,158,11,0.3); }
  .home-ramo-badge.risk { background: rgba(239,68,68,0.12); color: #f87171; border-color: rgba(239,68,68,0.3); }

  .home-vive h4 .uni { color: var(--color-primary); font-weight: 900; letter-spacing: 0.22em; }
  .home-vive-empty { padding: 28px 16px; text-align: center; color: var(--color-text-muted); font-size: 14px; font-weight: 600; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; }
  .home-novedades-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; margin: 0 -20px; padding-left: 20px; padding-right: 20px; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .home-novedades-scroll::-webkit-scrollbar { display: none; }
  .home-novedad-card { flex: 0 0 180px; scroll-snap-align: start; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 16px; position: relative; overflow: hidden; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s; cursor: pointer; }
  .home-novedad-card:hover { transform: translateY(-4px); border-color: var(--color-primary); }
  .home-novedad-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--nov-color, var(--color-primary)); box-shadow: 0 0 16px var(--nov-color, var(--color-primary)); }
  .home-novedad-emoji { font-size: 32px; margin-bottom: 8px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4)); display: inline-block; }
  .home-novedad-tipo { display: inline-block; font-size: 10px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: var(--nov-color, var(--color-primary)); padding: 3px 8px; background: color-mix(in srgb, var(--nov-color, var(--color-primary)) 15%, transparent); border-radius: 999px; margin-bottom: 8px; }
  .home-novedad-title { font-size: 14px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.25; margin-bottom: 4px; color: var(--color-text); }
  .home-novedad-desc { font-size: 12px; color: var(--color-text-muted); line-height: 1.4; }

  .home-fundador-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(201,168,76,0.25); border: 1px solid rgba(201,168,76,0.5); border-radius: 20px; padding: 2px 10px; font-size: 11px; color: #C9A84C; font-weight: 700; margin-top: 6px; }
`

const HOME_ACCENTS = ['accent-cyan', 'accent-purple', 'accent-pink', 'accent-orange', 'accent-emerald', 'accent-yellow']

function HomeScreen({ ramos, usuario, esFundador, numeroRegistro, horario, onVerRamo, onHorario, onVerHorario, onNotif, onPerfil, onAdmin, evalProximas3dias, novedades }) {
  const navigate = useNavigate()
  const hoy = new Date()
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const diaHoy = dias[hoy.getDay()]
  const ahora = hoy.getHours() * 60 + hoy.getMinutes()
  const toMin = t => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m }

  const ramosConNotas = ramos.filter(r => (r.evaluaciones || []).some(e => e.nota !== null && e.nota !== undefined && e.nota !== ''))
  const promedioGlobal = ramosConNotas.length > 0
    ? ramosConNotas.reduce((acc, r) => {
        const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
        const calc = calcular(evs, r.min_aprobacion, r)
        return acc + (calc?.promedio || 0)
      }, 0) / ramosConNotas.length
    : null

  // Estado por ramo — 4 categorías para los dots del promedio semestral:
  // - aprobado  → ramo cerrado con promedio ≥ min (o eximido). Dot verde.
  // - en_curso  → en progreso sin alerta, o necesita algo razonable (<5.5). Dot verde.
  // - critico   → aún salvable pero necesita ≥5.5 en lo que queda. Dot rojo pulsante.
  // - reprobado → matemáticamente imposible aprobar (estado reprobado / necesaria > 7). Dot rojo fijo.
  const getRamoEstado = (r) => {
    const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
    if (evs.length === 0) return 'en_curso'
    const calc = calcular(evs, r.min_aprobacion, r)
    if (!calc) return 'en_curso'
    if (calc.estado === 'aprobado' || calc.estado === 'eximido') return 'aprobado'
    if (calc.estado === 'reprobado_sin_examen' || calc.estado === 'reprobado_imposible' || calc.estado === 'imposible') return 'reprobado'
    if (calc.necesaria != null && calc.necesaria > 7) return 'reprobado'
    if (calc.necesariaExamen != null && calc.necesariaExamen > 7) return 'reprobado'
    if (calc.necesaria != null && calc.necesaria >= 5.5) return 'critico'
    if (calc.estado === 'con_examen' && calc.necesariaExamen != null && calc.necesariaExamen >= 5.5) return 'critico'
    return 'en_curso'
  }
  const ramosEstados = ramos.map(getRamoEstado)
  const countAprobado = ramosEstados.filter(s => s === 'aprobado').length
  const countEnCurso = ramosEstados.filter(s => s === 'en_curso').length
  const countCritico = ramosEstados.filter(s => s === 'critico').length
  const countReprobado = ramosEstados.filter(s => s === 'reprobado').length

  // Nivel del promedio → para el gradient
  const nivelPromedio = promedioGlobal == null ? 'none'
    : promedioGlobal >= 6 ? 'excelente'
    : promedioGlobal >= 5 ? 'bien'
    : promedioGlobal >= 4 ? 'apretado'
    : 'riesgo'

  // Próxima clase (hoy o el próximo día con clases)
  const proximaClase = (() => {
    const clasesDelDia = (diaKey) => (horario || [])
      .filter(h => h.dia?.toLowerCase() === diaKey)
      .sort((a, b) => toMin(a.hora_inicio) - toMin(b.hora_inicio))
    const hoyClases = clasesDelDia(diaHoy)
    const claseHoy = hoyClases.find(h => toMin(h.hora_inicio) > ahora)
    if (claseHoy) {
      const mins = toMin(claseHoy.hora_inicio) - ahora
      const etiqueta = mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`
      return {
        clase: claseHoy,
        etiqueta,
        sub: 'restan',
        urgencia: mins < 15 ? 'rojo' : mins < 120 ? 'amarillo' : 'verde',
        esPronto: mins < 120,
      }
    }
    for (let offset = 1; offset <= 7; offset++) {
      const d = new Date(hoy); d.setDate(d.getDate() + offset)
      const cs = clasesDelDia(dias[d.getDay()])
      if (cs.length > 0) {
        return {
          clase: cs[0],
          etiqueta: offset === 1 ? 'Mañana' : cs[0].dia.charAt(0).toUpperCase() + cs[0].dia.slice(1),
          sub: cs[0].hora_inicio,
          urgencia: 'verde',
          esPronto: false,
        }
      }
    }
    return null
  })()

  // Próximas evaluaciones (para acción sugerida y badges de ramos)
  const proximas = ramos.flatMap(r =>
    (r.evaluaciones || [])
      .filter(e => e.fecha && (e.nota === null || e.nota === undefined || e.nota === ''))
      .map(e => ({ ...e, ramoNombre: r.nombre, ramoId: r.id }))
  ).filter(e => { const d = diasRestantes(e.fecha); return d != null && d >= 0 })
   .sort((a, b) => diasRestantes(a.fecha) - diasRestantes(b.fecha))

  const sugerida = proximas.find(ev => !ev.plan_estudio) || proximas[0] || null

  const xpTotal = ramos.reduce((acc, r) => acc + (r.evaluaciones||[]).filter(e => e.nota).length * 80, 0) + (esFundador ? 500 : 0)
  const nivel = Math.floor(xpTotal / 500) + 1
  const nivelLabel = nivel <= 1 ? 'Novato' : nivel <= 2 ? 'Estudiante' : nivel <= 3 ? 'Dedicado' : nivel <= 4 ? 'Experto' : 'Maestro'

  const nombreCorto = (usuario?.nombre || usuario?.name || 'estudiante').split(' ')[0]
  const inicial = (usuario?.nombre || usuario?.name || 'U')[0].toUpperCase()

  const uniKey = usuario?.universidad || 'ufro'
  const uniLabel = uniKey === 'ufro' ? 'UFRO' : uniKey === 'umayor' ? 'U. MAYOR' : uniKey === 'uautonoma' ? 'U. AUTÓNOMA' : uniKey === 'inacap' ? 'INACAP' : uniKey === 'santotomas' ? 'SANTO TOMÁS' : uniKey === 'uctemuco' ? 'UC TEMUCO' : uniKey.toUpperCase()

  // Info de cada ramo para el card
  const getRamoInfo = (r) => {
    const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
    const calc = evs.length > 0 ? calcular(evs, r.min_aprobacion, r) : null
    const completadas = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '').length
    const total = evs.length
    const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0
    let notaPrincipal = '--', notaTipo = 'Promedio', necesita = null, badge = null
    if (calc) {
      if (calc.estado === 'aprobado' || calc.estado === 'eximido') {
        notaPrincipal = calc.promedio != null ? calc.promedio.toFixed(1) : '--'
        notaTipo = 'Final'
        necesita = { content: <>🎉 <strong>¡Aprobado!</strong></>, variante: 'aprobado' }
        badge = { texto: '✅ Aprobado', clase: 'ok' }
      } else if (calc.estado === 'reprobado_sin_examen' || calc.estado === 'reprobado_imposible' || calc.estado === 'imposible') {
        notaPrincipal = calc.promedio != null ? calc.promedio.toFixed(1) : '--'
        necesita = { content: 'imposible aprobar', variante: 'critico' }
        badge = { texto: '⚠️ En riesgo', clase: 'risk' }
      } else if (calc.promedio != null) {
        notaPrincipal = calc.promedio.toFixed(1)
        if (calc.necesaria != null && calc.pendientesCount > 0) {
          const variante = calc.necesaria > 6 ? 'critico' : ''
          necesita = { content: <>necesitas <strong>{calc.necesaria.toFixed(1)}</strong></>, variante }
        }
      }
    }
    if (!badge) {
      const proxEv = evs.filter(e => e.fecha && (e.nota === null || e.nota === undefined || e.nota === ''))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]
      if (proxEv) {
        const d = diasRestantes(proxEv.fecha)
        if (d != null && d >= 0) {
          const clase = d <= 2 ? 'risk' : d <= 5 ? 'warn' : ''
          const txt = d === 0 ? '¡Hoy!' : d === 1 ? 'Mañana' : `En ${d} días`
          badge = { texto: `📅 ${txt}`, clase }
        }
      }
    }
    return { notaPrincipal, notaTipo, necesita, badge, progreso, completadas, total }
  }

  const renderProximaClase = () => {
    if (!proximaClase) {
      return (
        <div className="home-clase-empty">
          <div className="home-empty-emoji">🎉</div>
          <div className="home-empty-txt">Sin clases próximas</div>
          <div className="home-empty-sub">¡Aprovecha para estudiar lo pendiente!</div>
        </div>
      )
    }
    const c = proximaClase
    const urgClase = c.urgencia === 'rojo' ? 'urgencia-rojo' : c.urgencia === 'amarillo' ? 'urgencia-amarillo' : ''
    const icono = c.urgencia === 'rojo' ? '🔴' : c.urgencia === 'amarillo' ? '🟡' : '🟢'
    return (
      <div className={`home-clase-card ${urgClase}`} onClick={onVerHorario}>
        <div className="home-clase-urgencia">{icono}</div>
        <div className="home-clase-info">
          <div className="home-clase-nombre">{c.clase.ramo_nombre || '(sin nombre)'}</div>
          <div className="home-clase-meta">
            {c.clase.sala ? `${c.clase.sala} · ` : ''}{c.clase.hora_inicio}{c.clase.hora_fin ? ` – ${c.clase.hora_fin}` : ''}
          </div>
        </div>
        <div className="home-clase-cuanto">
          <div className="home-tiempo">{c.etiqueta}</div>
          <div className="home-subtime">{c.sub}</div>
        </div>
      </div>
    )
  }

  const seccionProximaClase = (titulo, esUrgente) => (
    <div className="home-section-block">
      <div className={`home-section-title ${esUrgente ? 'home-urgente-label' : ''}`}>
        <h4>{titulo}</h4>
        <button className="link" onClick={onVerHorario}>Ver horario →</button>
      </div>
      {renderProximaClase()}
    </div>
  )

  const seccionSugerida = () => {
    if (!sugerida) return null
    const d = diasRestantes(sugerida.fecha)
    const diaTxt = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`
    return (
      <div className="home-suggest-card">
        <span className="home-suggest-tag">⚡ Acción sugerida</span>
        <h3>{sugerida.nombre} {diaTxt}</h3>
        <div className="home-suggest-sub">{sugerida.ramoNombre} · {sugerida.ponderacion}% del ramo</div>
        <button className="home-btn-suggest" onClick={() => onVerRamo && onVerRamo(sugerida)}>
          🤖 Generar plan ahora →
        </button>
      </div>
    )
  }

  const esUrgentePronto = !!(proximaClase && proximaClase.esPronto)

  // Texto contextual del promedio — 4 categorías, omite las con count 0
  const promedioContext = (() => {
    const parts = []
    if (countReprobado > 0) parts.push(<span key="r" className="c-crit">{countReprobado} {countReprobado === 1 ? 'reprobado' : 'reprobados'}</span>)
    if (countCritico > 0) parts.push(<span key="c" className="c-crit">{countCritico} {countCritico === 1 ? 'crítico' : 'críticos'}</span>)
    if (countEnCurso > 0) parts.push(<span key="i" className="c-ok">{countEnCurso} en curso</span>)
    if (countAprobado > 0) parts.push(<span key="a" className="c-ok">{countAprobado} {countAprobado === 1 ? 'aprobado' : 'aprobados'}</span>)
    if (parts.length === 0) return null
    const out = []
    parts.forEach((p, i) => {
      if (i > 0) out.push(<span key={`s${i}`} className="sep">·</span>)
      out.push(p)
    })
    return out
  })()

  return (
    <>
      <style>{HOME_CSS}</style>
      <div className="home-root">
        {/* HERO */}
        <div className="home-hero">
          <div className="home-hero-top">
            <div>
              <div className="home-saludo">Hola, {nombreCorto} <span className="home-wave">👋</span></div>
              {esFundador && (
                <div className="home-fundador-badge">🏅 Fundador #{numeroRegistro}</div>
              )}
            </div>
            <div className="home-actions">
              {usuario?.email === 'abelespinozav@gmail.com' && (
                <button className="home-iconbtn" onClick={onAdmin}>⚙️</button>
              )}
              <button className="home-iconbtn" onClick={onNotif}>
                🔔
                {evalProximas3dias > 0 && <span className="home-notif-badge">{evalProximas3dias}</span>}
              </button>
              <div onClick={onPerfil} className="home-avatar">{inicial}</div>
            </div>
          </div>

          <div className="home-streak-pill">
            <span className="home-flame">🔥</span>
            <span>Nivel {nivelLabel} · {xpTotal} XP</span>
          </div>

          <div className="home-promedio-block">
            <div className={`home-promedio-giga nivel-${nivelPromedio}`}>
              {promedioGlobal !== null ? promedioGlobal.toFixed(1) : '—'}
            </div>
            <div className="home-promedio-caption">Promedio semestral</div>
            {ramosEstados.length > 0 && (
              <>
                <div><div className="home-promedio-dots">
                  {ramosEstados.slice(0, 6).map((s, i) => (
                    <span key={i} className={`home-dot ${s === 'reprobado' ? 'reprobado' : s === 'critico' ? 'critico' : 'ok'}`} />
                  ))}
                  {ramosEstados.length > 6 && (
                    <span className="home-dot extra" title={`y ${ramosEstados.length - 6} más`} />
                  )}
                </div></div>
                {promedioContext && <div className="home-promedio-context">{promedioContext}</div>}
              </>
            )}
          </div>
        </div>

        {/* Próxima clase URGENTE va antes de sugerida */}
        {esUrgentePronto && seccionProximaClase('⏰ Tu clase empieza pronto', true)}

        {/* Acción sugerida */}
        {seccionSugerida()}

        {/* Próxima clase NO urgente va después */}
        {!esUrgentePronto && seccionProximaClase('📅 Tu próxima clase', false)}

        {/* Ramos grid 2x2 */}
        {ramos.length > 0 && (
          <div className="home-section-block">
            <div className="home-section-title">
              <h4>📚 Tus ramos</h4>
              <button className="link" onClick={() => navigate('/ramos')}>Ver todos →</button>
            </div>
            <div className="home-ramos-grid">
              {ramos.slice(0, 6).map((r, i) => {
                const info = getRamoInfo(r)
                const accentClass = HOME_ACCENTS[i % HOME_ACCENTS.length]
                return (
                  <div key={r.id} className={`home-ramo-card ${accentClass}`} onClick={() => navigate(`/ramos/${r.id}`)}>
                    <div className="home-ramo-title">{r.nombre}</div>
                    <div className="home-ramo-nota-wrap">
                      <div className="home-ramo-nota">{info.notaPrincipal}</div>
                      <div className="home-ramo-nota-tipo">{info.notaTipo}</div>
                    </div>
                    {info.necesita && (
                      <div className={`home-ramo-necesita ${info.necesita.variante}`}>{info.necesita.content}</div>
                    )}
                    <div className="home-ramo-progreso">
                      <div className="home-prog-row">
                        <span>{info.completadas}/{info.total} evaluaciones</span>
                        <span>{info.progreso}%</span>
                      </div>
                      <div className="home-prog-track">
                        <div className="home-prog-fill" style={{ width: `${info.progreso}%` }} />
                      </div>
                    </div>
                    {info.badge && (
                      <span className={`home-ramo-badge ${info.badge.clase || ''}`}>{info.badge.texto}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vive {Universidad} — al final, siempre visible */}
        <div className="home-section-block home-vive">
          <div className="home-section-title">
            <h4>🎉 Vive <span className="uni">{uniLabel}</span></h4>
          </div>
          {novedades && novedades.length > 0 ? (
            <div className="home-novedades-scroll">
              {novedades.slice(0, 6).map((n, i) => (
                <div key={i} className="home-novedad-card" style={{ '--nov-color': n.color || 'var(--color-primary)' }}>
                  {n.emoji && <div className="home-novedad-emoji">{n.emoji}</div>}
                  {n.tipo && <div className="home-novedad-tipo">{n.tipo}</div>}
                  <div className="home-novedad-title">{n.titulo}</div>
                  {n.descripcion && <div className="home-novedad-desc">{n.descripcion}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="home-vive-empty">Sin novedades hoy 🎓</div>
          )}
        </div>
      </div>
    </>
  )
}


// ============================================================
// PLAN IA + QUIZ TABS (comparten CSS glass)
// ============================================================
const PQ_CSS = `
  .pq-root { background: transparent; padding: 0 0 120px; height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .pq-hero { padding: 56px 20px 8px; }
  .pq-hero h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.035em; line-height: 1; margin: 0 0 8px; color: var(--color-text); }
  .pq-hero-sub { font-size: 13px; color: var(--color-text-muted); font-weight: 600; margin: 0; line-height: 1.5; max-width: 34ch; }
  .pq-hero-sub strong { color: var(--color-text); font-weight: 800; }

  .pq-brain { display: inline-block; animation: pqBrainPulse 2.8s ease-in-out infinite; transform-origin: center; }
  @keyframes pqBrainPulse { 0%, 100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0 rgba(167,139,250,0)); } 50% { transform: scale(1.08) translateY(-3px); filter: drop-shadow(0 0 16px rgba(167,139,250,0.55)); } }

  .pq-bolt { display: inline-block; animation: pqBoltZap 3s ease-in-out infinite; transform-origin: center; }
  @keyframes pqBoltZap { 0%, 55%, 100% { transform: scale(1) rotate(0); filter: drop-shadow(0 0 0 rgba(251,191,36,0)); } 18% { transform: scale(1.15) rotate(-7deg); filter: drop-shadow(0 0 14px rgba(251,191,36,0.75)); } 32% { transform: scale(1.05) rotate(7deg); filter: drop-shadow(0 0 10px rgba(251,191,36,0.4)); } 45% { transform: scale(1.02) rotate(-2deg); filter: drop-shadow(0 0 6px rgba(251,191,36,0.2)); } }

  .pq-section { padding: 28px 20px 0; }
  .pq-section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .pq-section-title h4 { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; }

  .pq-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .pq-ramo { position: relative; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 10px; overflow: hidden; cursor: pointer; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s, background 0.3s; animation: pqIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; min-height: 78px; display: flex; flex-direction: column; justify-content: space-between; }
  @keyframes pqIn { from { opacity: 0; transform: translateY(10px); } }
  .pq-ramo::after { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--accent); transition: width 0.3s, box-shadow 0.3s; }
  .pq-ramo:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); }
  .pq-ramo.active { background: rgba(255,255,255,0.08); border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
  .pq-ramo.active::after { width: 5px; box-shadow: 0 0 14px var(--accent-glow); }
  .pq-ramo > * { position: relative; }
  .pq-ramo.accent-cyan { --accent: #06b6d4; --accent-glow: rgba(6,182,212,0.4); }
  .pq-ramo.accent-purple { --accent: #a78bfa; --accent-glow: rgba(167,139,250,0.4); }
  .pq-ramo.accent-pink { --accent: #ec4899; --accent-glow: rgba(236,72,153,0.4); }
  .pq-ramo.accent-orange { --accent: #f97316; --accent-glow: rgba(249,115,22,0.4); }
  .pq-ramo.accent-emerald { --accent: #10b981; --accent-glow: rgba(16,185,129,0.4); }
  .pq-ramo.accent-yellow { --accent: #eab308; --accent-glow: rgba(234,179,8,0.4); }
  .pq-ramo-title { font-size: 12px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.2; margin: 0 0 4px; color: var(--color-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pq-ramo-count { font-size: 9px; color: var(--color-text-muted); font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  .pq-ramo.active .pq-ramo-count { color: var(--accent); }

  .pq-evals-panel { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; animation: pqEvalsIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes pqEvalsIn { from { opacity: 0; transform: translateY(-6px); } }
  .pq-evals-header { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 4px 2px 8px; }
  .pq-evals-header .pq-evals-ramo { color: var(--color-text); }
  .pq-eval { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.04); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--color-primary); border-radius: 14px; cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .pq-eval:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); transform: translateX(3px); }
  .pq-eval-info { flex: 1; min-width: 0; }
  .pq-eval-nombre { font-size: 14px; font-weight: 800; color: var(--color-text); margin: 0 0 3px; letter-spacing: -0.01em; }
  .pq-eval-meta { font-size: 11px; color: var(--color-text-muted); margin: 0; font-weight: 700; letter-spacing: 0.02em; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pq-eval-meta .ok { color: #34d399; }
  .pq-eval-meta .sep { opacity: 0.35; }
  .pq-eval-arrow { font-size: 18px; flex-shrink: 0; opacity: 0.6; transition: opacity 0.2s, transform 0.2s; }
  .pq-eval:hover .pq-eval-arrow { opacity: 1; transform: translateX(2px); }
  .pq-evals-empty { padding: 18px 16px; font-size: 13px; color: var(--color-text-muted); text-align: center; font-weight: 600; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1); border-radius: 14px; }

  .pq-empty { text-align: center; padding: 44px 20px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px dashed rgba(255,255,255,0.12); border-radius: 22px; }
  .pq-empty-emoji { font-size: 48px; margin-bottom: 10px; display: inline-block; animation: pqFloaty 3s ease-in-out infinite; }
  @keyframes pqFloaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .pq-empty-txt { font-size: 15px; color: var(--color-text); font-weight: 800; margin: 0 0 4px; }
  .pq-empty-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 600; }

  .pq-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 24px; animation: pqBackdropIn 0.2s ease; }
  @keyframes pqBackdropIn { from { opacity: 0; } }
  .pq-modal { background: rgba(22,22,34,0.88); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.1); border-left: 3px solid var(--color-primary); border-radius: 22px; padding: 24px; max-width: 340px; width: 100%; animation: pqModalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-sizing: border-box; }
  @keyframes pqModalIn { from { opacity: 0; transform: translateY(12px) scale(0.96); } }
  .pq-modal-emoji { font-size: 44px; text-align: center; margin-bottom: 10px; }
  .pq-modal-title { font-size: 18px; font-weight: 900; color: var(--color-text); text-align: center; margin: 0 0 8px; letter-spacing: -0.02em; }
  .pq-modal-desc { font-size: 13px; color: var(--color-text-muted); text-align: center; margin: 0 0 20px; line-height: 1.5; font-weight: 600; }
  .pq-modal-desc strong { color: var(--color-text); font-weight: 800; }
  .pq-modal-upload { display: block; width: 100%; text-align: center; background: var(--color-primary); color: #1a1a1a; border-radius: 14px; padding: 13px; font-size: 14px; font-weight: 900; cursor: pointer; margin-bottom: 8px; transition: filter 0.2s, transform 0.2s; box-sizing: border-box; }
  .pq-modal-upload:hover { filter: brightness(1.08); }
  .pq-modal-upload:active { transform: scale(0.98); }
  .pq-modal-cancel { width: 100%; padding: 11px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: var(--color-text-muted); font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.2s; box-sizing: border-box; }
  .pq-modal-cancel:hover { background: rgba(255,255,255,0.08); }

  .pq-hist { display: flex; flex-direction: column; gap: 8px; }
  .pq-hist-item { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--hist-color, var(--color-primary)); border-radius: 14px; padding: 12px 14px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s; }
  .pq-hist-item:hover { transform: translateX(3px); border-color: rgba(255,255,255,0.16); }
  .pq-hist-item.ok { --hist-color: #34d399; }
  .pq-hist-item.warn { --hist-color: #fbbf24; }
  .pq-hist-item.risk { --hist-color: #f87171; }
  .pq-hist-info { flex: 1; min-width: 0; }
  .pq-hist-name { font-size: 13px; font-weight: 800; color: var(--color-text); margin: 0 0 2px; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pq-hist-meta { font-size: 10px; color: var(--color-text-muted); margin: 0; font-weight: 700; letter-spacing: 0.04em; }
  .pq-hist-pct { font-size: 20px; font-weight: 900; color: var(--hist-color); letter-spacing: -0.02em; }
  .pq-hist-empty { padding: 24px 20px; text-align: center; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.12); border-radius: 16px; color: var(--color-text-muted); font-size: 13px; font-weight: 600; }
`

function PlanTab({ ramos, onIniciarPlan }) {
  const [ramoExpandido, setRamoExpandido] = useState(null)
  const [evalSinMaterial, setEvalSinMaterial] = useState(null)

  const ramoActivo = ramoExpandido ? ramos.find(r => r.id === ramoExpandido) : null
  const evalsActivo = ramoActivo ? (ramoActivo.evaluaciones || []) : []

  return (
    <>
      <style>{PQ_CSS}</style>
      <div className="pq-root">
        <div className="pq-hero">
          <h1><span className="pq-brain">🧠</span> Plan IA</h1>
          <p className="pq-hero-sub">Sube tu material y la IA genera un <strong>plan de estudio personalizado</strong> para cada evaluación, con tareas repartidas en tu horario libre.</p>
        </div>

        <div className="pq-section">
          {ramos.length === 0 ? (
            <div className="pq-empty">
              <div className="pq-empty-emoji">📚</div>
              <div className="pq-empty-txt">Aún no tienes ramos</div>
              <div className="pq-empty-sub">Agrega ramos primero para generar planes de estudio</div>
            </div>
          ) : (
            <>
              <div className="pq-section-title"><h4>🎯 Elige un ramo</h4></div>
              <div className="pq-grid">
                {ramos.map((r, i) => {
                  const accent = HOME_ACCENTS[i % HOME_ACCENTS.length]
                  const active = ramoExpandido === r.id
                  return (
                    <div key={r.id} className={`pq-ramo ${accent} ${active ? 'active' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}
                      onClick={() => setRamoExpandido(active ? null : r.id)}>
                      <div className="pq-ramo-title">{r.nombre}</div>
                      <div className="pq-ramo-count">{(r.evaluaciones || []).length} {(r.evaluaciones || []).length === 1 ? 'eval' : 'evals'}</div>
                    </div>
                  )
                })}
              </div>

              {ramoActivo && (
                <div className="pq-evals-panel">
                  <div className="pq-evals-header">📋 Evaluaciones de <span className="pq-evals-ramo">{ramoActivo.nombre}</span></div>
                  {evalsActivo.length === 0 ? (
                    <div className="pq-evals-empty">Este ramo aún no tiene evaluaciones</div>
                  ) : (
                    evalsActivo.map(ev => (
                      <div key={ev.id} className="pq-eval" onClick={() => {
                        const tieneMaterial = (ev.archivos && ev.archivos.length > 0) || ev.texto_material
                        if (!tieneMaterial) { setEvalSinMaterial({ ramo: ramoActivo, ev }); return }
                        onIniciarPlan(ramoActivo, ev)
                      }}>
                        <div className="pq-eval-info">
                          <div className="pq-eval-nombre">{ev.nombre}</div>
                          <div className="pq-eval-meta">
                            {ev.plan_estudio ? <span className="ok">✅ Plan generado</span> : <span>📋 Sin plan aún</span>}
                            <span className="sep">·</span>
                            <span>{ev.tipo || 'Evaluación'}</span>
                          </div>
                        </div>
                        <span className="pq-eval-arrow">🧠</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {evalSinMaterial && (
          <div className="pq-modal-backdrop" onClick={() => setEvalSinMaterial(null)}>
            <div className="pq-modal" onClick={e => e.stopPropagation()}>
              <div className="pq-modal-emoji">📭</div>
              <h3 className="pq-modal-title">Sin material de estudio</h3>
              <p className="pq-modal-desc"><strong>{evalSinMaterial.ev.nombre}</strong> no tiene archivos cargados. Debes subir material para generar el plan.</p>
              <label className="pq-modal-upload">
                📎 Subir material
                <input type="file" accept=".pdf,.docx,.doc,.txt,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.mp4,.mov" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const fd = new FormData()
                  fd.append('archivo', file)
                  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
                  const r = await fetch(`${API}/evaluaciones/${evalSinMaterial.ev.id}/archivos`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: fd
                  })
                  if (r.ok) {
                    alert('✅ Material subido. Ahora puedes generar el plan.')
                    onIniciarPlan(evalSinMaterial.ramo, { ...evalSinMaterial.ev, archivos: [{ nombre: file.name }] })
                    setEvalSinMaterial(null)
                  } else {
                    alert('❌ Error al subir el archivo.')
                  }
                }} />
              </label>
              <button className="pq-modal-cancel" onClick={() => setEvalSinMaterial(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function QuizTab({ ramos, onIniciarQuiz }) {
  const [historial, setHistorial] = useState([])
  const [ramoExpandido, setRamoExpandido] = useState(null)
  const [evalSinMaterial, setEvalSinMaterial] = useState(null)
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const getToken = () => localStorage.getItem('token')

  useEffect(() => {
    fetch(`${API}/quiz/historial`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setHistorial(data))
      .catch(() => {})
  }, [])

  const ramoActivo = ramoExpandido ? ramos.find(r => r.id === ramoExpandido) : null
  const evalsActivo = ramoActivo ? (ramoActivo.evaluaciones || []) : []

  return (
    <>
      <style>{PQ_CSS}</style>
      <div className="pq-root">
        <div className="pq-hero">
          <h1><span className="pq-bolt">⚡</span> Quiz Rápido</h1>
          <p className="pq-hero-sub">Practica con <strong>20 preguntas</strong> generadas desde tu propio material — perfecto para repasar justo antes de una evaluación.</p>
        </div>

        <div className="pq-section">
          {ramos.length === 0 ? (
            <div className="pq-empty">
              <div className="pq-empty-emoji">📚</div>
              <div className="pq-empty-txt">Aún no tienes ramos</div>
              <div className="pq-empty-sub">Agrega ramos primero para poder hacer quiz</div>
            </div>
          ) : (
            <>
              <div className="pq-section-title"><h4>🎯 Elige un ramo</h4></div>
              <div className="pq-grid">
                {ramos.map((r, i) => {
                  const accent = HOME_ACCENTS[i % HOME_ACCENTS.length]
                  const active = ramoExpandido === r.id
                  return (
                    <div key={r.id} className={`pq-ramo ${accent} ${active ? 'active' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}
                      onClick={() => setRamoExpandido(active ? null : r.id)}>
                      <div className="pq-ramo-title">{r.nombre}</div>
                      <div className="pq-ramo-count">{(r.evaluaciones || []).length} {(r.evaluaciones || []).length === 1 ? 'eval' : 'evals'}</div>
                    </div>
                  )
                })}
              </div>

              {ramoActivo && (
                <div className="pq-evals-panel">
                  <div className="pq-evals-header">📋 Evaluaciones de <span className="pq-evals-ramo">{ramoActivo.nombre}</span></div>
                  {evalsActivo.length === 0 ? (
                    <div className="pq-evals-empty">Este ramo aún no tiene evaluaciones</div>
                  ) : (
                    evalsActivo.map(ev => (
                      <div key={ev.id} className="pq-eval" onClick={() => {
                        const tieneArchivos = ev.archivos && ev.archivos.length > 0
                        const tieneMaterial = tieneArchivos || ev.texto_material
                        if (!tieneMaterial) { setEvalSinMaterial({ ramo: ramoActivo, ev }); return }
                        onIniciarQuiz(ramoActivo, ev)
                      }}>
                        <div className="pq-eval-info">
                          <div className="pq-eval-nombre">{ev.nombre}</div>
                          <div className="pq-eval-meta">
                            <span>{ev.tipo || 'Evaluación'}</span>
                          </div>
                        </div>
                        <span className="pq-eval-arrow">⚡</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Historial */}
        <div className="pq-section">
          <div className="pq-section-title"><h4>📋 Historial de quizzes</h4></div>
          {historial.length === 0 ? (
            <div className="pq-hist-empty">Aún no has hecho ningún quiz</div>
          ) : (
            <div className="pq-hist">
              {historial.map(h => {
                const clase = h.porcentaje >= 70 ? 'ok' : h.porcentaje >= 50 ? 'warn' : 'risk'
                const emoji = h.porcentaje >= 70 ? '🎉' : h.porcentaje >= 50 ? '😅' : '📚'
                const fecha = new Date(h.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                return (
                  <div key={h.id} className={`pq-hist-item ${clase}`}>
                    <div className="pq-hist-info">
                      <div className="pq-hist-name">{emoji} {h.ramo_nombre}</div>
                      <div className="pq-hist-meta">{fecha} · {h.puntaje}/{h.total} correctas</div>
                    </div>
                    <div className="pq-hist-pct">{h.porcentaje}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {evalSinMaterial && (
          <div className="pq-modal-backdrop" onClick={() => setEvalSinMaterial(null)}>
            <div className="pq-modal" onClick={e => e.stopPropagation()}>
              <div className="pq-modal-emoji">📭</div>
              <h3 className="pq-modal-title">Sin material de estudio</h3>
              <p className="pq-modal-desc"><strong>{evalSinMaterial.ev.nombre}</strong> no tiene archivos cargados. Debes subir material para poder generar el quiz.</p>
              <label className="pq-modal-upload">
                📎 Subir material
                <input type="file" accept=".pdf,.docx,.doc,.txt,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.mp4,.mov" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const fd = new FormData()
                  fd.append('archivo', file)
                  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
                  const r = await fetch(`${API}/evaluaciones/${evalSinMaterial.ev.id}/archivos`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: fd
                  })
                  if (r.ok) {
                    alert('✅ Material subido correctamente. Ahora puedes generar el quiz.')
                    onIniciarQuiz(evalSinMaterial.ramo, { ...evalSinMaterial.ev, archivos: [{ nombre: file.name }] })
                    setEvalSinMaterial(null)
                  } else {
                    alert('❌ Error al subir el archivo. Intenta de nuevo.')
                  }
                }} />
              </label>
              <button className="pq-modal-cancel" onClick={() => setEvalSinMaterial(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ============================================================
// PERFIL TAB
// ============================================================
const PERFIL_CSS = `
  .perfil-root { background: transparent; padding: 0 0 120px; min-height: 100vh; }
  .perfil-hero { padding: 56px 20px 8px; text-align: center; }
  .perfil-hero-emoji { display: inline-block; font-size: 40px; animation: perfilBounce 3.2s ease-in-out infinite; transform-origin: center bottom; margin-bottom: 6px; filter: drop-shadow(0 4px 12px var(--shadow-color)); }
  @keyframes perfilBounce { 0%, 70%, 100% { transform: translateY(0) scale(1); } 15% { transform: translateY(-8px) scale(1.05); } 30% { transform: translateY(0) scale(1); } 45% { transform: translateY(-4px) scale(1.02); } 55% { transform: translateY(0) scale(1); } }
  .perfil-hero h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.035em; line-height: 1; margin: 0 0 4px; color: var(--color-text); }
  .perfil-hero-sub { font-size: 13px; color: var(--color-text-muted); font-weight: 600; margin: 0; }

  .perfil-avatar-block { text-align: center; padding: 20px 20px 8px; animation: perfilIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes perfilIn { from { opacity: 0; transform: translateY(8px); } }
  .perfil-avatar { width: 92px; height: 92px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; color: #fff; margin: 0 auto 14px; box-shadow: 0 14px 36px var(--shadow-color), inset 0 1px 0 rgba(255,255,255,0.3); animation: perfilAvatarFloat 5s ease-in-out infinite; }
  @keyframes perfilAvatarFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .perfil-nombre { font-size: 22px; font-weight: 900; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.02em; }
  .perfil-email { font-size: 13px; color: var(--color-text-muted); margin: 0; font-weight: 600; }
  .perfil-fundador { display: inline-flex; align-items: center; gap: 6px; background: rgba(201,168,76,0.2); border: 1px solid rgba(201,168,76,0.45); border-radius: 999px; padding: 5px 12px; font-size: 12px; color: #C9A84C; font-weight: 800; margin-top: 12px; letter-spacing: 0.02em; }

  .perfil-section { padding: 28px 20px 0; }
  .perfil-section-title { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 12px; }

  .perfil-info { display: flex; flex-direction: column; gap: 8px; }
  .perfil-info-item { position: relative; display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--color-primary); border-radius: 14px; overflow: hidden; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s; }
  .perfil-info-item:hover { border-color: rgba(255,255,255,0.18); transform: translateX(2px); }
  .perfil-info-icon { font-size: 22px; flex-shrink: 0; filter: drop-shadow(0 0 8px var(--shadow-color)); }
  .perfil-info-content { flex: 1; min-width: 0; }
  .perfil-info-label { font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 2px; }
  .perfil-info-value { font-size: 14px; font-weight: 800; color: var(--color-text); margin: 0; letter-spacing: -0.01em; }

  .perfil-btn { width: 100%; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; color: var(--color-text); font-size: 14px; font-weight: 700; cursor: pointer; text-align: left; font-family: inherit; transition: background 0.2s, border-color 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); box-sizing: border-box; margin-bottom: 8px; }
  .perfil-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); transform: translateX(3px); }
  .perfil-btn-icon { font-size: 20px; }
  .perfil-btn-arrow { margin-left: auto; opacity: 0.4; font-size: 14px; transition: opacity 0.2s, transform 0.2s; }
  .perfil-btn:hover .perfil-btn-arrow { opacity: 0.9; transform: translateX(2px); }
  .perfil-btn.logout { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.22); color: #f87171; }
  .perfil-btn.logout:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.4); }
`

function PerfilTab({ usuario, onLogout, onUniversidad, esFundador, numeroRegistro }) {
  const uni = usuario?.universidad || ''
  const uniLabel = uni === 'ufro' ? 'UFRO' : uni === 'umayor' ? 'U. Mayor' : uni === 'uautonoma' ? 'U. Autónoma' : uni === 'inacap' ? 'INACAP' : uni === 'santotomas' ? 'Santo Tomás' : uni === 'uctemuco' ? 'UC Temuco' : uni ? uni.toUpperCase() : 'Sin universidad'
  const inicial = (usuario?.nombre || usuario?.name || 'U')[0].toUpperCase()

  return (
    <>
      <style>{PERFIL_CSS}</style>
      <div className="perfil-root">
        {/* HERO */}
        <div className="perfil-hero">
          <div className="perfil-hero-emoji">👤</div>
          <h1>Mi Perfil</h1>
          <p className="perfil-hero-sub">Tu cuenta en Apprueba</p>
        </div>

        {/* AVATAR */}
        <div className="perfil-avatar-block">
          <div className="perfil-avatar">{inicial}</div>
          <div className="perfil-nombre">{usuario?.nombre || usuario?.name || 'Estudiante'}</div>
          <div className="perfil-email">{usuario?.email}</div>
          {esFundador && (
            <div className="perfil-fundador">🏅 Fundador #{numeroRegistro}</div>
          )}
        </div>

        {/* INFO */}
        <div className="perfil-section">
          <h4 className="perfil-section-title">📋 Tu información</h4>
          <div className="perfil-info">
            <div className="perfil-info-item">
              <span className="perfil-info-icon">🎓</span>
              <div className="perfil-info-content">
                <div className="perfil-info-label">Universidad</div>
                <div className="perfil-info-value">{uniLabel}</div>
              </div>
            </div>
            <div className="perfil-info-item">
              <span className="perfil-info-icon">📅</span>
              <div className="perfil-info-content">
                <div className="perfil-info-label">Miembro desde</div>
                <div className="perfil-info-value">{usuario?.created_at ? new Date(usuario.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="perfil-section">
          <h4 className="perfil-section-title">⚙️ Ajustes</h4>
          <button className="perfil-btn" onClick={() => onUniversidad('cambiar')}>
            <span className="perfil-btn-icon">🏫</span>
            <span>Cambiar universidad</span>
            <span className="perfil-btn-arrow">→</span>
          </button>
          <button className="perfil-btn logout" onClick={onLogout}>
            <span className="perfil-btn-icon">🚪</span>
            <span>Cerrar sesión</span>
            <span className="perfil-btn-arrow">→</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ============================================================
// BOTTOM NAV
// ============================================================
const NAV_CSS = `
  .nav-root { position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; height: 90px; background: color-mix(in srgb, var(--bg-primary) 70%, transparent); backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%); border-top: 1px solid rgba(255,255,255,0.08); display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; padding: 10px 8px 22px; box-sizing: border-box; }
  .nav-item { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); min-width: 0; }
  .nav-item:active { transform: scale(0.9); }
  .nav-icon-bg { display: grid; place-items: center; width: 54px; height: 34px; border-radius: 999px; font-size: 22px; line-height: 1; transition: background 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s; }
  .nav-label { font-size: 11px; font-weight: 700; letter-spacing: 0.01em; color: var(--color-text-muted); transition: color 0.3s, font-weight 0.3s; white-space: nowrap; }
  .nav-item.active .nav-icon-bg { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); box-shadow: 0 8px 20px -4px var(--shadow-color), inset 0 1px 0 rgba(255,255,255,0.22); transform: translateY(-2px); }
  .nav-item.active .nav-label { color: var(--color-primary); font-weight: 900; }
`

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const tabs = [
    { path: '/home', icon: '🏠', label: 'Inicio' },
    { path: '/ramos', icon: '📚', label: 'Ramos' },
    { path: '/plan', icon: '🧠', label: 'Plan IA' },
    { path: '/quiz', icon: '⚡', label: 'Quiz' },
    { path: '/horario', icon: '🗓', label: 'Horario' },
    { path: '/perfil', icon: '👤', label: 'Perfil' },
  ]
  return (
    <>
      <style>{NAV_CSS}</style>
      <div className="nav-root">
        {tabs.map(t => {
          const activo = location.pathname === t.path
                       || (t.path === '/ramos' && location.pathname.startsWith('/ramos/'))
          return (
            <button key={t.path} onClick={() => navigate(t.path)} className={`nav-item ${activo ? 'active' : ''}`}>
              <div className="nav-icon-bg">{t.icon}</div>
              <div className="nav-label">{t.label}</div>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ============================================================
// APP HEADER
// ============================================================
function AppHeader({ usuario, esFundador, numeroRegistro, evalProximas3dias, onNotif, onPerfil, onAdmin, onLogout }) {
  const uni = usuario?.universidad || ''
  const uniLabel = uni === 'ufro' ? 'UFRO' : uni === 'uchile' ? 'U. Chile' : uni === 'puc' ? 'PUC' : uni === 'usach' ? 'USACH' : uni ? uni.toUpperCase() : null
  const inicial = (usuario?.nombre || usuario?.name || 'U')[0].toUpperCase()

  return (
    <div style={{
      
      background: 'var(--bg-header)',
      padding: '48px 20px 16px',
      boxShadow: '0 2px 12px rgba(0,48,135,0.15)',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>APPrueba</span>
            {uniLabel && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 8px', borderRadius: 20 }}>{uniLabel}</span>
            )}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            Hola, {usuario?.nombre?.split(' ')[0] || usuario?.name?.split(' ')[0] || 'estudiante'} 👋
          </p>
          {esFundador && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,0.25)', border: '1px solid rgba(201,168,76,0.5)', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#C9A84C', fontWeight: 700, marginTop: 4 }}>
              🏅 Fundador #{numeroRegistro}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {usuario?.email === 'abelespinozav@gmail.com' && (
            <button onClick={onAdmin} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
          )}
          <button onClick={onNotif} style={{ position: 'relative', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🔔
            {evalProximas3dias > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, background: '#f87171', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{evalProximas3dias}</span>
            )}
          </button>
          <div onClick={onPerfil} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
            {inicial}
          </div>
        </div>
      </div>
    </div>
  )
}

function calcular(evaluaciones, min, ramo) {
  const evs = evaluaciones.map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0, nota: (e.nota !== null && e.nota !== undefined && e.nota !== '') ? parseFloat(e.nota) : null }))
  const pendientes = evs.filter(e => e.nota === null)
  const completadas = evs.filter(e => e.nota !== null)
  const pesoTotal = evs.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoCompletado = completadas.reduce((acc, e) => acc + e.ponderacion, 0)
  const pesoCompleto = Math.abs(pesoTotal - 100) < 0.01

  if (pendientes.length === 0 && completadas.length === 0) return { promedio: null, necesaria: null, necesariaExamen: null, estado: null, pendientesCount: 0, pesoCompleto: false, pesoTotal, eximido: false }

  const ponderacionExamen = ramo?.ponderacion_examen ? parseFloat(ramo.ponderacion_examen) / 100 : 0.25
  const ponderacionSemestre = 1 - ponderacionExamen
  const notaEximicion = ramo?.nota_eximicion ? parseFloat(ramo.nota_eximicion) : null
  const sinRojos = ramo?.sin_rojos || false
  const notaExamenGuardada = (ramo?.nota_examen !== null && ramo?.nota_examen !== undefined && ramo?.nota_examen !== '') ? parseFloat(ramo.nota_examen) : null

  if (pendientes.length === 0) {
    // Promedio ponderado real: sum(nota*pond) / sum(pond). Robusto aunque
    // pesoTotal != 100 (ponderaciones mal cargadas o incompletas).
    const promedio = pesoCompletado > 0 ? completadas.reduce((acc, e) => acc + e.nota * e.ponderacion, 0) / pesoCompletado : 0
    const tieneRojos = completadas.some(e => e.nota < 4.0)

    // Si hay nota_examen guardada → recompute nota final fresh (no cacheada).
    // Esto corrige el bug donde editar notas después de rendir examen dejaba
    // el promedio stale en el ramo.nota_final del INSERT anterior.
    if (notaExamenGuardada !== null) {
      const notaFinal = promedio * ponderacionSemestre + notaExamenGuardada * ponderacionExamen
      const aprobado = notaFinal >= parseFloat(min)
      return { promedio: notaFinal, necesaria: null, necesariaExamen: null, estado: aprobado ? 'aprobado' : 'reprobado_sin_examen', pendientesCount: 0, pesoCompleto, pesoTotal, eximido: false, tieneRojos }
    }

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

  const pesoPendiente = pendientes.reduce((acc, e) => acc + e.ponderacion, 0)
  const puntajeActual = completadas.reduce((acc, e) => acc + e.nota * (e.ponderacion / 100), 0)
  const promedioActual = pesoCompletado > 0 ? (puntajeActual / (pesoCompletado / 100)) : null
  const necesariaRaw = pesoPendiente > 0 ? ((parseFloat(min) * pesoTotal / 100 - puntajeActual) / (pesoPendiente / 100)) : null
  const necesaria = necesariaRaw
  const estadoPendiente = pesoCompleto && necesariaRaw !== null && necesariaRaw > 7 ? 'imposible'
                        : pesoCompleto && necesariaRaw !== null && necesariaRaw < 0 ? 'aprobado'
                        : null
  return { promedio: promedioActual, necesaria, necesariaExamen: null, estado: estadoPendiente, pendientesCount: pendientes.length, pesoCompleto, pesoTotal, eximido: false }
}

function notaColor(nota) {
  if (nota === null || nota === undefined) return 'var(--color-secondary)'
  if (nota >= 5.5) return '#4ade80'
  if (nota >= 4.0) return '#fbbf24'
  return '#f87171'
}

function LoginScreen({ onLogin }) {
  const urlParams = new URLSearchParams(window.location.search)
  const errorParam = urlParams.get('error')
  const [spots, setSpots] = useState(null)
  useEffect(() => {
    fetch(API + '/fundadores/spots').then(r => r.json()).then(d => setSpots(d)).catch(() => {})
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <BackgroundOrbs />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'slideUp 0.6s ease' }}>
        <img src="/icon-512.png" alt="APPrueba" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16, display: 'block', margin: '0 auto 16px', animation: 'float 1.2s cubic-bezier(0.36,0.07,0.19,0.97) infinite' }} />
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: '0 0 8px', background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>APPrueba</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: '0 0 48px' }}>Estudia Inteligente</p>
        {errorParam === 'lista_espera' && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>😔 Los 50 cupos fundadores están ocupados</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Pronto abriremos nuevos puestos. ¡Vuelve pronto!</p>
        </div>
      )}
      {spots && !spots.lleno && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#a5b4fc', fontWeight: 600 }}>
            🏅 {spots.quedan} de 50 fundadores disponibles
          </span>
        </div>
      )}
      <button onClick={onLogin} style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', color: 'white', border: 'none', borderRadius: 16, padding: '16px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto', boxShadow: '0 8px 32px var(--shadow-color)' }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.9C9.8 39.8 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24 }}>Guarda tu progreso académico de forma segura</p>
      </div>
    </div>
  )
}



const HORARIO_CSS = `
  .hor-root { background: transparent; padding: 0 0 120px; min-height: 100vh; }
  .hor-hero { padding: 56px 20px 8px; max-width: 700px; margin: 0 auto; }
  .hor-hero h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.035em; line-height: 1; margin: 0 0 6px; color: var(--color-text); }
  .hor-hero-sub { font-size: 13px; color: var(--color-text-muted); font-weight: 600; margin: 0; }
  .hor-emoji { display: inline-block; animation: horCal 3.4s ease-in-out infinite; transform-origin: 50% 60%; }
  @keyframes horCal { 0%, 70%, 100% { transform: rotate(0) scale(1); } 15% { transform: rotate(-10deg) scale(1.06); } 30% { transform: rotate(0) scale(1); } 45% { transform: rotate(10deg) scale(1.06); } 55% { transform: rotate(0) scale(1); } }

  .hor-container { max-width: 700px; margin: 0 auto; padding: 0 20px; }
  .hor-section { margin-top: 24px; }
  .hor-section-title { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 12px; }

  .hor-msg { background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--color-primary); border-radius: 14px; padding: 12px 16px; margin-top: 14px; font-size: 13px; color: var(--color-text); animation: horIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); font-weight: 600; }
  @keyframes horIn { from { opacity: 0; transform: translateY(-4px); } }

  .hor-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
  .hor-btn { width: 100%; padding: 12px 14px; border-radius: 14px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s, border-color 0.2s, transform 0.2s, filter 0.2s; box-sizing: border-box; letter-spacing: 0.01em; }
  .hor-btn-primary { background: var(--color-primary); color: #1a1a1a; border: none; font-weight: 900; }
  .hor-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
  .hor-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .hor-btn-glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); color: var(--color-text); }
  .hor-btn-glass:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
  .hor-btn-danger { background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22); color: #f87171; }
  .hor-btn-danger:hover { background: rgba(239,68,68,0.14); }

  .hor-import { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 12px 16px; cursor: pointer; transition: background 0.2s, border-color 0.2s; }
  .hor-import:hover { background: rgba(255,255,255,0.06); border-color: var(--color-primary); }
  .hor-import-icon { font-size: 22px; }
  .hor-import-txt { flex: 1; text-align: center; }
  .hor-import-title { font-size: 13px; font-weight: 800; color: var(--color-text); margin: 0 0 2px; }
  .hor-import-sub { font-size: 11px; color: var(--color-text-muted); margin: 0; font-weight: 600; }

  .hor-tip-ufro { background: rgba(46,125,209,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(46,125,209,0.25); border-left: 3px solid #60a5fa; border-radius: 14px; padding: 14px 16px; margin-top: 14px; }
  .hor-tip-ufro-title { font-size: 10px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: #60a5fa; margin: 0 0 8px; }
  .hor-tip-ufro-desc { font-size: 12px; color: var(--color-text-muted); line-height: 1.5; margin: 0 0 10px; font-weight: 600; }
  .hor-tip-ufro-steps { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; font-weight: 600; }
  .hor-tip-ufro-steps strong { color: var(--color-text); font-weight: 800; }
  .hor-tip-ufro-link { display: inline-block; background: rgba(46,125,209,0.18); border: 1px solid rgba(46,125,209,0.4); border-radius: 10px; padding: 7px 14px; color: #60a5fa; font-size: 12px; font-weight: 800; text-decoration: none; letter-spacing: 0.02em; transition: background 0.2s, transform 0.2s; }
  .hor-tip-ufro-link:hover { background: rgba(46,125,209,0.28); transform: translateX(2px); }

  .hor-preview { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--color-primary); border-radius: 18px; padding: 18px; margin-top: 18px; animation: horIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .hor-preview-title { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-primary); margin: 0 0 14px; }
  .hor-preview-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; margin-bottom: 14px; }
  .hor-preview-actions { display: flex; gap: 8px; }

  .hor-block { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--tipo-color, var(--color-primary)); border-radius: 12px; padding: 10px 14px; cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .hor-block:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.18); transform: translateX(2px); }
  .hor-block-hora { font-size: 11px; color: var(--color-text-muted); min-width: 88px; font-weight: 800; letter-spacing: 0.04em; }
  .hor-block-info { flex: 1; min-width: 0; }
  .hor-block-name { font-size: 13px; font-weight: 800; color: var(--color-text); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hor-block-meta { font-size: 11px; color: var(--color-text-muted); margin-top: 1px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hor-block-tipo { font-size: 10px; color: var(--tipo-color, var(--color-primary)); font-weight: 800; letter-spacing: 0.04em; }
  .hor-block-del { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 15px; padding: 4px; transition: color 0.2s; font-family: inherit; }
  .hor-block-del:hover { color: #f87171; }

  .hor-dia-label { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 8px; }
  .hor-dia-bloque { margin-bottom: 16px; }
  .hor-dia-lista { display: flex; flex-direction: column; gap: 6px; }

  .hor-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
  .hor-toolbar-title { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; }
  .hor-toolbar-switch { display: flex; gap: 2px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 3px; }
  .hor-toolbar-switch button { padding: 5px 12px; border-radius: 8px; border: none; background: transparent; color: var(--color-text-muted); font-size: 13px; cursor: pointer; font-family: inherit; transition: background 0.2s, color 0.2s; }
  .hor-toolbar-switch button.on { background: rgba(255,255,255,0.1); color: var(--color-text); }
  .hor-legend { display: flex; gap: 10px; flex-wrap: wrap; }
  .hor-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--color-text-muted); font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
  .hor-legend-dot { width: 8px; height: 8px; border-radius: 2px; background: var(--tipo-color, var(--color-primary)); }

  .hor-grid-wrap { overflow-x: auto; background: rgba(255,255,255,0.02); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 8px; scrollbar-width: none; }
  .hor-grid-wrap::-webkit-scrollbar { display: none; }
  .hor-grid-hora { font-size: 9px; color: var(--color-text-muted); font-weight: 800; text-align: right; padding-right: 6px; }
  .hor-grid-dia { font-size: 11px; font-weight: 900; color: var(--color-text-muted); text-align: center; letter-spacing: 0.1em; text-transform: uppercase; }
  .hor-grid-bloque { position: absolute; border-radius: 8px; background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.12); border-left: 3px solid var(--tipo-color, var(--color-primary)); padding: 4px 6px; overflow: hidden; cursor: pointer; transition: background 0.2s, border-color 0.2s; }
  .hor-grid-bloque:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); }
  .hor-grid-bloque-name { font-size: 9px; font-weight: 900; color: var(--color-text); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hor-grid-bloque-hora { font-size: 8px; color: var(--color-text-muted); margin-top: 1px; font-weight: 700; }
  .hor-grid-bloque-sala { font-size: 8px; color: var(--color-text-muted); margin-top: 1px; font-weight: 600; opacity: 0.8; }

  .hor-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: horModalBd 0.2s ease; }
  @keyframes horModalBd { from { opacity: 0; } }
  .hor-modal { background: rgba(22,22,34,0.88); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.1); border-left: 3px solid var(--color-primary); border-radius: 22px; padding: 24px; width: 100%; max-width: 380px; box-sizing: border-box; animation: horModalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); max-height: 90vh; overflow-y: auto; }
  @keyframes horModalIn { from { opacity: 0; transform: translateY(12px) scale(0.96); } }
  .hor-modal-tag { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-primary); margin: 0 0 4px; }
  .hor-modal-title { font-size: 18px; font-weight: 900; color: var(--color-text); margin: 0 0 16px; letter-spacing: -0.02em; }
  .hor-modal-fields { display: flex; flex-direction: column; gap: 10px; }
  .hor-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px 13px; color: var(--color-text); font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.2s, background 0.2s; box-sizing: border-box; width: 100%; }
  .hor-input:focus { border-color: var(--color-primary); background: rgba(255,255,255,0.09); }
  .hor-input::placeholder { color: var(--color-text-muted); opacity: 0.6; }
  .hor-input-row { display: flex; gap: 8px; }
  .hor-input-row > input { flex: 1; min-width: 0; }
  .hor-tipo-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .hor-tipo-chip { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: var(--color-text-muted); font-size: 12px; cursor: pointer; font-weight: 700; font-family: inherit; transition: all 0.2s; letter-spacing: 0.02em; }
  .hor-tipo-chip:hover { border-color: rgba(255,255,255,0.25); }
  .hor-tipo-chip.on { color: var(--tipo-color, var(--color-primary)); border-color: var(--tipo-color, var(--color-primary)); background: color-mix(in srgb, var(--tipo-color, var(--color-primary)) 15%, transparent); }
  .hor-modal-danger { width: 100%; margin-top: 14px; padding: 11px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.28); border-radius: 12px; color: #f87171; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; transition: background 0.2s; letter-spacing: 0.01em; }
  .hor-modal-danger:hover { background: rgba(239,68,68,0.15); }
  .hor-modal-actions { display: flex; gap: 8px; margin-top: 12px; }
  .hor-modal-cancel { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px; color: var(--color-text-muted); font-size: 14px; cursor: pointer; font-family: inherit; font-weight: 700; transition: background 0.2s; }
  .hor-modal-cancel:hover { background: rgba(255,255,255,0.09); }
  .hor-modal-submit { flex: 2; background: var(--color-primary); color: #1a1a1a; border: none; border-radius: 12px; padding: 11px; font-size: 14px; font-weight: 900; cursor: pointer; font-family: inherit; transition: filter 0.2s; }
  .hor-modal-submit:hover:not(:disabled) { filter: brightness(1.08); }
  .hor-modal-submit:disabled { opacity: 0.4; cursor: not-allowed; }
`

function HorarioScreen({ usuario, onBack, API, authHeaders }) {
  const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const TIPOS = [
    { value: 'clase', label: 'Clase', color: 'var(--color-primary)' },
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
  const [vistaGrid, setVistaGrid] = useState(true)
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
        setMensaje('❌ No se pudo leer el horario automáticamente. ¡No te preocupes! Puedes agregarlo manualmente tocando ➕ Agregar bloque.')
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
    if (editandoBloque._nuevo) { await guardarNuevoBloque(); return }
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

  const abrirNuevoBloque = (dia, hora, horaFin) => {
    setFormBloque({ ramo_nombre: '', codigo: '', sala: '', tipo: 'clase', dia: dia || 'Lunes', hora_inicio: hora || '', hora_fin: horaFin || '' })
    setEditandoBloque({ id: null, _nuevo: true })
  }

  const guardarNuevoBloque = async () => {
    setGuardando(true)
    await fetch(API + '/horario', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formBloque)
    })
    await fetch(API + '/horario/sincronizar-ramos', { method: 'POST', headers: authHeaders() })
    await cargar()
    window.dispatchEvent(new Event('ramos-actualizados'))
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

  const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  const diasConClases = horario.length > 0
    ? [...new Set([...DIAS_SEMANA, ...horario.map(h => h.dia)])].sort((a,b) => DIAS_ORDEN.indexOf(a) - DIAS_ORDEN.indexOf(b))
    : DIAS_SEMANA

  const getTipoColor = (tipo) => TIPOS.find(t => t.value === tipo)?.color || 'var(--color-primary)'

  return (
    <>
      <style>{HORARIO_CSS}</style>
      <div className="hor-root">
        <div className="hor-hero">
          <h1><span className="hor-emoji">📅</span> Mi Horario</h1>
          <p className="hor-hero-sub">Organiza tus clases, ayudantías y pruebas por semana</p>
        </div>

        <div className="hor-container">
          {mensaje && <div className="hor-msg">{mensaje}</div>}

          <div className="hor-actions">
            {horario.length > 0 && (
              <button className="hor-btn hor-btn-danger" onClick={borrarHorario}>
                🗑️ Borrar horario completo
              </button>
            )}
            <button className="hor-btn hor-btn-glass" onClick={() => abrirNuevoBloque('Lunes', '')}>
              ➕ Agregar bloque manualmente
            </button>
            <div className="hor-import" onClick={() => inputRef.current.click()}>
              <span className="hor-import-icon">{extrayendo ? '⏳' : '📸'}</span>
              <div className="hor-import-txt">
                <div className="hor-import-title">{extrayendo ? 'Analizando...' : 'Importar desde foto, PDF o Excel'}</div>
                <div className="hor-import-sub">La IA detecta tus ramos automáticamente</div>
              </div>
              <input ref={inputRef} type="file" accept="image/*,.pdf,.xls,.xlsx" style={{ display: 'none' }} onChange={handleImagen} />
            </div>
          </div>

          {usuario?.universidad === 'ufro' && horario.length === 0 && (
            <div className="hor-tip-ufro">
              <div className="hor-tip-ufro-title">🎓 Tip para estudiantes UFRO</div>
              <p className="hor-tip-ufro-desc">Descarga tu horario en Excel desde la Intranet para importarlo automáticamente:</p>
              <div className="hor-tip-ufro-steps">
                <span>1️⃣ Intranet → Alumno → Horarios</span>
                <span>2️⃣ Haz clic en <strong>Exportar a Excel</strong></span>
                <span>3️⃣ Sube el archivo .xls aquí arriba ⬆️</span>
              </div>
              <a href="https://intranet.ufro.cl/alumno/ver_horario.php" target="_blank" rel="noopener noreferrer" className="hor-tip-ufro-link">
                🔗 Ir a Intranet UFRO →
              </a>
            </div>
          )}

          {bloquesPreview && (
            <div className="hor-preview">
              <div className="hor-preview-title">✨ Bloques detectados ({bloquesPreview.length})</div>
              <div className="hor-preview-list">
                {bloquesPreview.map((b, i) => (
                  <div key={i} className="hor-block" style={{ '--tipo-color': getTipoColor(b.tipo), cursor: 'default' }}>
                    <div className="hor-block-info">
                      <div className="hor-block-name">{b.ramo_nombre}</div>
                      <div className="hor-block-meta">{b.dia} · {b.hora_inicio}–{b.hora_fin} {b.sala ? '· ' + b.sala : ''}</div>
                    </div>
                    <div className="hor-block-tipo">{TIPOS.find(t=>t.value===b.tipo)?.label}</div>
                  </div>
                ))}
              </div>
              <div className="hor-preview-actions">
                <button className="hor-btn hor-btn-glass" style={{ flex: 1 }} onClick={() => setBloquesPreview(null)}>Cancelar</button>
                <button className="hor-btn hor-btn-primary" style={{ flex: 2 }} disabled={guardando} onClick={confirmarHorario}>
                  {guardando ? 'Guardando...' : '✅ Confirmar y guardar'}
                </button>
              </div>
            </div>
          )}

          {!bloquesPreview && (
            <div className="hor-section">
              <div className="hor-toolbar">
                <h4 className="hor-toolbar-title">{horario.length > 0 ? '🗓 Tu horario actual' : 'Toca cualquier celda para agregar'}</h4>
                <div className="hor-toolbar-switch">
                  <button className={!vistaGrid ? 'on' : ''} onClick={() => setVistaGrid(false)}>☰</button>
                  <button className={vistaGrid ? 'on' : ''} onClick={() => setVistaGrid(true)}>⊞</button>
                </div>
                <div className="hor-legend">
                  {TIPOS.map(t => (
                    <div key={t.value} className="hor-legend-item" style={{ '--tipo-color': t.color }}>
                      <span className="hor-legend-dot" />
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>

              {!vistaGrid ? (
                diasConClases.map(dia => (
                  <div key={dia} className="hor-dia-bloque">
                    <div className="hor-dia-label">{dia}</div>
                    <div className="hor-dia-lista">
                      {horario.filter(h => h.dia === dia).sort((a,b) => (a.hora_inicio||'').localeCompare(b.hora_inicio||'')).map(h => (
                        <div key={h.id} className="hor-block" style={{ '--tipo-color': getTipoColor(h.tipo) }} onClick={() => abrirEditar(h)}>
                          <div className="hor-block-hora">{h.hora_inicio}–{h.hora_fin}</div>
                          <div className="hor-block-info">
                            <div className="hor-block-name">{h.ramo_nombre}</div>
                            {(h.codigo || h.sala) && <div className="hor-block-meta">{[h.codigo, h.sala].filter(Boolean).join(' · ')}</div>}
                          </div>
                          <button className="hor-block-del" onClick={e => { e.stopPropagation(); eliminarBloque(h.id) }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="hor-grid-wrap">
                  {(() => {
                    const toMinCalc = h => { if (!h) return 0; const [hh,mm] = h.split(':').map(Number); return hh*60+(mm||0) }
                    const minutosOcupados = horario.flatMap(h => [toMinCalc(h.hora_inicio), toMinCalc(h.hora_fin)]).filter(Boolean)
                    const HORA_INICIO = minutosOcupados.length ? Math.max(0, Math.floor((Math.min(...minutosOcupados) - 30) / 30) * 30) : 8 * 60
                    const HORA_FIN = minutosOcupados.length ? Math.min(24*60, Math.ceil((Math.max(...minutosOcupados) + 30) / 30) * 30) : 21 * 60 + 30
                    const TOTAL_MIN = HORA_FIN - HORA_INICIO
                    const PX_POR_MIN = 1.0
                    const ALTURA = TOTAL_MIN * PX_POR_MIN
                    const COL_HORA = 52
                    const toMin = toMinCalc
                    const horas = []
                    for (let m = HORA_INICIO; m <= HORA_FIN; m += 30) {
                      const hh = String(Math.floor(m/60)).padStart(2,'0')
                      const mm = String(m%60).padStart(2,'0')
                      horas.push(hh+':'+mm)
                    }
                    const vistos = new Set()
                    const horarioUnico = horario.filter(h => { if (vistos.has(h.id)) return false; vistos.add(h.id); return true })
                    return (
                      <div style={{ display: 'flex', minWidth: 340 }}>
                        <div style={{ width: COL_HORA, flexShrink: 0, position: 'relative', height: ALTURA + 24 }}>
                          <div style={{ height: 24 }} />
                          <div style={{ position: 'relative', height: ALTURA }}>
                            {horas.map(h => (
                              <div key={h} className="hor-grid-hora" style={{ position: 'absolute', top: (toMin(h) - HORA_INICIO) * PX_POR_MIN, left: 0, right: 0, lineHeight: 1 }}>{h}</div>
                            ))}
                          </div>
                        </div>
                        {diasConClases.map(dia => {
                          const bloquesDia = horarioUnico.filter(h => h.dia === dia)
                          return (
                            <div key={dia} style={{ flex: 1, minWidth: 60, display: 'flex', flexDirection: 'column' }}>
                              <div className="hor-grid-dia" style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dia.slice(0,3)}</div>
                              <div style={{ position: 'relative', height: ALTURA, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                                {horas.map(h => (
                                  <div key={h} style={{ position: 'absolute', top: (toMin(h) - HORA_INICIO) * PX_POR_MIN, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                                    onClick={() => abrirNuevoBloque(dia, h, horas[horas.indexOf(h)+2] || '')}
                                  />
                                ))}
                                <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                                  onClick={e => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const y = e.clientY - rect.top
                                    const minutos = Math.round(y / PX_POR_MIN / 10) * 10 + HORA_INICIO
                                    const hh = String(Math.floor(minutos/60)).padStart(2,'0')
                                    const mm = String(minutos%60).padStart(2,'0')
                                    const horaClick = hh+':'+mm
                                    const finMin = minutos + 60
                                    const hf = String(Math.floor(finMin/60)).padStart(2,'0')
                                    const mf = String(finMin%60).padStart(2,'0')
                                    abrirNuevoBloque(dia, horaClick, hf+':'+mf)
                                  }}
                                />
                                {bloquesDia.map(b => {
                                  const top = (toMin(b.hora_inicio) - HORA_INICIO) * PX_POR_MIN
                                  const dur = toMin(b.hora_fin) - toMin(b.hora_inicio)
                                  const height = Math.max(dur * PX_POR_MIN - 3, 20)
                                  return (
                                    <div key={b.id} className="hor-grid-bloque" onClick={e => { e.stopPropagation(); abrirEditar(b) }}
                                      style={{ top, left: 2, right: 2, height, zIndex: 2, '--tipo-color': getTipoColor(b.tipo) }}>
                                      <div className="hor-grid-bloque-name">{b.ramo_nombre}</div>
                                      <div className="hor-grid-bloque-hora">{b.hora_inicio}–{b.hora_fin}</div>
                                      {b.sala && <div className="hor-grid-bloque-sala">{b.sala}</div>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal editar bloque */}
        {editandoBloque && (
          <div className="hor-modal-backdrop" onClick={() => setEditandoBloque(null)}>
            <div className="hor-modal" onClick={e => e.stopPropagation()}>
              <div className="hor-modal-tag">{editandoBloque?._nuevo ? '➕ Nuevo bloque' : '✏️ Editando'}</div>
              <h3 className="hor-modal-title">{editandoBloque?._nuevo ? 'Agrega un bloque a tu horario' : 'Edita tu bloque'}</h3>
              <div className="hor-modal-fields">
                <input className="hor-input" placeholder="Nombre del ramo *" value={formBloque.ramo_nombre} onChange={e => setFormBloque({...formBloque, ramo_nombre: e.target.value})} />
                <select className="hor-input" value={formBloque.dia} onChange={e => setFormBloque({...formBloque, dia: e.target.value})}>
                  {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d}</option>)}
                </select>
                <div className="hor-input-row">
                  <input className="hor-input" placeholder="Inicio (08:30)" value={formBloque.hora_inicio} onChange={e => setFormBloque({...formBloque, hora_inicio: e.target.value})} />
                  <input className="hor-input" placeholder="Fin (09:30)" value={formBloque.hora_fin} onChange={e => setFormBloque({...formBloque, hora_fin: e.target.value})} />
                </div>
                <input className="hor-input" placeholder="Sala (ej: RA-2003)" value={formBloque.sala} onChange={e => setFormBloque({...formBloque, sala: e.target.value})} />
                <input className="hor-input" placeholder="Código (ej: IME086-6)" value={formBloque.codigo} onChange={e => setFormBloque({...formBloque, codigo: e.target.value})} />
                <div className="hor-tipo-chips">
                  {TIPOS.map(t => (
                    <button key={t.value} className={`hor-tipo-chip ${formBloque.tipo === t.value ? 'on' : ''}`} style={{ '--tipo-color': t.color }} onClick={() => setFormBloque({...formBloque, tipo: t.value})}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {!editandoBloque?._nuevo && (
                <button className="hor-modal-danger" onClick={async () => { if(window.confirm('¿Eliminar este bloque?')) { await eliminarBloque(editandoBloque.id); setEditandoBloque(null) } }}>
                  🗑️ Eliminar bloque
                </button>
              )}
              <div className="hor-modal-actions">
                <button className="hor-modal-cancel" onClick={() => setEditandoBloque(null)}>Cancelar</button>
                <button className="hor-modal-submit" onClick={guardarEdicion} disabled={guardando || !formBloque.ramo_nombre.trim()}>
                  {guardando ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const RAMOS_CSS = `
  .ramos-root { background: transparent; padding: 0 0 120px; height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .ramos-hero { padding: 56px 20px 8px; }
  .ramos-hero h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.035em; line-height: 1; margin: 0 0 6px; color: var(--color-text); }
  .ramos-emoji { display: inline-block; animation: ramosBook 3.2s ease-in-out infinite; transform-origin: 50% 85%; }
  @keyframes ramosBook { 0%, 65%, 100% { transform: translateY(0) rotate(0); } 10% { transform: translateY(-5px) rotate(-7deg); } 20% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-5px) rotate(7deg); } 40% { transform: translateY(0) rotate(0); } }
  .ramos-hero-sub { font-size: 13px; color: var(--color-text-muted); font-weight: 600; margin: 0; }
  .ramos-hero-sub strong { color: var(--color-text); font-weight: 800; }

  .ramos-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 20px 20px 0; }
  .ramos-stat { position: relative; padding: 14px 10px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; text-align: center; overflow: hidden; animation: ramosStatIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
  .ramos-stat:nth-child(2) { animation-delay: 0.08s; }
  .ramos-stat:nth-child(3) { animation-delay: 0.16s; }
  @keyframes ramosStatIn { from { opacity: 0; transform: scale(0.85); } }
  .ramos-stat::after { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--sv, var(--color-primary)); }
  .ramos-stat-val { font-size: 26px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; color: var(--sv, var(--color-text)); }
  .ramos-stat-lbl { margin-top: 6px; font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-text-muted); }
  .ramos-stat.ok { --sv: #34d399; }
  .ramos-stat.warn { --sv: #fbbf24; }
  .ramos-stat.risk { --sv: #f87171; }

  .ramos-section { padding: 28px 20px 0; }
  .ramos-section-tight { padding-top: 20px; }
  .ramos-section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .ramos-section-title h4 { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-muted); margin: 0; }

  .ramos-proxs-scroll { display: flex; gap: 10px; overflow-x: auto; margin: 0 -20px; padding: 4px 20px 12px; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .ramos-proxs-scroll::-webkit-scrollbar { display: none; }
  .ramos-proxs-card { flex: 0 0 162px; scroll-snap-align: start; position: relative; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; cursor: pointer; overflow: hidden; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s; }
  .ramos-proxs-card::after { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--urg-color, #34d399); box-shadow: 0 0 12px var(--urg-color, rgba(52,211,153,0.6)); }
  .ramos-proxs-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); }
  .ramos-proxs-card.urg-risk { --urg-color: #f87171; }
  .ramos-proxs-card.urg-warn { --urg-color: #fbbf24; }
  .ramos-proxs-card.urg-ok { --urg-color: #34d399; }
  .ramos-proxs-name { font-size: 12px; font-weight: 800; letter-spacing: -0.01em; color: var(--color-text); margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ramos-proxs-ramo { font-size: 10px; color: var(--color-text-muted); margin: 0 0 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
  .ramos-proxs-foot { display: flex; justify-content: space-between; align-items: center; }
  .ramos-proxs-dias { font-size: 12px; font-weight: 900; color: var(--urg-color, #34d399); letter-spacing: -0.01em; }
  .ramos-proxs-pond { font-size: 9px; font-weight: 800; color: var(--color-text-muted); letter-spacing: 0.06em; }

  .ramos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .ramos-card { position: relative; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 10px; overflow: hidden; cursor: pointer; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s; animation: ramosCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
  @keyframes ramosCardIn { from { opacity: 0; transform: translateY(10px); } }
  .ramos-card::after { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--accent); }
  .ramos-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.18); }
  .ramos-card > * { position: relative; }
  .ramos-card.accent-cyan { --accent: #06b6d4; --accent-glow: rgba(6,182,212,0.4); }
  .ramos-card.accent-purple { --accent: #a78bfa; --accent-glow: rgba(167,139,250,0.4); }
  .ramos-card.accent-pink { --accent: #ec4899; --accent-glow: rgba(236,72,153,0.4); }
  .ramos-card.accent-orange { --accent: #f97316; --accent-glow: rgba(249,115,22,0.4); }
  .ramos-card.accent-emerald { --accent: #10b981; --accent-glow: rgba(16,185,129,0.4); }
  .ramos-card.accent-yellow { --accent: #eab308; --accent-glow: rgba(234,179,8,0.4); }
  .ramos-card-title { font-size: 11px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.2; margin: 0 0 6px; min-height: 24px; color: var(--color-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .ramos-card-nota-wrap { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
  .ramos-card-nota { font-size: 22px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; color: #fff; }
  .ramos-card-nota.nota-ok { color: #34d399; }
  .ramos-card-nota.nota-warn { color: #fbbf24; }
  .ramos-card-nota.nota-risk { color: #f87171; }
  .ramos-card-nota-lbl { font-size: 7px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-muted); }
  .ramos-card-prog { margin: 6px 0; }
  .ramos-card-prog-row { display: flex; justify-content: space-between; font-size: 8px; color: var(--color-text-muted); margin-bottom: 2px; font-weight: 700; letter-spacing: 0.03em; }
  .ramos-card-prog-track { height: 3px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
  .ramos-card-prog-fill { height: 100%; background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white)); border-radius: 999px; box-shadow: 0 0 10px var(--accent-glow); animation: ramosFillIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
  @keyframes ramosFillIn { from { width: 0 !important; } }
  .ramos-card-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
  .ramos-card-badge.ok { background: rgba(16,185,129,0.12); color: #34d399; border-color: rgba(16,185,129,0.3); }
  .ramos-card-badge.warn { background: rgba(245,158,11,0.12); color: #fbbf24; border-color: rgba(245,158,11,0.3); }
  .ramos-card-badge.risk { background: rgba(239,68,68,0.12); color: #f87171; border-color: rgba(239,68,68,0.3); }

  .ramos-empty { text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px dashed rgba(255,255,255,0.12); border-radius: 22px; }
  .ramos-empty-emoji { font-size: 48px; margin-bottom: 10px; display: inline-block; animation: ramosFloaty 3s ease-in-out infinite; }
  @keyframes ramosFloaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .ramos-empty-txt { font-size: 15px; color: var(--color-text); font-weight: 800; margin: 0 0 4px; }
  .ramos-empty-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 600; }

  .ramos-actions { margin-top: 16px; }
  .ramos-btn-add { width: 100%; padding: 14px; background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: #fff; border: 1px solid var(--color-primary); border-radius: 16px; font-family: inherit; font-weight: 900; font-size: 14px; cursor: pointer; transition: background 0.2s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .ramos-btn-add:hover { background: color-mix(in srgb, var(--color-primary) 20%, transparent); transform: scale(1.01); }
  .ramos-btn-add:active { transform: scale(0.98); }
  .ramos-btn-danger { width: 100%; margin-top: 10px; padding: 11px; background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.22); border-radius: 14px; color: #f87171; font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; letter-spacing: 0.02em; }
  .ramos-btn-danger:hover { background: rgba(239,68,68,0.14); }

  .ramos-form { margin-top: 16px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--color-primary); border-radius: 22px; padding: 20px; animation: ramosFormIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes ramosFormIn { from { opacity: 0; transform: translateY(8px); } }
  .ramos-form-tag { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-primary); margin: 0 0 6px; }
  .ramos-form-h { font-size: 20px; font-weight: 900; letter-spacing: -0.02em; color: var(--color-text); margin: 0 0 16px; }
  .ramos-form-field { margin-bottom: 14px; }
  .ramos-form-label { display: block; font-size: 10px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 6px; }
  .ramos-form-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 14px; font-size: 14px; color: var(--color-text); outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s, background 0.2s; }
  .ramos-form-input:focus { border-color: var(--color-primary); background: rgba(255,255,255,0.07); }
  .ramos-form-toggle { background: none; border: none; color: var(--color-secondary); font-size: 12px; font-weight: 800; cursor: pointer; padding: 0; font-family: inherit; margin-bottom: 10px; letter-spacing: 0.01em; }
  .ramos-form-check { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 0; }
  .ramos-form-check-box { width: 20px; height: 20px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.25); background: transparent; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
  .ramos-form-check-box.on { background: var(--color-accent); border-color: var(--color-accent); }
  .ramos-form-check-box.on::after { content: '✓'; color: white; font-size: 12px; font-weight: 900; }
  .ramos-form-check-lbl { font-size: 13px; color: var(--color-text-muted); font-weight: 600; }
  .ramos-form-actions { display: flex; gap: 10px; margin-top: 4px; }
  .ramos-form-cancel { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; color: var(--color-text-muted); font-size: 14px; cursor: pointer; font-family: inherit; font-weight: 700; transition: background 0.2s; }
  .ramos-form-cancel:hover { background: rgba(255,255,255,0.09); }
  .ramos-form-submit { flex: 2; background: color-mix(in srgb, var(--color-primary) 18%, transparent); color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: 12px; padding: 12px; font-size: 14px; font-weight: 900; cursor: pointer; font-family: inherit; transition: background 0.2s, transform 0.2s; }
  .ramos-form-submit:hover { background: color-mix(in srgb, var(--color-primary) 28%, transparent); }
  .ramos-form-submit:active { transform: scale(0.98); }
`

const RAMOS_ACCENTS = ['accent-cyan', 'accent-purple', 'accent-pink', 'accent-orange', 'accent-emerald', 'accent-yellow']

function RamosScreen({ ramos, onSelect, onAdd, onLogout, onAdmin, onHorario, usuario, onUniversidad, horario, esFundador, numeroRegistro, onBorrarRamos, onIrAEval }) {
  const [nuevo, setNuevo] = useState('')
  const [min, setMin] = useState('4.0')
  const [exim, setExim] = useState('')
  const [condExim, setCondExim] = useState('')
  const [mostrarExim, setMostrarExim] = useState(false)
  const [pondEx, setPondEx] = useState('25')
  const [mostrando, setMostrando] = useState(false)

  const agregar = () => {
    if (!nuevo.trim()) return
    onAdd({
      nombre: nuevo.trim(),
      min_aprobacion: parseFloat(min) || 4.0,
      nota_eximicion: exim ? parseFloat(exim) : null,
      condiciones_eximicion: condExim === 'sin_rojos' ? 'sin_rojos' : null,
      sin_rojos: condExim === 'sin_rojos',
      ponderacion_examen: parseFloat(pondEx) || 25
    })
    setNuevo(''); setMin('4.0'); setExim(''); setCondExim(''); setMostrarExim(false); setPondEx('25'); setMostrando(false)
  }

  // Stats globales
  const statsRamos = ramos.map(r => {
    const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
    return evs.length > 0 ? calcular(evs, r.min_aprobacion, r) : null
  })
  const aprobados = statsRamos.filter(c => c && (c.estado === 'aprobado' || c.estado === 'eximido')).length
  const conExamen = statsRamos.filter(c => c && c.estado === 'con_examen').length
  const enCurso = ramos.length - aprobados - conExamen

  // Próximas evaluaciones (todas las evaluaciones con fecha, ordenadas)
  const proximas = ramos.flatMap(r =>
    (r.evaluaciones || [])
      .filter(e => e.fecha && (e.nota === null || e.nota === undefined || e.nota === ''))
      .map(e => ({ ...e, ramoNombre: r.nombre, ramoId: r.id }))
  ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 8)

  const hoy = new Date()
  const diasRest = (fecha) => Math.ceil((new Date(fecha) - hoy) / (1000 * 60 * 60 * 24))

  // Info para cada card de ramo (mismo patrón que el Home)
  const getRamoInfo = (r) => {
    const evs = (r.evaluaciones || []).map(e => ({ ...e, ponderacion: parseFloat(e.ponderacion) || 0 }))
    const calc = evs.length > 0 ? calcular(evs, r.min_aprobacion, r) : null
    const completadas = evs.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '').length
    const total = evs.length
    const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0
    let notaPrincipal = '--', notaTipo = 'Promedio', notaVariante = '', badge = null
    if (calc) {
      if (calc.estado === 'eximido') {
        notaPrincipal = calc.promedio != null ? calc.promedio.toFixed(1) : '--'
        notaTipo = 'Final'; notaVariante = 'nota-ok'
        badge = { texto: '🎓 Eximido', clase: 'ok' }
      } else if (calc.estado === 'aprobado') {
        notaPrincipal = calc.promedio != null ? calc.promedio.toFixed(1) : '--'
        notaTipo = 'Final'; notaVariante = 'nota-ok'
        badge = { texto: '✅ Aprobado', clase: 'ok' }
      } else if (calc.estado === 'reprobado_sin_examen' || calc.estado === 'reprobado_imposible' || calc.estado === 'imposible') {
        notaPrincipal = calc.promedio != null ? calc.promedio.toFixed(1) : '--'
        notaVariante = 'nota-risk'
        badge = { texto: '⚠️ En riesgo', clase: 'risk' }
      } else if (calc.estado === 'con_examen') {
        notaPrincipal = calc.promedio != null ? calc.promedio.toFixed(1) : '--'
        notaVariante = 'nota-warn'
        badge = { texto: '📝 Examen', clase: 'warn' }
      } else if (calc.promedio != null) {
        notaPrincipal = calc.promedio.toFixed(1)
        if (calc.necesaria != null && calc.necesaria > 6) notaVariante = 'nota-risk'
      } else if (calc.necesaria != null) {
        notaPrincipal = calc.necesaria > 7 ? '✗' : calc.necesaria.toFixed(1)
        notaTipo = 'Necesitas'
        notaVariante = calc.necesaria > 6 ? 'nota-risk' : calc.necesaria > 5 ? 'nota-warn' : 'nota-ok'
      }
    }
    if (!badge) {
      const proxEv = evs.filter(e => e.fecha && (e.nota === null || e.nota === undefined || e.nota === ''))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]
      if (proxEv) {
        const d = diasRest(proxEv.fecha)
        if (d != null && d >= 0) {
          const clase = d <= 2 ? 'risk' : d <= 5 ? 'warn' : ''
          const txt = d === 0 ? '¡Hoy!' : d === 1 ? 'Mañana' : `En ${d}d`
          badge = { texto: `📅 ${txt}`, clase }
        }
      }
    }
    return { notaPrincipal, notaTipo, notaVariante, badge, progreso, completadas, total }
  }

  const subLinea = ramos.length === 0
    ? 'Aún no tienes ramos cargados'
    : <>{ramos.length} {ramos.length === 1 ? 'ramo' : 'ramos'} este semestre · <strong>{aprobados}</strong> {aprobados === 1 ? 'aprobado' : 'aprobados'}</>

  return (
    <>
      <style>{RAMOS_CSS}</style>
      <div className="ramos-root">
        <BannerInstalar />

        {/* HERO */}
        <div className="ramos-hero">
          <h1><span className="ramos-emoji">📚</span> Mis Ramos</h1>
          <p className="ramos-hero-sub">{subLinea}</p>
        </div>

        {/* STATS GLASS */}
        {ramos.length > 0 && (
          <div className="ramos-stats">
            <div className="ramos-stat">
              <div className="ramos-stat-val">{enCurso}</div>
              <div className="ramos-stat-lbl">En curso</div>
            </div>
            <div className="ramos-stat warn">
              <div className="ramos-stat-val">{conExamen}</div>
              <div className="ramos-stat-lbl">Con examen</div>
            </div>
            <div className="ramos-stat ok">
              <div className="ramos-stat-val">{aprobados}</div>
              <div className="ramos-stat-lbl">Aprobados</div>
            </div>
          </div>
        )}

        {/* TIP */}
        {ramos.length > 0 && (
          <div className="ramos-section ramos-section-tight">
            <TipInteligente ramos={ramos} />
          </div>
        )}

        {/* PRÓXIMAS EVALUACIONES */}
        {proximas.length > 0 && (
          <div className="ramos-section">
            <div className="ramos-section-title"><h4>📅 Próximas evaluaciones</h4></div>
            <div className="ramos-proxs-scroll">
              {proximas.map((ev, i) => {
                const d = diasRest(ev.fecha)
                const urgClase = d <= 2 ? 'urg-risk' : d <= 7 ? 'urg-warn' : 'urg-ok'
                const diasTxt = d === 0 ? '¡Hoy!' : d === 1 ? 'Mañana' : d < 0 ? 'Vencida' : `${d}d`
                return (
                  <div key={i} className={`ramos-proxs-card ${urgClase}`} onClick={() => onIrAEval && onIrAEval(ev.ramoId, ev.id)}>
                    <div className="ramos-proxs-name">{ev.nombre}</div>
                    <div className="ramos-proxs-ramo">{ev.ramoNombre}</div>
                    <div className="ramos-proxs-foot">
                      <div className="ramos-proxs-dias">{diasTxt}</div>
                      <div className="ramos-proxs-pond">{ev.ponderacion}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* GRID DE RAMOS */}
        <div className="ramos-section">
          <div className="ramos-section-title"><h4>📚 Todos tus ramos</h4></div>
          {ramos.length === 0 ? (
            <div className="ramos-empty">
              <div className="ramos-empty-emoji">🎓</div>
              <div className="ramos-empty-txt">Aún no tienes ramos</div>
              <div className="ramos-empty-sub">Agrega tu primer ramo para empezar a organizar el semestre</div>
            </div>
          ) : (
            <div className="ramos-grid">
              {ramos.map((r, i) => {
                const info = getRamoInfo(r)
                const accentClass = RAMOS_ACCENTS[i % RAMOS_ACCENTS.length]
                return (
                  <div key={r.id} className={`ramos-card ${accentClass}`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => onSelect(r)}>
                    <div className="ramos-card-title">{r.nombre}</div>
                    <div className="ramos-card-nota-wrap">
                      <div className={`ramos-card-nota ${info.notaVariante}`}>{info.notaPrincipal}</div>
                      <div className="ramos-card-nota-lbl">{info.notaTipo}</div>
                    </div>
                    <div className="ramos-card-prog">
                      <div className="ramos-card-prog-row">
                        <span>{info.completadas}/{info.total} eval</span>
                        <span>{info.progreso}%</span>
                      </div>
                      <div className="ramos-card-prog-track">
                        <div className="ramos-card-prog-fill" style={{ width: `${info.progreso}%` }} />
                      </div>
                    </div>
                    {info.badge && (
                      <span className={`ramos-card-badge ${info.badge.clase || ''}`}>{info.badge.texto}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ACCIONES */}
          <div className="ramos-actions">
            {mostrando ? (
              <div className="ramos-form">
                <div className="ramos-form-tag">⚡ Nuevo ramo</div>
                <h3 className="ramos-form-h">Agrega un ramo a tu semestre</h3>
                <div className="ramos-form-field">
                  <label className="ramos-form-label">Nombre del ramo</label>
                  <input className="ramos-form-input" value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Ej: Cálculo I" onKeyDown={e => e.key === 'Enter' && agregar()} autoFocus />
                </div>
                <div className="ramos-form-field">
                  <label className="ramos-form-label">Nota mínima de aprobación</label>
                  <input className="ramos-form-input" type="number" min="1" max="7" step="0.1" value={min} onChange={e => setMin(e.target.value)} />
                </div>
                <div className="ramos-form-field">
                  <label className="ramos-form-label">% del examen (sobre la nota final)</label>
                  <input className="ramos-form-input" type="number" min="1" max="60" step="1" value={pondEx} onChange={e => setPondEx(e.target.value)} placeholder="25" />
                </div>
                <div className="ramos-form-field">
                  <button className="ramos-form-toggle" onClick={() => setMostrarExim(!mostrarExim)}>
                    {mostrarExim ? '▼' : '▶'} Configurar eximición (opcional)
                  </button>
                  {mostrarExim && (
                    <>
                      <label className="ramos-form-label">Nota mínima para eximirse</label>
                      <input className="ramos-form-input" type="number" min="1" max="7" step="0.1" value={exim} onChange={e => setExim(e.target.value)} placeholder="Ej: 5.0" style={{ marginBottom: 12 }} />
                      <div className="ramos-form-check" onClick={() => setCondExim(condExim === 'sin_rojos' ? '' : 'sin_rojos')}>
                        <div className={`ramos-form-check-box ${condExim === 'sin_rojos' ? 'on' : ''}`}></div>
                        <span className="ramos-form-check-lbl">Requiere sin notas rojas (bajo 4.0)</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="ramos-form-actions">
                  <button className="ramos-form-cancel" onClick={() => setMostrando(false)}>Cancelar</button>
                  <button className="ramos-form-submit" onClick={agregar}>Agregar ramo</button>
                </div>
              </div>
            ) : (
              <>
                <button className="ramos-btn-add" onClick={() => setMostrando(true)}>
                  + Agregar ramo
                </button>
                {ramos.length > 0 && (
                  <button className="ramos-btn-danger" onClick={onBorrarRamos}>
                    🗑️ Eliminar todos los ramos
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function RamoScreen({ ramo, onBack, onUpdate, onDelete, onPatchEval, onPlan, evalDestacada, onClearEval }) {
  const [notaEditingId, setNotaEditingId] = useState(null)     // qué eval está con input inline
  const [flashedNotaId, setFlashedNotaId] = useState(null)      // flash verde tras guardar
  const [editingMeta, setEditingMeta] = useState(null)          // { id, nombre, fecha, ponderacion }
  const [editandoExamen, setEditandoExamen] = useState(false)   // re-editar nota_examen ya guardada
  const [evalAddError, setEvalAddError] = useState(null)        // error inline en form agregar eval
  const [evalMetaError, setEvalMetaError] = useState(null)      // error inline en modal editar eval
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

  useEffect(() => {
    if (!evalDestacada) return
    setTimeout(() => {
      const el = document.getElementById('eval-' + evalDestacada)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.transition = 'box-shadow 0.3s'
        el.style.boxShadow = '0 0 0 2px #C9A84C'
        setTimeout(() => { el.style.boxShadow = ''; onClearEval && onClearEval() }, 2500)
      }
    }, 350)
  }, [evalDestacada])

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

  const guardarNota = async (ev, rawValor) => {
    setNotaEditingId(null)
    const trimmed = (rawValor ?? '').trim()
    if (trimmed === '') return  // vacío → revertir sin guardar
    const nueva = parseFloat(trimmed)
    if (isNaN(nueva) || nueva < 1 || nueva > 7) return  // fuera de rango → revertir
    const actual = ev.nota !== null && ev.nota !== undefined && ev.nota !== '' ? parseFloat(ev.nota) : null
    if (actual !== null && Math.abs(actual - nueva) < 0.001) return  // sin cambios reales
    const ok = await onPatchEval(ramo.id, ev.id, { nota: nueva })
    if (!ok) return
    setFlashedNotaId(ev.id)
    setTimeout(() => setFlashedNotaId(null), 900)
    // Confetti si al guardar el ramo queda aprobado
    const nuevasEvs = evs.map(e => e.id === ev.id ? { ...e, nota: nueva } : e)
    const calc = calcular(nuevasEvs, ramo.min_aprobacion, ramo)
    if (calc.estado === 'aprobado') { setConfetti(true); setTimeout(() => setConfetti(false), 4000) }
  }

  const abrirModalMeta = (ev) => {
    setEditingMeta({
      id: ev.id,
      nombre: ev.nombre || '',
      fecha: ev.fecha ? String(ev.fecha).slice(0, 10) : '',
      ponderacion: ev.ponderacion ?? ''
    })
  }

  const guardarMeta = async () => {
    setEvalMetaError(null)
    if (!editingMeta) return
    const nombre = editingMeta.nombre.trim()
    if (!nombre) { setEvalMetaError('Nombre requerido'); return }
    const pond = parseFloat(editingMeta.ponderacion)
    if (isNaN(pond) || pond <= 0 || pond > 100) { setEvalMetaError('Ponderación inválida'); return }
    // Validar: la nueva ponderación + suma de las otras evals no puede pasar 100%
    const sumaOtras = evs.filter(e => e.id !== editingMeta.id).reduce((acc, e) => acc + e.ponderacion, 0)
    const dispEdit = Math.round((100 - sumaOtras) * 10) / 10
    if (pond > dispEdit + 0.01) {
      setEvalMetaError(`Solo quedan ${dispEdit}% disponibles`)
      return
    }
    const changes = { nombre, fecha: editingMeta.fecha || null, ponderacion: pond }
    const ok = await onPatchEval(ramo.id, editingMeta.id, changes)
    if (ok) { setEditingMeta(null); setEvalMetaError(null) }
    else setEvalMetaError('El servidor rechazó el cambio')
  }

  const agregarEv = () => {
    setEvalAddError(null)
    if (!nuevaEv.nombre.trim()) { setEvalAddError('Nombre requerido'); return }
    if (!nuevaEv.ponderacion) { setEvalAddError('Ponderación requerida'); return }
    const pond = parseFloat(nuevaEv.ponderacion)
    if (isNaN(pond) || pond <= 0) { setEvalAddError('Ponderación inválida'); return }
    if (pond > pesoDisponible + 0.01) { setEvalAddError(`Solo quedan ${pesoDisponible}% disponibles`); return }
    const ev = { id: Date.now(), nombre: nuevaEv.nombre.trim(), ponderacion: pond, fecha: nuevaEv.fecha || null, nota: null }
    onUpdate({ ...ramo, evaluaciones: [...evs, ev] })
    setNuevaEv({ nombre: '', ponderacion: '', fecha: '' })
    setMostrando(false)
  }

  const eliminarEv = (id) => onUpdate({ ...ramo, evaluaciones: evs.filter(e => e.id !== id) })
  const borrarNota = (id) => onUpdate({ ...ramo, evaluaciones: evs.map(e => e.id === id ? { ...e, nota: null } : e) })

  // Guarda o limpia la nota del examen. Valor vacío → null en DB (aún no rendido).
  const guardarExamen = () => {
    const trimmed = notaExamen == null ? '' : String(notaExamen).trim()
    if (trimmed === '') {
      borrarExamen()
      return
    }
    const nota = parseFloat(trimmed)
    if (isNaN(nota) || nota < 1 || nota > 7) return
    const pondEx = (ramo.ponderacion_examen || 25) / 100
    const pondSem = 1 - pondEx
    const notaFinal = promedio * pondSem + nota * pondEx
    onUpdate({
      ...ramo,
      nota_examen: nota,
      nota_final: parseFloat(notaFinal.toFixed(1)),
      estado_final: parseFloat(notaFinal.toFixed(1)) >= ramo.min_aprobacion ? 'aprobado' : 'reprobado'
    })
    setEditandoExamen(false)
  }

  const borrarExamen = () => {
    onUpdate({ ...ramo, nota_examen: null, nota_final: null, estado_final: null })
    setNotaExamen('')
    setEditandoExamen(false)
  }

  const proximaEv = evs.filter(e => (e.nota === null || e.nota === undefined || e.nota === '') && e.fecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]

  // Mensaje resumen inteligente
  const MensajeResumen = () => {
    if (estado) return null
    // Faltan evaluaciones para llegar al 100%
    if (!pesoCompleto && pesoDisponible > 0) {
      if (necesaria !== null) {
        return (
          <div style={{ background: necesaria > 6 ? 'rgba(239,68,68,0.1)' : necesaria > 5 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${necesaria > 6 ? 'rgba(239,68,68,0.25)' : necesaria > 5 ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`, borderRadius: 14, padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: 'white', margin: '0 0 4px', lineHeight: 1.5 }}>
              📌 Estimado: necesitas <strong style={{ color: colorNecesaria }}>{necesaria.toFixed(1)}</strong> en {pendientesCount === 1 ? 'la evaluación restante' : `las ${pendientesCount} evaluaciones restantes`}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              ⚠️ Tus ponderaciones suman {pesoTotal}% — agrega las que faltan para un cálculo exacto
            </p>
          </div>
        )
      }
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
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>% del examen (sobre la nota final)</p>
            <input type="number" min="1" max="60" step="1" value={editPondExamen} onChange={e => setEditPondExamen(e.target.value)} placeholder="25"
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
        <div style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', padding: '20px 20px 24px' }}>
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
              {estado === 'aprobado' && !ramo.nota_examen && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio final: <strong style={{ color: '#4ade80' }}>{promedio?.toFixed(1)}</strong></p>}

              {estado === 'con_examen' && !editandoExamen && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 8px' }}>Promedio semestre: <strong style={{ color: '#fbbf24' }}>{promedio?.toFixed(1)}</strong></p>
                  {tieneRojos && ramo.sin_rojos && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 6px' }}>⚠️ Tienes notas rojas — no cumples condición de eximición</p>}
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 12px' }}>
                    Necesitas <strong style={{ color: necesariaExamen > 6 ? '#f87171' : necesariaExamen > 5 ? '#fbbf24' : '#4ade80', fontSize: 20 }}>{necesariaExamen?.toFixed(1)}</strong> en el examen ({ramo.ponderacion_examen || 25}%)
                  </p>
                </div>
              )}

              {/* Input de nota examen — visible cuando aún no se rindió O cuando se está re-editando */}
              {(estado === 'con_examen' || editandoExamen) && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {editandoExamen ? '✏️ Modificar nota del examen' : '📋 ¿Ya rendiste el examen?'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="number" min="1" max="7" step="0.1"
                      placeholder="Nota examen (vacío = no rendido)"
                      value={notaExamen}
                      onChange={e => setNotaExamen(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') guardarExamen() }}
                      style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 16, fontWeight: 700, outline: 'none' }}
                    />
                    <button onClick={guardarExamen} style={{ background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 10, padding: '10px 18px', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      Guardar
                    </button>
                    {editandoExamen && (
                      <>
                        <button onClick={borrarExamen} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          🗑️ Aún no rendido
                        </button>
                        <button onClick={() => {
                          setNotaExamen(ramo.nota_examen ? String(ramo.nota_examen) : '')
                          setEditandoExamen(false)
                        }} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Resumen nota_examen guardada (post-save) con botón para re-editar */}
              {ramo.nota_examen && ramo.nota_final && !editandoExamen && (estado === 'aprobado' || estado === 'reprobado_sin_examen') && (
                <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 14, background: estado === 'aprobado' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${estado === 'aprobado' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    Nota examen: <strong style={{ color: 'white' }}>{parseFloat(ramo.nota_examen).toFixed(1)}</strong> · Nota final: <strong style={{ color: estado === 'aprobado' ? '#4ade80' : '#f87171', fontSize: 18 }}>{promedio?.toFixed(1)}</strong>
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: estado === 'aprobado' ? '#4ade80' : '#f87171' }}>
                      {estado === 'aprobado' ? '🎉 ¡Ramo aprobado!' : '😔 Ramo reprobado'}
                    </p>
                    <button onClick={() => {
                      setNotaExamen(String(ramo.nota_examen))
                      setEditandoExamen(true)
                    }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ Editar nota examen
                    </button>
                  </div>
                </div>
              )}

              {estado === 'reprobado_imposible' && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio semestre: <strong style={{ color: '#f87171' }}>{promedio?.toFixed(1)}</strong> — imposible aprobar con examen</p>}
              {estado === 'reprobado_sin_examen' && !ramo.nota_examen && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Promedio semestre: <strong style={{ color: '#f87171' }}>{promedio?.toFixed(1)}</strong> — no alcanzas el mínimo ({ramo.min_aprobacion}) para presentarte a examen</p>}
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
          <p style={{ fontSize: 11, fontWeight: pesoUsado > 100 ? 800 : 600, color: pesoUsado > 100 ? '#f87171' : '#4a4a6a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {pesoUsado > 100 ? '⚠️ ' : ''}Evaluaciones · {pesoUsado}% usado{pesoUsado > 100 ? ' (supera 100%)' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {evs.map((ev, idx) => {
              const tieneNota = ev.nota !== null && ev.nota !== undefined && ev.nota !== ''
              const notaVal = tieneNota ? parseFloat(ev.nota) : null
              const estaEditandoNota = notaEditingId === ev.id
              const flashing = flashedNotaId === ev.id
              const notaBorderColor = flashing ? '#4ade80' : (tieneNota ? `${notaColor(notaVal)}44` : 'var(--shadow-color)')
              const notaBoxShadow = flashing ? '0 0 0 3px rgba(74,222,128,0.35)' : 'none'
              return (
                <div key={ev.id} id={'eval-' + ev.id} style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '14px 16px', border: tieneNota ? '1px solid var(--shadow-color)' : '1.5px dashed rgba(108,99,255,0.3)', animation: `slideUp 0.3s ${idx * 0.05}s ease both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Cuadrito nota — tap para editar inline */}
                    {estaEditandoNota ? (
                      <input
                        type="number" min="1" max="7" step="0.1"
                        defaultValue={tieneNota ? notaVal.toFixed(1) : ''}
                        placeholder="?"
                        autoFocus
                        onFocus={e => e.target.select()}
                        onBlur={e => guardarNota(ev, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.target.blur()
                          if (e.key === 'Escape') { e.target.value = ''; setNotaEditingId(null) }
                        }}
                        style={{ width: 48, height: 48, background: 'var(--shadow-color)', borderRadius: 14, border: '1.5px solid var(--color-primary)', textAlign: 'center', fontSize: 16, fontWeight: 800, color: 'white', outline: 'none', flexShrink: 0, boxSizing: 'border-box', MozAppearance: 'textfield' }}
                      />
                    ) : (
                      <div
                        onClick={() => setNotaEditingId(ev.id)}
                        title="Tap para editar la nota"
                        style={{ width: 48, height: 48, background: tieneNota ? `${notaColor(notaVal)}22` : 'var(--shadow-color)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tieneNota ? 15 : 18, fontWeight: 800, color: tieneNota ? notaColor(notaVal) : 'var(--color-primary)', flexShrink: 0, border: `1.5px solid ${notaBorderColor}`, boxShadow: notaBoxShadow, cursor: 'pointer', transition: 'box-shadow 0.3s, border-color 0.3s' }}
                      >
                        {tieneNota ? notaVal.toFixed(1) : '?'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{ev.nombre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: 20 }}>{ev.ponderacion}%</span>
                        {ev.fecha && <BadgeFecha fecha={ev.fecha} />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => abrirModalMeta(ev)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '7px 12px', color: 'rgba(255,255,255,0.85)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => eliminarEv(ev.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 10, padding: '7px 10px', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onPlan(ev) }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '7px 12px', color: 'rgba(255,255,255,0.85)', fontSize: 12, cursor: 'pointer', fontWeight: 600, width: '100%' }}>🤖 Plan IA</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {mostrando ? (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '20px', border: '1.5px solid rgba(108,99,255,0.3)', animation: 'slideUp 0.3s ease' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 16px' }}>Nueva evaluación <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 400 }}>({pesoDisponible}% disponible)</span></p>
              <input value={nuevaEv.nombre} onChange={e => setNuevaEv({ ...nuevaEv, nombre: e.target.value })} placeholder="Nombre (ej: Solemne 1)"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <input type="number" min="1" max={pesoDisponible} step="0.1" value={nuevaEv.ponderacion} onChange={e => setNuevaEv({ ...nuevaEv, ponderacion: e.target.value })} placeholder="Ponderación %"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  {(() => {
                    const curr = parseFloat(nuevaEv.ponderacion)
                    const excede = !isNaN(curr) && curr > pesoDisponible + 0.01
                    return <p style={{ fontSize: 10, color: excede ? '#f87171' : 'rgba(255,255,255,0.4)', margin: '4px 2px 0', fontWeight: 600 }}>
                      {excede ? `⚠️ Excede en ${(curr - pesoDisponible).toFixed(1)}%` : `Disponible: ${pesoDisponible}%`}
                    </p>
                  })()}
                </div>
                <input type="date" value={nuevaEv.fecha} onChange={e => setNuevaEv({ ...nuevaEv, fecha: e.target.value })}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark', alignSelf: 'flex-start' }} />
              </div>
              {evalAddError && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '8px 12px', color: '#f87171', fontSize: 12, fontWeight: 600, marginBottom: 10, marginTop: 8 }}>
                  {evalAddError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={() => { setMostrando(false); setEvalAddError(null); setNuevaEv({ nombre: '', ponderacion: '', fecha: '' }) }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={agregarEv} style={{ flex: 2, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', border: 'none', borderRadius: 12, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
              </div>
            </div>
          ) : (
            pesoDisponible > 0 ? (
              <button onClick={() => setMostrando(true)} style={{ width: '100%', background: 'var(--shadow-color)', border: '1.5px dashed rgba(108,99,255,0.3)', borderRadius: 16, padding: '14px', color: 'var(--color-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                + Agregar evaluación ({pesoDisponible}% disponible)
              </button>
            ) : (
              <button disabled style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600, cursor: 'not-allowed' }}>
                ✅ 100% de ponderación usado
              </button>
            )
          )}
        </div>
      </div>

      {/* Modal editar metadata de evaluación */}
      {editingMeta && (
        <div onClick={() => setEditingMeta(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(22,22,34,0.95)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: '3px solid var(--color-primary)', borderRadius: 22, padding: 24, width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-primary)', margin: '0 0 4px' }}>✏️ Editar</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Datos de la evaluación</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>Nombre</label>
                <input value={editingMeta.nombre} onChange={e => setEditingMeta({ ...editingMeta, nombre: e.target.value })} autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 13px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>Fecha</label>
                <input type="date" value={editingMeta.fecha} onChange={e => setEditingMeta({ ...editingMeta, fecha: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 13px', fontSize: 14, color: 'white', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>Ponderación (%)</label>
                <input type="number" min="1" max="100" step="0.1" value={editingMeta.ponderacion} onChange={e => setEditingMeta({ ...editingMeta, ponderacion: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 13px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                {(() => {
                  const sumaOtras = evs.filter(e => e.id !== editingMeta.id).reduce((acc, e) => acc + e.ponderacion, 0)
                  const dispEdit = Math.round((100 - sumaOtras) * 10) / 10
                  const curr = parseFloat(editingMeta.ponderacion)
                  const excede = !isNaN(curr) && curr > dispEdit + 0.01
                  return <p style={{ fontSize: 10, color: excede ? '#f87171' : 'var(--color-text-muted)', margin: '4px 2px 0', fontWeight: 600 }}>
                    {excede ? `⚠️ Excede en ${(curr - dispEdit).toFixed(1)}%` : `Disponible: ${dispEdit}%`}
                  </p>
                })()}
              </div>
            </div>
            {evalMetaError && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '8px 12px', color: '#f87171', fontSize: 12, fontWeight: 600, marginTop: 12 }}>
                {evalMetaError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setEditingMeta(null); setEvalMetaError(null) }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 11, color: 'var(--color-text-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Cancelar</button>
              <button onClick={guardarMeta} style={{ flex: 2, background: 'var(--color-primary)', color: '#1a1a1a', border: 'none', borderRadius: 12, padding: 11, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
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
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 680, border: '1px solid rgba(255,255,255,0.1)', marginTop: 20 }}>
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

function RamoRouteWrapper({ ramos, loadingRamos, usuario, onUpdate, onDelete, onPatchEval, evalDestacada, onClearEval }) {
  const { ramoId } = useParams()
  const navigate = useNavigate()
  if (!usuario) return <Navigate to="/" replace />
  if (loadingRamos) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</div>
  const ramo = ramos.find(r => r.id === Number(ramoId))
  if (!ramo) return <Navigate to="/ramos" replace />
  return (
    <>
      <RamoScreen
        ramo={ramo}
        onBack={() => navigate('/ramos')}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onPatchEval={onPatchEval}
        evalDestacada={evalDestacada}
        onClearEval={onClearEval}
        onPlan={(ev) => { if (!ev || !ev.id) { alert('Error: evaluación inválida'); return; } navigate(`/ramos/${ramo.id}/plan/${ev.id}`) }}
      />
      <BottomNav />
    </>
  )
}

function PlanEstudioRouteWrapper({ ramos, loadingRamos, usuario, cargarRamos }) {
  const { ramoId, evalId } = useParams()
  const navigate = useNavigate()
  if (!usuario) return <Navigate to="/" replace />
  if (loadingRamos) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</div>
  const ramo = ramos.find(r => r.id === Number(ramoId))
  const ev = ramo?.evaluaciones?.find(e => e.id === Number(evalId))
  if (!ramo || !ev) return <Navigate to="/ramos" replace />
  return (
    <>
      <PlanEstudio
        evaluacion={ev}
        ramo={ramo}
        onBack={async () => {
          const token = localStorage.getItem('token')
          await cargarRamos(token, true)
          navigate(-1)
        }}
      />
      <BottomNav />
    </>
  )
}

function QuizRouteWrapper({ ramos, loadingRamos, usuario }) {
  const { ramoId, evalId } = useParams()
  const navigate = useNavigate()
  if (!usuario) return <Navigate to="/" replace />
  if (loadingRamos) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</div>
  const ramo = ramos.find(r => r.id === Number(ramoId))
  const ev = ramo?.evaluaciones?.find(e => e.id === Number(evalId))
  if (!ramo || !ev) return <Navigate to="/ramos" replace />
  return (
    <>
      <Quiz evaluacion={ev} ramo={ramo} onBack={() => navigate(-1)} />
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function AppContent() {
  const [usuario, setUsuario] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [ramos, setRamos] = useState([])
  const [loadingRamos, setLoadingRamos] = useState(true)
  const [novedades, setNovedades] = useState([])
  const [horarioGlobal, setHorarioGlobal] = useState([])
  const [mostrarNotif, setMostrarNotif] = useState(false)
  const [evalDestacada, setEvalDestacada] = useState(null)
  const navigate = useNavigate()

  useTheme(usuario?.universidad)

  const irAPlanEval = (ramoId, evalId) => {
    navigate(`/ramos/${ramoId}/plan/${evalId}`)
  }

  const irAEvaluacion = (ramoId, evalId) => {
    setEvalDestacada(evalId)
    navigate(`/ramos/${ramoId}`)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const usuarioRaw = localStorage.getItem('usuario')
    let uniInicial = null
    if (token && usuarioRaw) {
      try {
        const userData = JSON.parse(usuarioRaw)
        setUsuario(userData)
        uniInicial = userData.universidad || userData.user?.universidad || null
        cargarRamos(token)
        cargarNovedades(token, uniInicial)
        cargarHorarioGlobal()
      } catch { /* usuario corrupto en LS → lo ignoramos */ }
    } else {
      setLoadingRamos(false)
    }
    setLoadingAuth(false)

    // Re-hidratar SIEMPRE desde /auth/me si hay token — así universidad,
    // onboarding, es_fundador, etc. quedan frescos aunque el localStorage
    // esté stale (p.ej. después de cambiar universidad en otra sesión).
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.user) return
          const fresh = data.user
          localStorage.setItem('usuario', JSON.stringify(fresh))
          setUsuario(fresh)
          // Si la universidad cambió vs lo que cargamos al inicio, re-fetch novedades
          if (fresh.universidad && fresh.universidad !== uniInicial) {
            cargarNovedades(token, fresh.universidad)
          }
        })
        .catch(() => {})
    }

    const handler = () => cargarRamos(localStorage.getItem('token'))
    window.addEventListener('ramos-actualizados', handler)
    return () => window.removeEventListener('ramos-actualizados', handler)
  }, [])

  // Re-fetch novedades cada 60s + cuando el tab del browser vuelve a estar
  // activo. Así las novedades publicadas vía bot Telegram (casino, descuentos)
  // aparecen sin necesidad de recargar la app.
  useEffect(() => {
    const uni = usuario?.universidad
    const token = localStorage.getItem('token')
    if (!token || !uni) return
    const refresh = () => cargarNovedades(token, uni)
    const interval = setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [usuario?.universidad])

  const borrarTodosRamos = async () => {
    if (!window.confirm('¿Seguro que quieres eliminar todos tus ramos? Esta acción no se puede deshacer.')) return
    await fetch(API + '/ramos/limpiar-todos', { method: 'DELETE', headers: authHeaders() })
    setRamos([])
  }

  const cargarNovedades = async (token, universidad) => {
    try {
      const res = await fetch(`${API}/novedades?universidad=${universidad || 'ufro'}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setNovedades(data)
    } catch(e) { console.log('Sin novedades BD, usando defaults') }
  }

  const cargarRamos = async (token) => {
    try {
      const res = await fetch(`${API}/ramos`, { headers: authHeaders({ 'Content-Type': 'application/json' }) })
      if (res.ok) {
        const data = await res.json()
        setRamos(data)
      }
    } catch (e) { console.error(e) }
    setLoadingRamos(false)
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
    // El backend redirige con el JWT en el fragment (#auth_token=...) para
    // evitar el bloqueo de third-party cookies entre subdominios de railway.app.
    const hash = window.location.hash || ''
    const match = hash.match(/^#auth_token=(.+)$/)
    if (!match) return
    const token = decodeURIComponent(match[1])
    // Limpiamos el hash del URL (el fragment nunca viaja al server pero queda
    // visible en history/clipboard — mejor borrarlo apenas lo consumimos)
    window.history.replaceState({}, '', window.location.pathname)
    localStorage.setItem('token', token)
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.user) return
        const user = data.user
        localStorage.setItem('usuario', JSON.stringify(user))
        setUsuario(user)
        if (!user.onboarding_v2) {
          navigate('/onboarding')
        } else {
          cargarRamos(token)
          cargarNovedades(token, user.universidad)
          cargarHorarioGlobal()
          navigate('/home')
        }
      })
      .catch(e => console.error('Error auth/me:', e))
  }, [])

  const handleUniversidad = async (universidad) => {
    if (universidad === 'cambiar') {
      navigate('/onboarding')
      return
    }
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
    setUsuario(null); setRamos([]); setLoadingRamos(true); navigate('/')
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
      }
    } catch (e) { console.error(e) }
  }

  // PATCH granular por evaluación (nota, nombre, fecha, ponderacion).
  // Update optimista del state local; si el server rechaza revierte.
  const handlePatchEval = async (ramoId, evalId, changes) => {
    const prevRamos = ramos
    setRamos(rs => rs.map(r => r.id === ramoId
      ? { ...r, evaluaciones: (r.evaluaciones || []).map(e => e.id === evalId ? { ...e, ...changes } : e) }
      : r
    ))
    try {
      const res = await fetch(`${API}/ramos/${ramoId}/evaluaciones/${evalId}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(changes)
      })
      if (!res.ok) { setRamos(prevRamos); return false }
      return true
    } catch (e) {
      console.error('PATCH evaluación falló:', e)
      setRamos(prevRamos)
      return false
    }
  }

  const handleDeleteRamo = async (id) => {
    try {
      const res = await fetch(`${API}/ramos/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (res.ok) { setRamos(ramos.filter(r => r.id !== id)); navigate('/ramos') }
    } catch (e) { console.error(e) }
  }

  if (loadingAuth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--color-text-secondary)' }}>
      Cargando...
    </div>
  )

  const proximas3dias = ramos.flatMap(r =>
    (r.evaluaciones || []).filter(e => e.fecha && (e.nota === null || e.nota === undefined || e.nota === ''))
      .map(e => ({ ...e }))
  ).filter(e => {
    const dias = Math.ceil((new Date(e.fecha) - new Date()) / 86400000)
    return dias >= 0 && dias <= 3
  }).length

  const esAdmin = usuario?.email === 'abelespinozav@gmail.com'
  const requireAuth = (el) => usuario ? el : <Navigate to="/" replace />
  const withBottomNav = (el) => <>{el}<BottomNav /></>

  return (
    <>
      <Routes>
        <Route path="/" element={!usuario ? <LoginScreen onLogin={handleLogin} /> : <Navigate to="/home" replace />} />
        <Route path="/onboarding" element={
          usuario
            ? <OnboardingScreen user={usuario} API={API} onComplete={(u) => { if (!u) return; setUsuario({ ...usuario, ...u, name: u.nombre || u.name || '' }); const token = localStorage.getItem('token'); cargarRamos(token); navigate('/home') }} />
            : <Navigate to="/" replace />
        } />
        <Route path="/admin" element={esAdmin ? <AdminScreen usuario={usuario} onBack={() => navigate('/home')} /> : <Navigate to="/" replace />} />
        <Route path="/home" element={requireAuth(withBottomNav(
          <HomeScreen
            ramos={ramos}
            usuario={usuario}
            esFundador={usuario?.es_fundador}
            numeroRegistro={usuario?.numero_registro}
            horario={horarioGlobal}
            onVerRamo={(ev) => irAPlanEval(ev.ramoId, ev.id)}
            onHorario={() => navigate('/horario')}
            onVerHorario={() => navigate('/horario')}
            onNotif={() => setMostrarNotif(true)}
            onPerfil={() => navigate('/perfil')}
            onAdmin={() => navigate('/admin')}
            evalProximas3dias={proximas3dias}
            novedades={novedades}
          />
        ))} />
        <Route path="/ramos" element={requireAuth(withBottomNav(
          <RamosScreen
            ramos={ramos}
            onSelect={r => navigate(`/ramos/${r.id}`)}
            onAdd={handleAddRamo}
            onLogout={handleLogout}
            onAdmin={() => navigate('/admin')}
            onHorario={() => navigate('/horario')}
            usuario={usuario}
            onUniversidad={handleUniversidad}
            horario={horarioGlobal}
            esFundador={usuario?.es_fundador}
            numeroRegistro={usuario?.numero_registro}
            onBorrarRamos={borrarTodosRamos}
            onIrAEval={irAPlanEval}
          />
        ))} />
        <Route path="/plan" element={requireAuth(withBottomNav(
          <PlanTab ramos={ramos} onIniciarPlan={(r, ev) => navigate(`/ramos/${r.id}/plan/${ev.id}`)} />
        ))} />
        <Route path="/quiz" element={requireAuth(withBottomNav(
          <QuizTab ramos={ramos} onIniciarQuiz={(r, ev) => navigate(`/ramos/${r.id}/quiz/${ev.id}`)} />
        ))} />
        <Route path="/horario" element={requireAuth(withBottomNav(
          <HorarioScreen usuario={usuario} onBack={() => { cargarHorarioGlobal(); navigate('/home') }} API={API} authHeaders={authHeaders} />
        ))} />
        <Route path="/perfil" element={requireAuth(withBottomNav(
          <PerfilTab
            usuario={usuario}
            onLogout={handleLogout}
            onUniversidad={handleUniversidad}
            esFundador={usuario?.es_fundador}
            numeroRegistro={usuario?.numero_registro}
          />
        ))} />
        <Route path="/ramos/:ramoId" element={
          <RamoRouteWrapper
            ramos={ramos}
            loadingRamos={loadingRamos}
            usuario={usuario}
            onUpdate={handleUpdateRamo}
            onPatchEval={handlePatchEval}
            onDelete={handleDeleteRamo}
            evalDestacada={evalDestacada}
            onClearEval={() => setEvalDestacada(null)}
          />
        } />
        <Route path="/ramos/:ramoId/plan/:evalId" element={
          <PlanEstudioRouteWrapper
            ramos={ramos}
            loadingRamos={loadingRamos}
            usuario={usuario}
            cargarRamos={cargarRamos}
          />
        } />
        <Route path="/ramos/:ramoId/quiz/:evalId" element={
          <QuizRouteWrapper
            ramos={ramos}
            loadingRamos={loadingRamos}
            usuario={usuario}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {mostrarNotif && <PanelNotificaciones onClose={() => setMostrarNotif(false)} proximas={ramos.flatMap(r => (r.evaluaciones||[]).filter(e => e.fecha && !e.nota).map(e => ({...e, ramoNombre: r.nombre})))} />}
    </>
  )
}
