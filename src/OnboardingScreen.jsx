import { useState } from 'react'
import { aplicarTema } from './useTheme'
import ufroLogo from './assets/logos/ufro.png'
import umayorLogo from './assets/logos/umayor.png'
import uautonomaLogo from './assets/logos/uautonoma.png'
import santotomasLogo from './assets/logos/santotomas.png'
import uctemucoLogo from './assets/logos/uctemuco.png'
import inacapLogo from './assets/logos/inacap.png'

const logoImg = (src, alt, bg) => (
  <img
    src={src}
    alt={alt}
    style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: bg, padding: 4, flexShrink: 0 }}
  />
)

const UNIVERSIDADES = [
  { id: 'ufro',       nombre: 'UFRO',        logo: logoImg(ufroLogo, 'UFRO', '#003087') },
  { id: 'umayor',     nombre: 'U. Mayor',    logo: logoImg(umayorLogo, 'U. Mayor', '#F5C400') },
  { id: 'uautonoma',  nombre: 'U. Autónoma', logo: logoImg(uautonomaLogo, 'U. Autónoma', '#C8001E') },
  { id: 'inacap',     nombre: 'INACAP',      logo: logoImg(inacapLogo, 'INACAP', '#CC0000') },
  { id: 'santotomas', nombre: 'Santo Tomás', logo: logoImg(santotomasLogo, 'Santo Tomás', '#00594F') },
  { id: 'uctemuco',   nombre: 'UC Temuco',   logo: logoImg(uctemucoLogo, 'UC Temuco', '#ffffff') },
]

const ONB_CSS = `
  .onb-root { min-height: 100vh; background: radial-gradient(circle at 50% 10%, rgba(46,125,209,0.15) 0%, var(--bg-primary) 55%); padding: 48px 20px 120px; box-sizing: border-box; }
  .onb-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 32px; }
  .onb-dot { height: 6px; border-radius: 999px; transition: all 0.3s; }
  .onb-dot.dim { width: 6px; background: rgba(255,255,255,0.15); }
  .onb-dot.on { width: 32px; background: #2e7dd1; box-shadow: 0 0 16px rgba(46,125,209,0.5); }
  .onb-hero { text-align: center; max-width: 360px; margin: 0 auto 28px; }
  .onb-title { color: #fff; font-size: 28px; font-weight: 900; letter-spacing: -0.025em; margin: 0 0 8px; line-height: 1.15; }
  .onb-sub { color: rgba(255,255,255,0.55); font-size: 14px; font-weight: 500; margin: 0; line-height: 1.5; }
  .onb-field { max-width: 380px; margin: 0 auto 24px; }
  .onb-label { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin: 0 0 10px; }
  .onb-input { width: 100%; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 16px; color: #fff; font-size: 16px; font-weight: 600; outline: none; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s, background 0.2s; }
  .onb-input:focus, .onb-input:not(:placeholder-shown) { border-color: #2e7dd1; background: rgba(46,125,209,0.06); }
  .onb-uni-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .onb-uni-chip { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 10px 12px; cursor: pointer; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); color: #fff; font-family: inherit; text-align: left; }
  .onb-uni-chip:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); }
  .onb-uni-chip.active { background: rgba(46,125,209,0.14); border-color: #2e7dd1; box-shadow: 0 4px 20px rgba(46,125,209,0.2); }
  .onb-uni-name { font-size: 13px; font-weight: 700; letter-spacing: -0.01em; }
  .onb-actions { max-width: 380px; margin: 32px auto 0; }
  .onb-submit { width: 100%; background: linear-gradient(135deg, #2e7dd1, #5ba3e8); color: #fff; border: none; border-radius: 16px; padding: 15px; font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s, opacity 0.2s; box-shadow: 0 10px 30px rgba(46,125,209,0.35); display: flex; align-items: center; justify-content: center; gap: 8px; }
  .onb-submit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
  .onb-submit:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  .onb-skip { display: block; width: 100%; background: none; border: none; color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 600; text-align: center; padding: 14px; cursor: pointer; font-family: inherit; margin-top: 4px; transition: color 0.2s; }
  .onb-skip:hover:not(:disabled) { color: rgba(255,255,255,0.7); }
  .onb-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 12px; padding: 10px 14px; color: #f87171; font-size: 12px; font-weight: 600; text-align: center; margin: 16px auto 0; max-width: 380px; }
`

export default function OnboardingScreen({ user, onComplete, API }) {
  const [nombre, setNombre] = useState((user?.name || user?.nombre || '').trim())
  const [uniSeleccionada, setUniSeleccionada] = useState(user?.universidad || null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const guardar = async (universidad) => {
    const nombreTrim = nombre.trim()
    if (!nombreTrim) { setError('Escribe tu nombre para continuar'); return }
    setGuardando(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombreTrim, universidad: universidad || null })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar'); setGuardando(false); return }
      localStorage.setItem('onboarding_completo', 'true')
      onComplete(data.usuario)
    } catch (e) {
      setError('Error de conexión')
      setGuardando(false)
    }
  }

  return (
    <>
      <style>{ONB_CSS}</style>
      <div className="onb-root">
        <div className="onb-dots">
          <span className="onb-dot dim" />
          <span className="onb-dot on" />
          <span className="onb-dot dim" />
        </div>

        <div className="onb-hero">
          <h1 className="onb-title">¿Cómo te llamas?</h1>
          <p className="onb-sub">Solo necesitamos esto para empezar. Lo demás lo agregas después.</p>
        </div>

        <div className="onb-field">
          <input
            className="onb-input"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoFocus
            maxLength={60}
          />
        </div>

        <div className="onb-field">
          <div className="onb-label">🎓 Tu universidad</div>
          <div className="onb-uni-grid">
            {UNIVERSIDADES.map(u => (
              <button
                key={u.id}
                type="button"
                className={`onb-uni-chip ${uniSeleccionada === u.id ? 'active' : ''}`}
                onClick={() => { setUniSeleccionada(u.id); aplicarTema(u.id) }}
              >
                {u.logo}
                <span className="onb-uni-name">{u.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="onb-err">{error}</div>}

        <div className="onb-actions">
          <button
            className="onb-submit"
            disabled={!uniSeleccionada || !nombre.trim() || guardando}
            onClick={() => guardar(uniSeleccionada)}
          >
            {guardando ? 'Guardando...' : 'Entrar a la app →'}
          </button>
          <button
            className="onb-skip"
            disabled={guardando}
            onClick={() => guardar(null)}
          >
            Completar después
          </button>
        </div>
      </div>
    </>
  )
}
