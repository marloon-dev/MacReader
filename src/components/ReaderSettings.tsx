import type { ReadingSettings } from '../lib/settings'

type Props = {
  settings: ReadingSettings
  fixedLayout: boolean
  onChange: (settings: ReadingSettings) => void
}

type Option<T> = { value: T; label: string }

function Choice<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      <div className="choice-options">
        {options.map((option) => (
          <button
            key={String(option.value)}
            className={`choice-option ${option.value === value ? 'is-selected' : ''}`}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Stepper({
  label,
  display,
  onLess,
  onMore,
  lessLabel,
  moreLabel,
}: {
  label: string
  display: string
  onLess: () => void
  onMore: () => void
  lessLabel: string
  moreLabel: string
}) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button className="choice-option" onClick={onLess} aria-label={lessLabel}>
          −
        </button>
        <output aria-live="polite">{display}</output>
        <button className="choice-option" onClick={onMore} aria-label={moreLabel}>
          +
        </button>
      </div>
    </div>
  )
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function ReaderSettings({ settings, fixedLayout, onChange }: Props) {
  const set = <K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="reader-settings">
      <Choice
        label="Tema"
        value={settings.theme}
        onChange={(value) => set('theme', value)}
        options={[
          { value: 'auto', label: 'Automático' },
          { value: 'papel', label: 'Papel' },
          { value: 'sepia', label: 'Sépia' },
          { value: 'noite', label: 'Noite' },
        ]}
      />
      {fixedLayout ? (
        <p className="settings-note">Este livro tem páginas de layout fixo (como PDF), então fonte e margens não mudam.</p>
      ) : (
        <>
          <Choice
            label="Fonte"
            value={settings.font}
            onChange={(value) => set('font', value)}
            options={[
              { value: 'literata', label: 'Literata' },
              { value: 'atkinson', label: 'Atkinson' },
              { value: 'livro', label: 'Do livro' },
            ]}
          />
          <Stepper
            label="Tamanho do texto"
            display={`${settings.fontSize}%`}
            lessLabel="Diminuir texto"
            moreLabel="Aumentar texto"
            onLess={() => set('fontSize', clamp(settings.fontSize - 10, 70, 220))}
            onMore={() => set('fontSize', clamp(settings.fontSize + 10, 70, 220))}
          />
          <Stepper
            label="Espaço entre linhas"
            display={settings.lineHeight.toFixed(2).replace('.', ',')}
            lessLabel="Diminuir espaço entre linhas"
            moreLabel="Aumentar espaço entre linhas"
            onLess={() => set('lineHeight', clamp(Math.round((settings.lineHeight - 0.1) * 100) / 100, 1.1, 2.2))}
            onMore={() => set('lineHeight', clamp(Math.round((settings.lineHeight + 0.1) * 100) / 100, 1.1, 2.2))}
          />
          <Choice
            label="Margens"
            value={settings.margin}
            onChange={(value) => set('margin', value)}
            options={[
              { value: 'estreita', label: 'Estreitas' },
              { value: 'media', label: 'Médias' },
              { value: 'larga', label: 'Largas' },
            ]}
          />
          <Choice
            label="Leitura"
            value={settings.flow}
            onChange={(value) => set('flow', value)}
            options={[
              { value: 'paginado', label: 'Por páginas' },
              { value: 'rolagem', label: 'Rolagem' },
            ]}
          />
          <Choice
            label="Alinhamento"
            value={settings.justify}
            onChange={(value) => set('justify', value)}
            options={[
              { value: true, label: 'Justificado' },
              { value: false, label: 'À esquerda' },
            ]}
          />
        </>
      )}
    </div>
  )
}
