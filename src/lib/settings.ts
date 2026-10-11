// Preferências de leitura, guardadas no aparelho.

export type ReadingTheme = 'auto' | 'papel' | 'sepia' | 'noite'
export type ReadingFont = 'livro' | 'literata' | 'atkinson'
export type ReadingMargin = 'estreita' | 'media' | 'larga'
export type ReadingFlow = 'paginado' | 'rolagem'

export type ReadingSettings = {
  theme: ReadingTheme
  font: ReadingFont
  fontSize: number
  lineHeight: number
  margin: ReadingMargin
  flow: ReadingFlow
  justify: boolean
}

export const defaultSettings: ReadingSettings = {
  theme: 'auto',
  font: 'literata',
  fontSize: 110,
  lineHeight: 1.55,
  margin: 'media',
  flow: 'paginado',
  justify: true,
}

const KEY = 'macreader:leitura'

export function loadSettings(): ReadingSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { ...defaultSettings, ...saved }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: ReadingSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Sem armazenamento (ex.: janela anônima): as preferências valem só nesta sessão.
  }
}

export type Palette = { name: Exclude<ReadingTheme, 'auto'>; background: string; text: string; muted: string; link: string }

export const palettes: Record<Exclude<ReadingTheme, 'auto'>, Palette> = {
  papel: { name: 'papel', background: '#FAF7F0', text: '#1E2128', muted: '#6B6F78', link: '#2A4C8A' },
  sepia: { name: 'sepia', background: '#F1E6D0', text: '#3A2E22', muted: '#7A6852', link: '#7A4A12' },
  noite: { name: 'noite', background: '#14171C', text: '#D9D4CA', muted: '#8C8A85', link: '#9DB8E8' },
}

export function resolvePalette(theme: ReadingTheme, systemDark: boolean): Palette {
  if (theme === 'auto') return systemDark ? palettes.noite : palettes.papel
  return palettes[theme]
}
