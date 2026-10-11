import { highlightColors } from '../lib/annotations'
import type { Annotation } from '../lib/db'
import type { TocItem } from '../lib/foliate'
import { Icon } from './Icon'

const percent = new Intl.NumberFormat('pt-BR', { style: 'percent' })

export function TocList({
  items,
  currentHref,
  onGo,
}: {
  items: TocItem[]
  currentHref: string | null
  onGo: (href: string) => void
}) {
  if (!items.length) return <p className="panel-empty">Este livro não tem sumário.</p>
  return (
    <ol className="toc">
      {items.map((item, index) => (
        <li key={`${item.href}-${index}`}>
          <button
            className={`toc-item ${item.href === currentHref ? 'is-current' : ''}`}
            aria-current={item.href === currentHref ? 'location' : undefined}
            onClick={() => onGo(item.href)}
          >
            {item.label.trim() || 'Sem título'}
          </button>
          {item.subitems?.length ? <TocList items={item.subitems} currentHref={currentHref} onGo={onGo} /> : null}
        </li>
      ))}
    </ol>
  )
}

export function AnnotationList({
  annotations,
  onGo,
  onRemove,
}: {
  annotations: Annotation[]
  onGo: (annotation: Annotation) => void
  onRemove: (annotation: Annotation) => void
}) {
  if (!annotations.length) {
    return (
      <p className="panel-empty">
        Nenhum marcador ou destaque ainda. Toque no ícone de marcador para guardar a página, ou selecione um trecho para
        destacá-lo.
      </p>
    )
  }
  return (
    <ul className="annotations">
      {annotations.map((annotation) => (
        <li key={annotation.id} className="annotation">
          <button className="annotation-open" onClick={() => onGo(annotation)}>
            {annotation.kind === 'bookmark' ? (
              <span className="annotation-kind">
                <Icon name="marcadorCheio" size={16} /> Marcador
              </span>
            ) : (
              <span className="annotation-text" style={{ borderColor: highlightColors[annotation.color] }}>
                {annotation.text}
              </span>
            )}
            {annotation.note && <span className="annotation-note">{annotation.note}</span>}
            <span className="annotation-where">
              {[annotation.chapter, percent.format(annotation.progress)].filter(Boolean).join(', ')}
            </span>
          </button>
          <button
            className="icon-button"
            onClick={() => onRemove(annotation)}
            aria-label={annotation.kind === 'bookmark' ? 'Apagar marcador' : 'Apagar destaque'}
            title="Apagar"
          >
            <Icon name="lixeira" size={18} />
          </button>
        </li>
      ))}
    </ul>
  )
}
