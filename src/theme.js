export const TEMAS = {
  default: {
    bgPrimary: '#0a0a1a',
    bgSecondary: '#1a1a2e',
    bgCard: '#16213e',
    colorPrimary: '#6c63ff',
    colorSecondary: '#a78bfa',
    colorAccent: '#8b5cf6',
    gradientFrom: '#6c63ff',
    gradientTo: '#a78bfa',
    shadowColor: 'rgba(108,99,255,0.4)',
  },
  ufro: {
    bgPrimary: '#020d1f',
    bgSecondary: '#0a1f3d',
    bgCard: '#0d2347',
    colorPrimary: '#2e7dd1',
    colorSecondary: '#5ba3e8',
    colorAccent: '#C9A84C',
    gradientFrom: '#003087',
    gradientTo: '#2e7dd1',
    shadowColor: 'rgba(46,125,209,0.3)',
  },
  mayor: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#161616',
    bgCard: '#1f1f1f',
    // Primary moderado (gold) para fondos de botón y nav activo —
    // antes era #F5C800 (amarillo banana) que quemaba como bg grande.
    // El amarillo vivo se reserva ahora para secondary (gradient/hover)
    // y el brightest para accents puntuales (flame, badges, glows).
    colorPrimary: '#c9a800',
    colorSecondary: '#F5C800',
    colorAccent: '#FFD93D',
    gradientFrom: '#1a1a1a',
    gradientTo: '#c9a800',
    shadowColor: 'rgba(201,168,0,0.35)',
  },
  autonoma: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#1a1a1a',
    bgCard: '#2a2a2a',
    colorPrimary: '#cc2200',
    colorSecondary: '#ff4422',
    colorAccent: '#aa1a00',
    gradientFrom: '#1a1a1a',
    gradientTo: '#cc2200',
    shadowColor: 'rgba(204,34,0,0.4)',
  },
  inacap: {
    bgPrimary: '#0f0a0a',
    bgSecondary: '#1a0a0a',
    bgCard: '#1f1010',
    colorPrimary: '#c8001e',
    colorSecondary: '#ff3347',
    colorAccent: '#e8001e',
    gradientFrom: '#c8001e',
    gradientTo: '#ff3347',
    shadowColor: 'rgba(200,0,30,0.4)',
  },
  stoomas: {
    bgPrimary: '#0a1a0f',
    bgSecondary: '#1a4a2e',
    bgCard: '#0f3320',
    colorPrimary: '#4caf50',
    colorSecondary: '#81c784',
    colorAccent: '#388e3c',
    gradientFrom: '#1a4a2e',
    gradientTo: '#4caf50',
    shadowColor: 'rgba(76,175,80,0.4)',
  },
  uctemuco: {
    bgPrimary: '#0a0f1a',
    bgSecondary: '#001a4d',
    bgCard: '#0a1535',
    colorPrimary: '#4a90d9',
    colorSecondary: '#F5C400',
    colorAccent: '#2176cc',
    gradientFrom: '#003087',
    gradientTo: '#F5C400',
    shadowColor: 'rgba(74,144,217,0.4)',
  },
}

export function getTema(universidad) {
  const map = {
    'ufro': 'ufro',
    'umayor': 'mayor',
    'mayor': 'mayor',
    'uautonoma': 'autonoma',
    'autonoma': 'autonoma',
    'inacap': 'inacap',
    'santotomas': 'stoomas',
    'stoomas': 'stoomas',
    'uctemuco': 'uctemuco',
  }
  return TEMAS[map[universidad]] || TEMAS.default
}

// Universidades cuyo --color-primary es tan oscuro/saturado que
// texto en ese color no se lee bien sobre var(--bg-card); forzar blanco.
const UNIS_FONDO_FUERTE = new Set(['uautonoma', 'inacap', 'santotomas', 'uctemuco'])
export function colorTextoSobreHeader(universidad, fallback = 'var(--color-primary)') {
  return UNIS_FONDO_FUERTE.has(universidad) ? 'white' : fallback
}

// En el onboarding el botón es translúcido con borde; forzar blanco
// también para UFRO donde colorPrincipal es azul oscuro.
const UNIS_PRIMARIO_OSCURO = new Set(['ufro', 'uautonoma', 'inacap', 'santotomas', 'uctemuco'])
export function colorTextoSobrePrimarioOscuro(universidad, fallback) {
  return UNIS_PRIMARIO_OSCURO.has(universidad) ? 'white' : fallback
}
