import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── Design tokens (matches mockup admin-dashboard-mockup.html) ────
const T = {
  bg: '#080d1a',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  primary: '#2e7dd1',
  primaryGlow: 'rgba(46,125,209,0.3)',
  secondary: '#5ba3e8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a78bfa',
  text: '#ffffff',
  textSoft: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.38)',
  sidebarW: 240,
  radius: 16,
}

// ── Estilos globales inline (animaciones, scrollbar) ─────────────
const ADMIN_CSS = `
  .admin-root { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  .admin-root ::-webkit-scrollbar { width: 6px; height: 6px; }
  .admin-root ::-webkit-scrollbar-track { background: transparent; }
  .admin-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  @keyframes adminPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .admin-tg-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399; animation: adminPulse 2s infinite; }
  .admin-row-hover:hover td { background: rgba(255,255,255,0.02); }
  .admin-side-item { transition: all 0.15s; }
  .admin-side-item:hover { background: ${T.bgCard}; color: ${T.text}; }
`

// Paleta de colores por universidad (para badges + barras)
const UNI_COLORS = {
  ufro:       { bg: '#003087', grad: 'linear-gradient(90deg,#003087,#2e7dd1)', label: 'UFRO', badge: 'blue' },
  inacap:     { bg: '#CC0000', grad: 'linear-gradient(90deg,#ef4444,#f87171)', label: 'INACAP', badge: 'red' },
  umayor:     { bg: '#F5C400', grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)', label: 'UMayor', badge: 'yellow' },
  uautonoma:  { bg: '#C8001E', grad: 'linear-gradient(90deg,#a78bfa,#c4b5fd)', label: 'U. Autónoma', badge: 'purple' },
  santotomas: { bg: '#00594F', grad: 'linear-gradient(90deg,#10b981,#34d399)', label: 'Santo Tomás', badge: 'green' },
  uctemuco:   { bg: '#1B3A6B', grad: 'linear-gradient(90deg,#06b6d4,#67e8f9)', label: 'UC Temuco', badge: 'blue' },
}

const badgeStyle = (tone) => {
  const m = {
    blue:   { bg: 'rgba(46,125,209,0.15)',  c: T.secondary, bd: 'rgba(46,125,209,0.3)' },
    red:    { bg: 'rgba(239,68,68,0.15)',   c: '#f87171',    bd: 'rgba(239,68,68,0.3)' },
    yellow: { bg: 'rgba(245,158,11,0.15)',  c: '#fbbf24',    bd: 'rgba(245,158,11,0.3)' },
    green:  { bg: 'rgba(16,185,129,0.15)',  c: '#34d399',    bd: 'rgba(16,185,129,0.3)' },
    purple: { bg: 'rgba(167,139,250,0.15)', c: '#c4b5fd',    bd: 'rgba(167,139,250,0.3)' },
    muted:  { bg: 'rgba(255,255,255,0.05)', c: T.textMuted,  bd: T.border },
  }
  const x = m[tone] || m.muted
  return { display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: x.bg, color: x.c, border: `1px solid ${x.bd}` }
}

// Helpers fetch con token
const authFetch = (path, opts = {}) => fetch(`${API}${path}`, {
  ...opts,
  headers: { ...(opts.headers || {}), Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Formateo "Ahora / hace Xh / ayer / hace X días"
function relativeTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 5) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'Ayer'
  if (diffD < 30) return `Hace ${diffD}d`
  return d.toLocaleDateString('es-CL')
}

function avatarColor(seed = '') {
  const palette = [
    ['#003087','#2e7dd1'], ['#7c3aed','#a78bfa'], ['#dc2626','#ef4444'],
    ['#d97706','#f59e0b'], ['#065f46','#10b981'], ['#0369a1','#06b6d4'],
  ]
  const i = (seed.charCodeAt(0) || 0) % palette.length
  return `linear-gradient(135deg, ${palette[i][0]}, ${palette[i][1]})`
}

// ═══════════════════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Admin({ usuario }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')

  if (!usuario || usuario.email !== 'abelespinozav@gmail.com') {
    return <div style={{ padding: 40, color: '#fff', background: T.bg, minHeight: '100vh' }}>Acceso denegado</div>
  }

  return (
    <>
      <style>{ADMIN_CSS}</style>
      <div className="admin-root" style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.text }}>
        <Sidebar tab={tab} setTab={setTab} usuario={usuario} onBack={() => navigate('/home')} />
        <main style={{ marginLeft: T.sidebarW, flex: 1, padding: 32, maxWidth: `calc(100vw - ${T.sidebarW}px)` }}>
          {tab === 'dashboard'   && <Dashboard />}
          {tab === 'usuarios'    && <Usuarios />}
          {tab === 'engagement'  && <Engagement />}
          {tab === 'novedades'   && <Novedades />}
          {tab === 'telegram'    && <TelegramBot />}
          {tab === 'config'         && <Configuracion />}
          {tab === 'notificaciones' && <NotificacionesAdmin />}
        </main>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
function Sidebar({ tab, setTab, usuario, onBack }) {
  const SideItem = ({ id, icon, label, badge }) => {
    const active = tab === id
    return (
      <a
        className="admin-side-item"
        onClick={() => setTab(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', margin: '1px 8px', borderRadius: 12,
          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          color: active ? T.secondary : T.textSoft,
          fontWeight: active ? 700 : 500,
          background: active ? 'rgba(46,125,209,0.15)' : 'transparent',
          textDecoration: 'none',
        }}
      >
        <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
        {label}
        {badge != null && (
          <span style={{ marginLeft: 'auto', background: T.danger, color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>{badge}</span>
        )}
      </a>
    )
  }
  const Section = ({ children }) => (
    <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted, marginTop: 12, marginBottom: 4 }}>{children}</div>
  )
  const inicial = (usuario?.nombre || usuario?.name || 'A')[0].toUpperCase()
  return (
    <aside style={{
      width: T.sidebarW, background: 'rgba(255,255,255,0.02)', borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 100, padding: '24px 0',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${T.border}`, marginBottom: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>APPrueba</span>
        <span style={{ display: 'inline-block', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 999, marginLeft: 6, verticalAlign: 'middle', textTransform: 'uppercase' }}>Admin</span>
      </div>

      <Section>General</Section>
      <SideItem id="dashboard"  icon="📊" label="Dashboard" />
      <SideItem id="usuarios"   icon="👥" label="Usuarios" />
      <SideItem id="engagement" icon="📈" label="Engagement" />

      <Section>Contenido</Section>
      <SideItem id="novedades" icon="📰" label="Novedades" />
      <SideItem id="telegram"  icon="🤖" label="Telegram Bot" />

      <Section>Sistema</Section>
      <SideItem id="config"        icon="⚙️" label="Configuración" />
      <SideItem id="notificaciones" icon="🔔" label="Notificaciones" />
      <a
        className="admin-side-item"
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', margin: '1px 8px', borderRadius: 12, cursor: 'pointer', fontSize: 13, color: T.textSoft, fontWeight: 500, textDecoration: 'none' }}
      >
        <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>↩️</span>
        Volver a la app
      </a>

      <div style={{ marginTop: 'auto', padding: 16, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #003087, #2e7dd1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{inicial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{usuario?.nombre || usuario?.name || 'Admin'}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>👑 CEO</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════
// PANELES COMPARTIDOS
// ═══════════════════════════════════════════════════════════════
function Panel({ title, action, children, noPadding }) {
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>{title}</div>
        {action && <div style={{ fontSize: 12, color: T.secondary, cursor: 'pointer', fontWeight: 600 }} onClick={action.onClick}>{action.label}</div>}
      </div>
      <div style={{ padding: noPadding ? 0 : 20 }}>{children}</div>
    </div>
  )
}

function MetricCard({ tone, icon, label, value, delta, deltaTone }) {
  const topGrad = {
    blue:   'linear-gradient(90deg, #2e7dd1, #5ba3e8)',
    green:  'linear-gradient(90deg, #10b981, #34d399)',
    yellow: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    purple: 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
  }[tone]
  const valueColor = { blue: T.secondary, green: '#34d399', yellow: '#fbbf24', purple: '#c4b5fd' }[tone]
  const deltaColor = deltaTone === 'up' ? '#34d399' : deltaTone === 'down' ? '#f87171' : T.textMuted
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '2px 2px 0 0', background: topGrad }} />
      <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 28, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8, color: valueColor }}>{value}</div>
      {delta && <div style={{ fontSize: 12, color: deltaColor, display: 'flex', alignItems: 'center', gap: 4 }}>{delta}</div>}
    </div>
  )
}

function PlaceholderPanel({ title }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Sección en desarrollo</div>
      </div>
      <Panel title="🚧 Próximamente">
        <p style={{ color: T.textMuted, fontSize: 13 }}>Esta sección aún no está implementada.</p>
      </Panel>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard() {
  const [stats, setStats] = useState(null)
  const [unis, setUnis] = useState([])
  const [actividad, setActividad] = useState([])
  useEffect(() => {
    authFetch('/admin/stats').then(r => r.json()).then(setStats).catch(() => {})
    authFetch('/admin/universidades-stats').then(r => r.json()).then(setUnis).catch(() => {})
    authFetch('/admin/actividad-diaria').then(r => r.json()).then(setActividad).catch(() => {})
  }, [])

  const maxAct = Math.max(1, ...actividad.map(a => a.usuarios))
  const totalUnis = unis.reduce((a, u) => a + parseInt(u.count), 0) || 1

  const hoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const s = stats?.stats || {}

  return (
    <>
      {/* TOPBAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)} · Última actualización ahora</div>
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard tone="blue"   icon="👥" label="Total usuarios" value={s.total_usuarios ?? '—'} delta={s.nuevos_7d ? `↑ +${s.nuevos_7d} esta semana` : ''} deltaTone="up" />
        <MetricCard tone="green"  icon="🟢" label="Activos hoy"    value={s.activos_hoy ?? '—'} delta={s.activos_7d ? `${s.activos_7d} esta semana` : ''} />
        <MetricCard tone="yellow" icon="🥇" label="Fundadores"     value={s.fundadores ?? '—'} delta="de 50 disponibles" />
        <MetricCard tone="purple" icon="📚" label="Ramos creados"  value={stats?.ramos ?? '—'} delta={stats?.evaluaciones ? `${stats.evaluaciones} evaluaciones` : ''} />
      </div>

      {/* CHART + UNI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Panel title="📈 Usuarios activos — últimos 14 días">
          {actividad.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Sin datos de actividad aún</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
                {actividad.map((a, i) => {
                  const pct = (a.usuarios / maxAct) * 100
                  const isToday = i === actividad.length - 1
                  const d = new Date(a.fecha)
                  const label = isToday ? 'Hoy' : `${d.getDate()}${d.toLocaleDateString('es', { month: 'short' }).charAt(0).toUpperCase()}`
                  return (
                    <div key={a.fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: isToday ? 'linear-gradient(180deg, #34d399, rgba(16,185,129,0.3))' : 'linear-gradient(180deg, #2e7dd1, rgba(46,125,209,0.3))', minHeight: 4, height: `${Math.max(4, pct)}%` }} />
                      <div style={{ fontSize: 9, color: isToday ? '#34d399' : T.textMuted }}>{label}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: T.primary }} /> Días anteriores
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34d399' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#34d399' }} /> Hoy
                </div>
              </div>
            </>
          )}
        </Panel>

        <Panel title="🎓 Por universidad">
          {unis.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Sin usuarios con universidad asignada</p>
          ) : (
            unis.map(u => {
              const info = UNI_COLORS[u.universidad] || { grad: 'linear-gradient(90deg,#60a5fa,#a78bfa)', label: u.universidad }
              const pct = (parseInt(u.count) / totalUnis) * 100
              return (
                <div key={u.universidad} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, width: 100, flexShrink: 0 }}>{info.label}</div>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: info.grad, width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, width: 36, textAlign: 'right' }}>{u.count}</div>
                </div>
              )
            })
          )}
        </Panel>
      </div>

      {/* USUARIOS RECIENTES */}
      <Panel title="👥 Usuarios recientes" noPadding>
        <UsuariosTable usuarios={(stats?.usuarios || []).slice(0, 5)} />
      </Panel>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// USUARIOS (sección completa)
// ═══════════════════════════════════════════════════════════════
function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_desc') // created_desc|created_asc|login_desc|login_asc|ramos_desc|ramos_asc
  const [page, setPage] = useState(0)
  const [detalle, setDetalle] = useState(null)
  const PAGE_SIZE = 20

  const reload = () => {
    authFetch('/admin/stats').then(r => r.json()).then(d => setUsuarios(d.usuarios || [])).catch(() => {})
  }
  useEffect(reload, [])

  const filtered = useMemo(() => {
    let list = usuarios
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(u => (u.nombre || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.universidad || '').toLowerCase().includes(q))
    if (filter === 'fundadores') list = list.filter(u => u.es_fundador)
    if (filter === 'activos') list = list.filter(u => u.last_login && (Date.now() - new Date(u.last_login).getTime()) < 24 * 3600_000)
    if (filter === 'sin_onboarding') list = list.filter(u => !u.universidad)
    const ts = v => v ? new Date(v).getTime() : 0
    const sorters = {
      created_desc: (a, b) => ts(b.created_at) - ts(a.created_at),
      created_asc:  (a, b) => ts(a.created_at) - ts(b.created_at),
      login_desc:   (a, b) => ts(b.last_login) - ts(a.last_login),
      login_asc:    (a, b) => ts(a.last_login) - ts(b.last_login),
      ramos_desc:   (a, b) => (b.ramos_count || 0) - (a.ramos_count || 0),
      ramos_asc:    (a, b) => (a.ramos_count || 0) - (b.ramos_count || 0),
    }
    return [...list].sort(sorters[sortBy] || sorters.created_desc)
  }, [usuarios, search, filter, sortBy])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario? Se borrarán sus ramos y evaluaciones.')) return
    const res = await authFetch(`/admin/usuario/${id}`, { method: 'DELETE' })
    if (res.ok) reload()
  }

  const verDetalle = async (id) => {
    setDetalle({ loading: true, id })
    try {
      const res = await authFetch(`/admin/usuario/${id}/detalle`)
      const data = await res.json()
      setDetalle({ id, data })
    } catch {
      setDetalle({ id, error: 'Error al cargar' })
    }
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Usuarios</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{usuarios.length} usuarios registrados</div>
      </div>

      <Panel title="👥 Lista de usuarios" noPadding>
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', marginBottom: 16 }}>
            <span>🔍</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Buscar por nombre, email o universidad..."
              style={{ background: 'none', border: 'none', outline: 'none', color: T.text, fontSize: 13, flex: 1, fontFamily: 'inherit' }}
            />
            <span style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} resultados</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['todos', 'Todos'], ['fundadores', 'Fundadores'], ['activos', 'Activos hoy'], ['sin_onboarding', 'Sin onboarding']].map(([k, l]) => {
                const active = filter === k
                return (
                  <div key={k} onClick={() => { setFilter(k); setPage(0) }} style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: active ? T.secondary : T.textMuted, border: `1px solid ${active ? 'rgba(46,125,209,0.3)' : 'transparent'}`, background: active ? 'rgba(46,125,209,0.15)' : 'transparent' }}>{l}</div>
                )
              })}
            </div>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(0) }} style={{ ...inputStyle, width: 'auto', padding: '7px 12px', fontSize: 12, marginLeft: 'auto' }}>
              <option value="created_desc" style={{ background: '#0f1424' }}>Registro: más reciente</option>
              <option value="created_asc"  style={{ background: '#0f1424' }}>Registro: más antiguo</option>
              <option value="login_desc"   style={{ background: '#0f1424' }}>Último acceso: más reciente</option>
              <option value="login_asc"    style={{ background: '#0f1424' }}>Último acceso: más antiguo</option>
              <option value="ramos_desc"   style={{ background: '#0f1424' }}>Ramos: más a menos</option>
              <option value="ramos_asc"    style={{ background: '#0f1424' }}>Ramos: menos a más</option>
            </select>
          </div>
        </div>

        <UsuariosTable usuarios={paginated} onVer={verDetalle} onEliminar={eliminar} />

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderTop: `1px solid ${T.border}` }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '6px 14px', borderRadius: 8, background: T.bgCard, color: T.text, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontFamily: 'inherit' }}>← Anterior</button>
            <span style={{ fontSize: 12, color: T.textMuted }}>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: '6px 14px', borderRadius: 8, background: T.bgCard, color: T.text, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontFamily: 'inherit' }}>Siguiente →</button>
          </div>
        )}
      </Panel>

      {detalle && <UsuarioDetalleModal detalle={detalle} onClose={() => setDetalle(null)} />}
    </>
  )
}

function UsuariosTable({ usuarios = [], onVer, onEliminar }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            {['Usuario', 'Universidad', 'Ramos', 'Último acceso', 'Estado', ''].map((h, i) => (
              <th key={i} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Sin usuarios para mostrar</td></tr>
          ) : usuarios.map(u => {
            const isCEO = u.email === 'abelespinozav@gmail.com' || u.email === 'alvaro@menz.cl'
            const uniInfo = UNI_COLORS[u.universidad]
            const ramos = u.ramos_count || 0
            const estadoBadge = isCEO
              ? { label: '👑 CEO', tone: 'purple' }
              : u.es_fundador
                ? { label: `🥇 Fundador #${u.numero_registro || '?'}`, tone: 'yellow' }
                : !u.universidad
                  ? { label: 'Sin onboarding', tone: 'muted' }
                  : { label: 'Activa', tone: 'green' }
            return (
              <tr key={u.id} className="admin-row-hover">
                <td style={tdCell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(u.nombre || u.email || 'U'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {(u.nombre || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{u.nombre || '(sin nombre)'}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={tdCell}>
                  {uniInfo
                    ? <span style={badgeStyle(uniInfo.badge)}>{uniInfo.label}</span>
                    : <span style={{ fontSize: 11, color: T.textMuted }}>—</span>}
                </td>
                <td style={tdCell}>{ramos}</td>
                <td style={{ ...tdCell, color: u.last_login && (Date.now() - new Date(u.last_login).getTime()) < 300_000 ? '#34d399' : T.textSoft }}>
                  {relativeTime(u.last_login)}
                </td>
                <td style={tdCell}><span style={badgeStyle(estadoBadge.tone)}>{estadoBadge.label}</span></td>
                <td style={tdCell}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {onVer && <button onClick={() => onVer(u.id)} style={tdBtn()}>Ver</button>}
                    {onEliminar && !isCEO && <button onClick={() => onEliminar(u.id)} style={tdBtn(true)}>🗑</button>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const tdCell = { padding: '12px 16px', fontSize: 13, color: T.textSoft, borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }
const tdBtn = (danger = false) => ({
  padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : T.border}`,
  background: T.bgCard, color: danger ? '#f87171' : T.textSoft, fontFamily: 'inherit',
})

function UsuarioDetalleModal({ detalle, onClose }) {
  const d = detalle?.data
  const [limites, setLimites] = useState({ planes_limite: '', quizzes_limite: '', podcasts_limite: '', ejercicios_limite: '' })
  const [limiteGlobal, setLimiteGlobal] = useState(100)
  const [guardandoLim, setGuardandoLim] = useState(false)
  const [mensajeLim, setMensajeLim] = useState('')
  useEffect(() => {
    if (!d?.usuario) return
    setLimites({
      planes_limite:     d.usuario.planes_limite     ?? '',
      quizzes_limite:    d.usuario.quizzes_limite    ?? '',
      podcasts_limite:   d.usuario.podcasts_limite   ?? '',
      ejercicios_limite: d.usuario.ejercicios_limite ?? '',
    })
    setLimiteGlobal(d.limiteGlobal || 100)
  }, [d?.usuario?.id])
  const guardarLimites = async () => {
    if (!d?.usuario?.id) return
    setGuardandoLim(true)
    setMensajeLim('')
    try {
      const body = {}
      for (const k of ['planes_limite', 'quizzes_limite', 'podcasts_limite', 'ejercicios_limite']) {
        body[k] = limites[k] === '' ? null : parseInt(limites[k])
      }
      const res = await authFetch(`/admin/usuarios/${d.usuario.id}/limites`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setMensajeLim(res.ok ? '✅ Límites guardados' : '❌ Error al guardar')
    } catch {
      setMensajeLim('❌ Error de conexión')
    }
    setGuardandoLim(false)
    setTimeout(() => setMensajeLim(''), 2500)
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 60px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0f1424', border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, maxWidth: 720, width: '100%', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Detalle de usuario</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        {detalle.loading && <p style={{ color: T.textMuted }}>Cargando...</p>}
        {detalle.error && <p style={{ color: '#f87171' }}>{detalle.error}</p>}
        {d && (
          <>
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{d.usuario?.nombre || '(sin nombre)'}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>{d.usuario?.email}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div><span style={{ color: T.textMuted }}>Universidad:</span> <strong>{UNI_COLORS[d.usuario?.universidad]?.label || d.usuario?.universidad || '—'}</strong></div>
                <div><span style={{ color: T.textMuted }}>Carrera:</span> <strong>{d.usuario?.carrera || '—'}</strong></div>
                <div><span style={{ color: T.textMuted }}>Registrado:</span> <strong>{d.usuario?.created_at ? new Date(d.usuario.created_at).toLocaleDateString('es-CL') : '—'}</strong></div>
                <div><span style={{ color: T.textMuted }}>Último acceso:</span> <strong>{relativeTime(d.usuario?.last_login)}</strong></div>
                {d.usuario?.fecha_nacimiento && (() => {
                  const fn = new Date(d.usuario.fecha_nacimiento)
                  if (isNaN(fn.getTime())) return null
                  const hoy = new Date()
                  let edad = hoy.getFullYear() - fn.getFullYear()
                  const m = hoy.getMonth() - fn.getMonth()
                  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--
                  const cumple = new Date(hoy.getFullYear(), fn.getMonth(), fn.getDate())
                  if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1)
                  const diasParaCumple = Math.round((cumple - hoy) / (1000 * 60 * 60 * 24))
                  const cumpleLabel = diasParaCumple === 0 ? '🎉 ¡Hoy!' : diasParaCumple <= 30 ? `En ${diasParaCumple}d` : fn.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
                  return (
                    <>
                      <div><span style={{ color: T.textMuted }}>Edad:</span> <strong>{edad} años</strong></div>
                      <div><span style={{ color: T.textMuted }}>Cumpleaños:</span> <strong>{cumpleLabel}</strong></div>
                    </>
                  )
                })()}
              </div>
            </div>
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 10 }}>Límites individuales</div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 12px' }}>Vacío = usar global ({limiteGlobal}). El uso actual aparece como "usados/límite efectivo".</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                {[
                  ['planes_limite',     'Planes IA',    d.usuario?.planes_usados],
                  ['quizzes_limite',    'Quizzes',      d.usuario?.quizzes_usados],
                  ['podcasts_limite',   'Podcasts',     d.usuario?.podcasts_usados],
                  ['ejercicios_limite', 'Ejercicios PDF', d.usuario?.ejercicios_usados],
                ].map(([k, label, usados]) => {
                  const efectivo = limites[k] === '' ? limiteGlobal : parseInt(limites[k])
                  return (
                    <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: T.textMuted, fontSize: 11 }}>{label} — {usados || 0}/{isNaN(efectivo) ? '?' : efectivo}</span>
                      <input
                        type="number" min="0"
                        value={limites[k]}
                        onChange={e => setLimites({ ...limites, [k]: e.target.value })}
                        placeholder={`Global (${limiteGlobal})`}
                        style={{ ...inputStyle, padding: '8px 10px' }}
                      />
                    </label>
                  )
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <button onClick={guardarLimites} disabled={guardandoLim} style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #003087, #2e7dd1)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: guardandoLim ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {guardandoLim ? 'Guardando...' : 'Guardar límites'}
                </button>
                {mensajeLim && <span style={{ fontSize: 12, color: mensajeLim.startsWith('✅') ? '#34d399' : '#f87171' }}>{mensajeLim}</span>}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 10 }}>Ramos ({(d.ramos || []).length})</div>
            {(d.ramos || []).length === 0 ? (
              <p style={{ fontSize: 13, color: T.textMuted }}>Sin ramos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.ramos.map(r => (
                  <div key={r.id} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{r.nombre}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>Min: {r.min_aprobacion} · {r.evaluaciones_count || 0} evaluaciones</div>
                    </div>
                    {r.promedio != null && <div style={{ fontSize: 16, fontWeight: 900, color: r.promedio >= 4 ? '#34d399' : '#f87171' }}>{parseFloat(r.promedio).toFixed(1)}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ENGAGEMENT
// ═══════════════════════════════════════════════════════════════
function Engagement() {
  const [actividad, setActividad] = useState([])
  const [stats, setStats] = useState(null)
  useEffect(() => {
    authFetch('/admin/actividad-diaria').then(r => r.json()).then(setActividad).catch(() => {})
    authFetch('/admin/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])
  const totalAct = actividad.reduce((a, x) => a + x.usuarios, 0)
  const avg = actividad.length > 0 ? (totalAct / actividad.length).toFixed(1) : '—'
  const maxAct = Math.max(1, ...actividad.map(a => a.usuarios))

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Engagement</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Actividad y uso de la plataforma</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard tone="green"  icon="🟢" label="Activos hoy"         value={stats?.stats?.activos_hoy ?? '—'} />
        <MetricCard tone="blue"   icon="📅" label="Activos esta semana" value={stats?.stats?.activos_7d ?? '—'} />
        <MetricCard tone="purple" icon="📊" label="DAU promedio (14d)"  value={avg} />
        <MetricCard tone="yellow" icon="⚡" label="Pico del período"    value={maxAct} />
      </div>

      <Panel title="📈 Usuarios activos — últimos 14 días">
        {actividad.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Sin datos aún</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, padding: '0 4px' }}>
            {actividad.map((a, i) => {
              const pct = (a.usuarios / maxAct) * 100
              const isToday = i === actividad.length - 1
              const d = new Date(a.fecha)
              return (
                <div key={a.fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>{a.usuarios}</div>
                  <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: isToday ? 'linear-gradient(180deg, #34d399, rgba(16,185,129,0.3))' : 'linear-gradient(180deg, #2e7dd1, rgba(46,125,209,0.3))', minHeight: 4, height: `${Math.max(4, pct)}%` }} />
                  <div style={{ fontSize: 10, color: isToday ? '#34d399' : T.textMuted }}>{isToday ? 'Hoy' : `${d.getDate()}/${d.getMonth() + 1}`}</div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES ADMIN
// ═══════════════════════════════════════════════════════════════
function NotificacionesAdmin() {
  const [stats, setStats] = useState({ total_usuarios: 0, con_push: 0, sin_push: 0 })
  const [usuarios, setUsuarios] = useState([])
  const [individualForm, setIndividualForm] = useState({ usuario_id: '', titulo: '', mensaje: '' })
  const [broadcastForm, setBroadcastForm] = useState({ titulo: '', mensaje: '' })
  const [msgIndividual, setMsgIndividual] = useState('')
  const [msgBroadcast, setMsgBroadcast] = useState('')
  const [busy, setBusy] = useState(false)

  const recargarStats = () =>
    authFetch('/admin/push-stats').then(r => r.json()).then(setStats).catch(() => {})
  useEffect(() => {
    recargarStats()
    authFetch('/admin/stats').then(r => r.json()).then(d => setUsuarios(d.usuarios || [])).catch(() => {})
  }, [])

  const resumenEnvio = (data) => {
    // Formato: "N enviadas · M vencidas (limpiadas) · K fallidas · Total T"
    const partes = [`${data.enviadas || 0} enviadas`]
    if (data.vencidas > 0) partes.push(`${data.vencidas} vencidas (limpiadas)`)
    if (data.fallidas > 0) partes.push(`${data.fallidas} fallidas`)
    partes.push(`Total ${data.total}`)
    return '✅ ' + partes.join(' · ')
  }

  const enviarIndividual = async () => {
    if (!individualForm.usuario_id || !individualForm.titulo.trim() || !individualForm.mensaje.trim()) {
      setMsgIndividual('Completa usuario, título y mensaje')
      return
    }
    setBusy(true)
    setMsgIndividual('')
    try {
      const res = await authFetch('/admin/notificacion-individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: parseInt(individualForm.usuario_id),
          titulo: individualForm.titulo,
          mensaje: individualForm.mensaje
        })
      })
      const data = await res.json()
      if (!res.ok) setMsgIndividual('❌ ' + (data.error || 'Error'))
      else if (data.sin_push) setMsgIndividual('⚠️ Usuario sin suscripción push activa')
      else setMsgIndividual(resumenEnvio(data))
      if (res.ok && !data.sin_push) setIndividualForm({ usuario_id: individualForm.usuario_id, titulo: '', mensaje: '' })
      if (data?.vencidas > 0) recargarStats() // el backend limpió subs muertas
    } catch { setMsgIndividual('❌ Error de conexión') }
    setBusy(false)
  }

  const enviarBroadcast = async () => {
    if (!broadcastForm.titulo.trim() || !broadcastForm.mensaje.trim()) {
      setMsgBroadcast('Completa título y mensaje')
      return
    }
    if (!window.confirm(`¿Enviar a los ${stats.con_push} usuarios con push activo?`)) return
    setBusy(true)
    setMsgBroadcast('')
    try {
      const res = await authFetch('/admin/notificacion-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm)
      })
      const data = await res.json()
      if (!res.ok) setMsgBroadcast('❌ ' + (data.error || 'Error'))
      else {
        setMsgBroadcast(resumenEnvio(data))
        setBroadcastForm({ titulo: '', mensaje: '' })
      }
      if (data?.vencidas > 0) recargarStats() // refleja subs eliminadas
    } catch { setMsgBroadcast('❌ Error de conexión') }
    setBusy(false)
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Notificaciones</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Push individual o broadcast a todos los usuarios</div>
      </div>

      <Panel title="📡 Estado de suscripciones">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            ['Total usuarios', stats.total_usuarios, T.textSoft],
            ['Con push activo', stats.con_push, '#34d399'],
            ['Sin push', stats.sin_push, T.textMuted],
          ].map(([label, value, color]) => (
            <div key={label} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ height: 20 }} />

      <Panel title="👤 Envío individual">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select
            value={individualForm.usuario_id}
            onChange={e => setIndividualForm({ ...individualForm, usuario_id: e.target.value })}
            style={inputStyle}
          >
            <option value="" style={{ background: '#0f1424' }}>— Selecciona usuario —</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id} style={{ background: '#0f1424' }}>
                {u.nombre || '(sin nombre)'} · {u.email}
              </option>
            ))}
          </select>
          <input
            placeholder="Título"
            value={individualForm.titulo}
            onChange={e => setIndividualForm({ ...individualForm, titulo: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Mensaje"
            rows={3}
            value={individualForm.mensaje}
            onChange={e => setIndividualForm({ ...individualForm, mensaje: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={enviarIndividual} disabled={busy} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #003087, #2e7dd1)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {busy ? 'Enviando...' : 'Enviar'}
            </button>
            {msgIndividual && <span style={{ fontSize: 12, color: msgIndividual.startsWith('✅') ? '#34d399' : msgIndividual.startsWith('⚠️') ? '#fbbf24' : '#f87171' }}>{msgIndividual}</span>}
          </div>
        </div>
      </Panel>

      <div style={{ height: 20 }} />

      <Panel title="📣 Broadcast a todos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Se envía a los {stats.con_push} usuarios con push activo. Acción no reversible.</p>
          <input
            placeholder="Título"
            value={broadcastForm.titulo}
            onChange={e => setBroadcastForm({ ...broadcastForm, titulo: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Mensaje"
            rows={3}
            value={broadcastForm.mensaje}
            onChange={e => setBroadcastForm({ ...broadcastForm, mensaje: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={enviarBroadcast} disabled={busy || stats.con_push === 0} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #991b1b, #ef4444)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: (busy || stats.con_push === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: stats.con_push === 0 ? 0.5 : 1 }}>
              {busy ? 'Enviando...' : '📣 Broadcast'}
            </button>
            {msgBroadcast && <span style={{ fontSize: 12, color: msgBroadcast.startsWith('✅') ? '#34d399' : '#f87171' }}>{msgBroadcast}</span>}
          </div>
        </div>
      </Panel>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// NOVEDADES
// ═══════════════════════════════════════════════════════════════
function Novedades() {
  const [items, setItems] = useState([])
  const [mostrando, setMostrando] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', universidad: 'ufro', tipo: 'Anuncio', emoji: '📢', color: '#2e7dd1', expira_en: '' })
  const [filterUni, setFilterUni] = useState('todas')
  const [sortOrder, setSortOrder] = useState('reciente') // reciente | antigua

  const reload = () => authFetch('/admin/novedades').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {})
  useEffect(reload, [])

  const filtered = useMemo(() => {
    let list = items
    if (filterUni !== 'todas') list = list.filter(n => n.universidad === filterUni)
    list = [...list].sort((a, b) => {
      const ta = new Date(a.creada_en).getTime() || 0
      const tb = new Date(b.creada_en).getTime() || 0
      return sortOrder === 'reciente' ? tb - ta : ta - tb
    })
    return list
  }, [items, filterUni, sortOrder])

  const crear = async () => {
    if (!form.titulo.trim()) return
    const body = { ...form, expira_en: form.expira_en || null }
    const res = await authFetch('/novedades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setMostrando(false)
      setForm({ titulo: '', descripcion: '', universidad: 'ufro', tipo: 'Anuncio', emoji: '📢', color: '#2e7dd1', expira_en: '' })
      reload()
    }
  }
  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta novedad?')) return
    const res = await authFetch(`/novedades/${id}`, { method: 'DELETE' })
    if (res.ok) reload()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Novedades</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{items.length} total · {items.filter(n => n.activa).length} activas</div>
        </div>
        <button onClick={() => setMostrando(true)} style={{ padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #003087, #2e7dd1)', color: '#fff', boxShadow: '0 4px 16px rgba(46,125,209,0.3)', fontFamily: 'inherit' }}>+ Nueva novedad</button>
      </div>

      <Panel title="📰 Listado" noPadding>
        <div style={{ padding: '14px 16px 6px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${T.border}` }}>
          <select value={filterUni} onChange={e => setFilterUni(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '7px 12px', fontSize: 12 }}>
            <option value="todas" style={{ background: '#0f1424' }}>Todas las universidades</option>
            {Object.keys(UNI_COLORS).map(u => <option key={u} value={u} style={{ background: '#0f1424' }}>{UNI_COLORS[u].label}</option>)}
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '7px 12px', fontSize: 12 }}>
            <option value="reciente" style={{ background: '#0f1424' }}>Más reciente primero</option>
            <option value="antigua" style={{ background: '#0f1424' }}>Más antigua primero</option>
          </select>
          <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 'auto' }}>{filtered.length} resultados</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          {filtered.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Sin novedades</p>
          ) : filtered.map(n => {
            const origenBadge = n.origen === 'telegram' ? { bg: 'rgba(46,125,209,0.15)', c: T.secondary } : n.origen === 'scrape' ? { bg: 'rgba(167,139,250,0.15)', c: '#c4b5fd' } : { bg: 'rgba(16,185,129,0.15)', c: '#34d399' }
            const estado = !n.activa ? 'Inactiva' : n.expira_en && new Date(n.expira_en) < new Date() ? 'Expirada' : 'Activa'
            const estadoTone = estado === 'Activa' ? 'green' : estado === 'Expirada' ? 'muted' : 'red'
            return (
              <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: origenBadge.bg }}>{n.emoji || '📰'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.titulo}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    {n.origen || 'admin'} · {UNI_COLORS[n.universidad]?.label || n.universidad} · {relativeTime(n.creada_en)}
                    {n.expira_en && ` · Expira ${new Date(n.expira_en).toLocaleDateString('es-CL')}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={badgeStyle(estadoTone)}>{estado}</span>
                  <button onClick={() => eliminar(n.id)} style={tdBtn(true)}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {mostrando && (
        <div onClick={() => setMostrando(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f1424', border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, maxWidth: 480, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>+ Nueva novedad</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Título" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} />
              <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={form.universidad} onChange={e => setForm({ ...form, universidad: e.target.value })} style={inputStyle}>
                  {Object.keys(UNI_COLORS).map(u => <option key={u} value={u} style={{ background: '#0f1424' }}>{UNI_COLORS[u].label}</option>)}
                </select>
                <input type="date" placeholder="Expira en" value={form.expira_en} onChange={e => setForm({ ...form, expira_en: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input placeholder="Tipo (ej: Anuncio)" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle} />
                <input placeholder="Emoji" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setMostrando(false)} style={{ flex: 1, padding: 11, borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={crear} style={{ flex: 2, padding: 11, borderRadius: 10, background: 'linear-gradient(135deg, #003087, #2e7dd1)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Publicar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, borderRadius: 10,
  padding: '10px 13px', fontSize: 13, color: T.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
}

// ═══════════════════════════════════════════════════════════════
// TELEGRAM BOT
// ═══════════════════════════════════════════════════════════════
function TelegramBot() {
  // Valores por defecto SEGUROS — todos los tipos que el render espera
  // existen desde el primer frame (object con campos base, arrays vacíos).
  const [telegramStats, setTelegramStats] = useState({ activo: false, username: '', total_publicaciones: 0 })
  const [allowlist, setAllowlist] = useState([])
  const [ultimasPublicaciones, setUltimasPublicaciones] = useState([])

  useEffect(() => {
    authFetch('/admin/telegram/status')
      .then(r => r.json())
      .then(data => {
        const d = data || {}
        setTelegramStats({
          activo: !!d.activo,
          username: d.username || 'apprueba_bot',
          total_publicaciones: d.total_publicaciones || 0
        })
        setAllowlist(Array.isArray(d.allowlist) ? d.allowlist : [])
        setUltimasPublicaciones(Array.isArray(d.ultimas_publicaciones) ? d.ultimas_publicaciones : [])
      })
      .catch(() => {
        setTelegramStats({ activo: false, username: 'apprueba_bot', total_publicaciones: 0 })
        setAllowlist([])
        setUltimasPublicaciones([])
      })
  }, [])

  const activo = telegramStats.activo
  const lista = allowlist || []
  const pubs = ultimasPublicaciones || []

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Telegram Bot</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Estado del bot y publicaciones recientes</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Panel title="🤖 Estado del bot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: activo ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${activo ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, marginBottom: 16 }}>
            <div className="admin-tg-dot" style={{ background: activo ? '#34d399' : '#f87171', boxShadow: `0 0 8px ${activo ? '#34d399' : '#f87171'}` }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: activo ? '#34d399' : '#f87171' }}>{activo ? 'Bot activo' : 'Bot inactivo'}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginLeft: 'auto' }}>@{telegramStats.username || 'apprueba_bot'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: '#34d399' }}>{telegramStats.total_publicaciones}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Publicaciones</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: T.secondary }}>{lista.length}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Autorizados</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 8 }}>Allowlist</div>
          {lista.length === 0 ? (
            <p style={{ fontSize: 12, color: T.textMuted }}>Sin usuarios autorizados</p>
          ) : (
            lista.map((id, i) => (
              <div key={id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span>{i === 0 ? '👑' : '👤'}</span>
                <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{i === 0 ? 'Owner' : `Editor ${i}`}</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace' }}>ID: {id}</div>
              </div>
            ))
          )}
        </Panel>

        <Panel title="📰 Últimas publicaciones">
          {pubs.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Sin publicaciones aún</p>
          ) : (
            pubs.map((n, i) => (
              <div key={n.id || i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: 'rgba(245,158,11,0.15)', flexShrink: 0 }}>{n.emoji || '📢'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.titulo || '(sin título)'}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{relativeTime(n.creada_en)}</div>
                </div>
              </div>
            ))
          )}
        </Panel>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
function Configuracion() {
  const [limite, setLimite] = useState(100)
  const [limiteInput, setLimiteInput] = useState('100')
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    authFetch('/admin/limite-global').then(r => r.json()).then(d => {
      if (d?.limite_global != null) { setLimite(d.limite_global); setLimiteInput(String(d.limite_global)) }
    }).catch(() => {})
  }, [])

  const aplicar = async () => {
    const n = parseInt(limiteInput, 10)
    if (isNaN(n) || n < 0) return setMensaje({ tipo: 'err', txt: 'Número inválido' })
    const res = await authFetch('/admin/limite-global', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limite: n }) })
    if (res.ok) { setLimite(n); setMensaje({ tipo: 'ok', txt: 'Actualizado' }) }
    setTimeout(() => setMensaje(null), 2500)
  }

  const resetear = async () => {
    if (!window.confirm('¿Resetear contadores de TODOS los usuarios?')) return
    const res = await authFetch('/admin/reset-contadores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: null }) })
    if (res.ok) setMensaje({ tipo: 'ok', txt: 'Contadores reseteados' })
    setTimeout(() => setMensaje(null), 2500)
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Configuración</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Parámetros globales de la plataforma</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Panel title="⚡ Límite global de uso IA">
          <p style={{ color: T.textSoft, fontSize: 13, marginBottom: 16 }}>
            Máximo de podcasts, ejercicios, quizzes y planes que puede generar cada usuario. Aplica a los 4 contadores por separado.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="number" min="0" max="10000" value={limiteInput} onChange={e => setLimiteInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={aplicar} style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #003087, #2e7dd1)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Guardar</button>
          </div>
          <p style={{ fontSize: 11, color: T.textMuted, marginTop: 10 }}>Actual: <strong style={{ color: T.text }}>{limite}</strong></p>
        </Panel>

        <Panel title="🧹 Resetear contadores">
          <p style={{ color: T.textSoft, fontSize: 13, marginBottom: 16 }}>
            Resetea a 0 los contadores `podcasts_usados`, `ejercicios_usados`, `quizzes_usados` y `planes_usados` de todos los usuarios.
          </p>
          <button onClick={resetear} style={{ width: '100%', padding: 11, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🧹 Resetear contadores de todos</button>
        </Panel>
      </div>

      {mensaje && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: mensaje.tipo === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${mensaje.tipo === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: mensaje.tipo === 'ok' ? '#34d399' : '#f87171', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
          {mensaje.tipo === 'ok' ? '✅' : '⚠️'} {mensaje.txt}
        </div>
      )}
    </>
  )
}
