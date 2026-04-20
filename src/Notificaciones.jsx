import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const getToken = () => localStorage.getItem('token')
const authHeaders = (extra = {}) => ({ ...extra, 'Authorization': `Bearer ${getToken()}` })

async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const reg = await navigator.serviceWorker.register('/sw.js')
  return reg
}

async function suscribirPush(reg, vapidKey) {
  console.log('[notif] suscribirPush: llamando pushManager.subscribe...')
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey)
  })
  console.log('[notif] suscribirPush: subscription creada', sub.toJSON())
  try {
    const res = await fetch(`${API}/notificaciones/subscribe`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ subscription: sub.toJSON() })
    })
    const bodyTxt = await res.text()
    console.log('[notif] POST /notificaciones/subscribe →', res.status, bodyTxt)
    if (!res.ok) console.error('[notif] subscribe NO OK:', res.status, bodyTxt)
  } catch(e) {
    console.error('[notif] POST /notificaciones/subscribe falló:', e)
    throw e
  }
  return sub
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function useNotificaciones() {
  const [permiso, setPermiso] = useState(Notification.permission)
  const [config, setConfig] = useState({ dias_antes: [1, 2, 5], activo: true, notif_clases: true, notif_ventanas: true })
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    fetch(`${API}/notificaciones/config`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setConfig(d) })
      .catch(() => {})
  }, [])

  const activar = async () => {
    console.log('[notif] activar: inicio')
    setCargando(true)
    try {
      const perm = await Notification.requestPermission()
      console.log('[notif] requestPermission →', perm)
      setPermiso(perm)
      if (perm !== 'granted') {
        console.warn('[notif] permiso NO granted — abortando activar()')
        return
      }
      const vapidRes = await fetch(`${API}/notificaciones/vapid-key`).then(r => r.json())
      console.log('[notif] vapid-key response:', vapidRes)
      const { publicKey } = vapidRes
      if (!publicKey) {
        console.error('[notif] VAPID publicKey vacía — abortando')
        return
      }
      const reg = await registrarServiceWorker()
      console.log('[notif] registrarServiceWorker →', reg)
      if (!reg) {
        console.error('[notif] SW registration null — browser no soporta push? abortando')
        return
      }
      const sub = await suscribirPush(reg, publicKey)
      console.log('[notif] suscribirPush OK:', sub?.endpoint)
      await guardarConfig({ ...config, activo: true })
      console.log('[notif] guardarConfig OK — activar() completo')
    } catch(e) {
      console.error('[notif] activar() threw:', e)
    }
    setCargando(false)
  }

  const guardarConfig = async (nueva) => {
    setConfig(nueva)
    await fetch(`${API}/notificaciones/config`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(nueva)
    })
  }

  return { permiso, config, cargando, activar, guardarConfig }
}

export default function PanelNotificaciones({ onClose, proximas = [] }) {
  const { permiso, config, cargando, activar, guardarConfig } = useNotificaciones()
  const DIAS_OPCIONES = [1, 2, 3, 5, 7]

  const toggleDia = (dia) => {
    const actual = config.dias_antes || []
    const nuevo = actual.includes(dia) ? actual.filter(d => d !== dia) : actual.length < 3 ? [...actual, dia] : actual
    guardarConfig({ ...config, dias_antes: nuevo })
  }

  const toggleActivo = () => guardarConfig({ ...config, activo: !config.activo })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: '#1a2744', borderRadius: '24px 24px 0 0', padding: 24, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: 18, fontWeight: 800 }}>🔔 Notificaciones</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Estado del permiso */}
        {permiso === 'default' && (
          <div style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <p style={{ color: 'white', margin: '0 0 12px', fontSize: 14 }}>Activa las notificaciones para recibir recordatorios de tus evaluaciones 📚</p>
            <button onClick={activar} disabled={cargando} style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', borderRadius: 12, padding: '10px 20px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {cargando ? 'Activando...' : '🔔 Activar notificaciones'}
            </button>
          </div>
        )}

        {permiso === 'denied' && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <p style={{ color: '#f87171', margin: 0, fontSize: 14 }}>⚠️ Las notificaciones están bloqueadas. Actívalas desde la configuración de tu navegador.</p>
          </div>
        )}

        {permiso === 'granted' && (
          <>
            {/* Toggle activo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              <div>
                <p style={{ color: 'white', margin: 0, fontWeight: 700, fontSize: 14 }}>Recordatorios activos</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontSize: 12 }}>Recibir alertas antes de evaluaciones</p>
              </div>
              <div onClick={toggleActivo} style={{ width: 48, height: 26, background: config.activo ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)', borderRadius: 99, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: config.activo ? 24 : 3, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
              </div>
            </div>

            {/* Toggle clases próximas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              <div>
                <p style={{ color: 'white', margin: 0, fontWeight: 700, fontSize: 14 }}>🏫 Clases próximas</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontSize: 12 }}>Aviso 15 min antes de cada clase</p>
              </div>
              <div onClick={() => guardarConfig({ ...config, notif_clases: !config.notif_clases })} style={{ width: 48, height: 26, background: config.notif_clases ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)', borderRadius: 99, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: config.notif_clases ? 24 : 3, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
              </div>
            </div>

            {/* Toggle ventanas de estudio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              <div>
                <p style={{ color: 'white', margin: 0, fontWeight: 700, fontSize: 14 }}>📖 Ventanas de estudio</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontSize: 12 }}>Aviso diario cuando tienes tiempo libre</p>
              </div>
              <div onClick={() => guardarConfig({ ...config, notif_ventanas: !config.notif_ventanas })} style={{ width: 48, height: 26, background: config.notif_ventanas ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)', borderRadius: 99, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: config.notif_ventanas ? 24 : 3, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
              </div>
            </div>

            {/* Días de anticipación */}
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ color: 'white', margin: '0 0 12px', fontWeight: 700, fontSize: 14 }}>⏰ Avisar con anticipación</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', fontSize: 12 }}>Selecciona hasta 3 opciones</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DIAS_OPCIONES.map(d => {
                  const sel = (config.dias_antes || []).includes(d)
                  return (
                    <button key={d} onClick={() => toggleDia(d)} style={{ background: sel ? 'rgba(46,125,209,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${sel ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '8px 14px', color: sel ? 'var(--color-secondary)' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {d === 1 ? '1 día antes' : `${d} días antes`}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Próximas evaluaciones */}
        {proximas.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px' }}>
            <p style={{ color: 'white', margin: '0 0 12px', fontWeight: 700, fontSize: 14 }}>📅 Próximas evaluaciones</p>
            {proximas.map((ev, i) => {
              const dias = Math.ceil((new Date(ev.fecha) - new Date()) / 86400000)
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < proximas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div>
                    <p style={{ color: 'white', margin: 0, fontSize: 13, fontWeight: 600 }}>{ev.nombre}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 11 }}>{ev.ramoNombre}</p>
                  </div>
                  <span style={{ background: dias <= 1 ? 'rgba(248,113,113,0.2)' : dias <= 3 ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.2)', color: dias <= 1 ? '#f87171' : dias <= 3 ? '#fbbf24' : '#4ade80', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                    {dias === 0 ? '¡Hoy!' : dias === 1 ? 'Mañana' : `${dias} días`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
