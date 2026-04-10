import { useEffect } from 'react'
import { getTema } from './theme'

function aplicarTema(universidad) {
  if (!universidad) return
  const tema = getTema(universidad)
  const root = document.documentElement
  root.style.setProperty('--bg-primary', tema.bgPrimary)
  root.style.setProperty('--bg-secondary', tema.bgSecondary)
  root.style.setProperty('--bg-card', tema.bgCard)
  root.style.setProperty('--color-primary', tema.colorPrimary)
  root.style.setProperty('--color-secondary', tema.colorSecondary)
  root.style.setProperty('--color-accent', tema.colorAccent)
  root.style.setProperty('--gradient-from', tema.gradientFrom)
  root.style.setProperty('--gradient-to', tema.gradientTo)
  root.style.setProperty('--shadow-color', tema.shadowColor)
  root.style.setProperty('--text-primary', tema.darkText ? '#1a1a1a' : '#ffffff')
  root.style.setProperty('--text-secondary', tema.darkText ? '#444444' : 'rgba(255,255,255,0.6)')
}

export { aplicarTema }

export function useTheme(universidad) {
  useEffect(() => {
    aplicarTema(universidad)
  }, [universidad])
}
