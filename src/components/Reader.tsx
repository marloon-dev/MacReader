import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  getBookFile,
  listAnnotations,
  removeAnnotation,
  saveAnnotation,
  updateBook,
  type Annotation,
  type Book,
  type HighlightColor,
} from '../lib/db'
import { createAnnotation, highlightColors } from '../lib/annotations'
import { loadFoliate, loadOverlayer, type FoliateView, type RelocateDetail, type TocItem } from '../lib/foliate'
import { bookCss, layoutAttributes } from '../lib/readerStyle'
import { loadSettings, resolvePalette, saveSettings, type ReadingSettings } from '../lib/settings'
import { Icon } from './Icon'
import { AnnotationList, TocList } from './ReaderPanels'
import { ReaderSettings } from './ReaderSettings'

type Props = { book: Book; onClose: () => void }

type Panel = 'sumario' | 'anotacoes' | 'texto' | null

type Selection = { cfi: string; text: string; x: number; y: number }

type Popover = { annotation: Annotation; x: number; y: number }

const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 })

/** Mantém a barra flutuante inteira dentro da janela. */
const toolbarLeft = (x: number) => Math.min(Math.max(x, 130), innerWidth - 130)

function useSystemDark() {
  const query = '(prefers-color-scheme: dark)'
  const [dark, setDark] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const media = matchMedia(query)
    const listener = () => setDark(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  return dark
}

/** Posição de um retângulo de dentro da página (iframe) na janela do app. */
function toWindow(doc: Document, rect: DOMRect) {
  const frame = doc.defaultView?.frameElement?.getBoundingClientRect()
  return { x: (frame?.left ?? 0) + rect.left + rect.width / 2, y: (frame?.top ?? 0) + rect.top }
}

export function Reader({ book, onClose }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<FoliateView | null>(null)
  const annotationsRef = useRef<Annotation[]>([])
  const lastAnnotationTap = useRef(0)

  const [settings, setSettings] = useState<ReadingSettings>(loadSettings)
  const systemDark = useSystemDark()
  const palette = resolvePalette(settings.theme, systemDark)

  const [status, setStatus] = useState<'carregando' | 'pronto' | 'erro'>('carregando')
  const [toc, setToc] = useState<TocItem[]>([])
  const [fixedLayout, setFixedLayout] = useState(false)
  const [location, setLocation] = useState<RelocateDetail | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [panel, setPanel] = useState<Panel>(null)
  const [chromeHidden, setChromeHidden] = useState(false)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [popover, setPopover] = useState<Popover | null>(null)

  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  const applyStyles = useCallback(() => {
    const view = viewRef.current
    if (!view?.renderer) return
    view.renderer.setStyles?.(bookCss(settings, palette))
    if (!view.isFixedLayout) {
      for (const [name, value] of Object.entries(layoutAttributes(settings))) view.renderer.setAttribute(name, value)
    }
  }, [settings, palette])

  // Abre o livro uma vez.
  useEffect(() => {
    let cancelled = false
    let saveTimer: number | undefined
    const view = document.createElement('foliate-view') as FoliateView

    const start = async () => {
      await loadFoliate()
      const { Overlayer } = await loadOverlayer()
      const file = await getBookFile(book.id)
      if (!file) throw new Error('Arquivo do livro não encontrado no aparelho')
      if (cancelled) return
      host.current?.append(view)
      viewRef.current = view
      await view.open(file)

      const saved = await listAnnotations(book.id)
      setAnnotations(saved)
      annotationsRef.current = saved

      view.addEventListener('relocate', (event) => {
        const detail = (event as CustomEvent<RelocateDetail>).detail
        setLocation(detail)
        window.clearTimeout(saveTimer)
        saveTimer = window.setTimeout(() => {
          updateBook(book.id, {
            location: detail.cfi,
            progress: detail.fraction,
            chapter: detail.tocItem?.label?.trim() || null,
            openedAt: Date.now(),
          })
        }, 400)
      })

      view.addEventListener('create-overlay', () => {
        for (const annotation of annotationsRef.current) {
          if (annotation.kind === 'highlight') view.addAnnotation({ value: annotation.cfi, color: annotation.color })
        }
      })

      view.addEventListener('draw-annotation', (event) => {
        const { draw, annotation } = (event as CustomEvent).detail
        draw(Overlayer.highlight, { color: highlightColors[annotation.color as HighlightColor] ?? highlightColors.amarelo })
      })

      view.addEventListener('show-annotation', (event) => {
        const { value, range } = (event as CustomEvent<{ value: string; range: Range }>).detail
        const annotation = annotationsRef.current.find((item) => item.cfi === value)
        if (!annotation) return
        lastAnnotationTap.current = Date.now()
        const doc = range.startContainer.ownerDocument
        const point = doc ? toWindow(doc, range.getBoundingClientRect()) : { x: innerWidth / 2, y: innerHeight / 2 }
        setPopover({ annotation, ...point })
      })

      view.addEventListener('load', (event) => {
        const { doc, index } = (event as CustomEvent<{ doc: Document; index: number }>).detail
        doc.addEventListener('keydown', handleKey)

        const checkSelection = () => {
          const selected = doc.getSelection()
          if (!selected || selected.isCollapsed || !selected.rangeCount) return setSelection(null)
          const text = selected.toString().trim()
          if (!text) return setSelection(null)
          const range = selected.getRangeAt(0)
          setSelection({ cfi: view.getCFI(index, range), text, ...toWindow(doc, range.getBoundingClientRect()) })
        }
        doc.addEventListener('pointerup', () => setTimeout(checkSelection, 10))
        doc.addEventListener('selectionchange', () => {
          if (doc.getSelection()?.isCollapsed) setSelection(null)
        })
        // No Android a seleção é feita pelo toque longo, sem pointerup confiável.
        doc.addEventListener('contextmenu', () => setTimeout(checkSelection, 10))

        doc.addEventListener('click', (click) => {
          const target = click.target as Element | null
          if (target?.closest?.('a[href]')) return
          if (!doc.getSelection()?.isCollapsed) return
          setTimeout(() => {
            if (Date.now() - lastAnnotationTap.current < 300) return
            const frame = doc.defaultView?.frameElement?.getBoundingClientRect()
            const x = (frame?.left ?? 0) + click.clientX
            const width = host.current?.clientWidth ?? innerWidth
            if (x < width * 0.25) view.goLeft()
            else if (x > width * 0.75) view.goRight()
            else setChromeHidden((hidden) => !hidden)
          }, 0)
        })
      })

      setToc(view.book.toc ?? [])
      setFixedLayout(view.isFixedLayout)
      await view.init({ lastLocation: book.location, showTextStart: !book.location })
      if (!cancelled) setStatus('pronto')
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') view.goLeft()
      else if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') view.goRight()
      else if (event.key === 'Escape') setPanel(null)
    }
    document.addEventListener('keydown', handleKey)

    start().catch((error) => {
      console.error(error)
      if (!cancelled) setStatus('erro')
    })

    return () => {
      cancelled = true
      window.clearTimeout(saveTimer)
      document.removeEventListener('keydown', handleKey)
      view.close?.()
      view.remove()
      viewRef.current = null
    }
  }, [book.id, book.location])

  useEffect(() => {
    if (status === 'pronto') applyStyles()
  }, [status, applyStyles])

  const changeSettings = (next: ReadingSettings) => {
    setSettings(next)
    saveSettings(next)
  }

  const currentHref = location?.tocItem?.href ?? null
  const chapter = location?.tocItem?.label?.trim() ?? ''
  const fraction = location?.fraction ?? book.progress
  const total = location?.location?.total ?? 0
  const pageBookmark = annotations.find(
    (annotation) =>
      annotation.kind === 'bookmark' && total > 0 && Math.abs(annotation.progress - fraction) < 0.5 / total,
  )

  const toggleBookmark = async () => {
    if (!location) return
    if (pageBookmark) {
      await removeAnnotation(pageBookmark.id)
      setAnnotations((list) => list.filter((item) => item.id !== pageBookmark.id))
      return
    }
    const bookmark = createAnnotation({
      bookId: book.id,
      kind: 'bookmark',
      cfi: location.cfi,
      chapter,
      progress: location.fraction,
    })
    await saveAnnotation(bookmark)
    setAnnotations((list) => [...list, bookmark].sort((a, b) => a.progress - b.progress))
  }

  const addHighlight = async (color: HighlightColor) => {
    if (!selection) return
    const highlight = createAnnotation({
      bookId: book.id,
      kind: 'highlight',
      cfi: selection.cfi,
      text: selection.text,
      color,
      chapter,
      progress: location?.fraction ?? 0,
    })
    await saveAnnotation(highlight)
    setAnnotations((list) => [...list, highlight].sort((a, b) => a.progress - b.progress))
    viewRef.current?.addAnnotation({ value: highlight.cfi, color })
    viewRef.current?.deselect()
    setSelection(null)
  }

  const copySelection = async () => {
    if (!selection) return
    try {
      await navigator.clipboard.writeText(selection.text)
    } catch {
      // Sem acesso à área de transferência: o texto continua selecionado para copiar pelo sistema.
      return
    }
    viewRef.current?.deselect()
    setSelection(null)
  }

  const removeItem = async (annotation: Annotation) => {
    await removeAnnotation(annotation.id)
    if (annotation.kind === 'highlight') viewRef.current?.deleteAnnotation({ value: annotation.cfi })
    setAnnotations((list) => list.filter((item) => item.id !== annotation.id))
    setPopover(null)
  }

  const editNote = async (annotation: Annotation) => {
    const note = prompt('Nota para este destaque:', annotation.note)
    if (note === null) return
    const updated = { ...annotation, note: note.trim() }
    await saveAnnotation(updated)
    setAnnotations((list) => list.map((item) => (item.id === updated.id ? updated : item)))
    setPopover(null)
  }

  const go = (target: string) => {
    viewRef.current?.goTo(target)
    setPanel(null)
  }

  const theme = palette.name

  return (
    <div
      className={`reader theme-${theme} ${chromeHidden ? 'chrome-hidden' : ''}`}
      style={{ background: palette.background, color: palette.text }}
    >
      <header className="reader-top">
        <button className="icon-button" onClick={onClose} aria-label="Voltar para a estante" title="Estante">
          <Icon name="voltar" />
        </button>
        <div className="reader-title">
          <span>{book.title}</span>
          {chapter && <span className="reader-chapter">{chapter}</span>}
        </div>
        <button
          className={`icon-button ${panel === 'sumario' ? 'is-active' : ''}`}
          onClick={() => setPanel(panel === 'sumario' ? null : 'sumario')}
          aria-label="Sumário"
          title="Sumário"
        >
          <Icon name="sumario" />
        </button>
        <button
          className={`icon-button ${panel === 'anotacoes' ? 'is-active' : ''}`}
          onClick={() => setPanel(panel === 'anotacoes' ? null : 'anotacoes')}
          aria-label="Marcadores e destaques"
          title="Marcadores e destaques"
        >
          <Icon name="nota" />
        </button>
        <button
          className={`icon-button ${panel === 'texto' ? 'is-active' : ''}`}
          onClick={() => setPanel(panel === 'texto' ? null : 'texto')}
          aria-label="Aparência do texto"
          title="Aparência do texto"
        >
          <Icon name="texto" />
        </button>
        <button
          className={`icon-button bookmark-toggle ${pageBookmark ? 'is-marked' : ''}`}
          onClick={toggleBookmark}
          aria-label={pageBookmark ? 'Tirar marcador desta página' : 'Marcar esta página'}
          aria-pressed={Boolean(pageBookmark)}
          title={pageBookmark ? 'Tirar marcador' : 'Marcar página'}
        >
          <Icon name={pageBookmark ? 'marcadorCheio' : 'marcador'} />
        </button>
      </header>

      <div className="reader-stage" ref={host} />

      {status === 'carregando' && <p className="reader-status">Abrindo o livro…</p>}
      {status === 'erro' && (
        <div className="reader-status" role="alert">
          <p>Não foi possível abrir este livro. O arquivo pode estar corrompido ou protegido por DRM.</p>
          <button className="button" onClick={onClose}>
            Voltar para a estante
          </button>
        </div>
      )}

      <footer className="reader-bottom">
        <button className="icon-button" onClick={() => viewRef.current?.goLeft()} aria-label="Página anterior">
          <Icon name="esquerda" />
        </button>
        <input
          type="range"
          className="reader-progress"
          min={0}
          max={1}
          step="any"
          value={fraction}
          aria-label="Posição no livro"
          aria-valuetext={percent.format(fraction)}
          onChange={(event) => viewRef.current?.goToFraction(Number(event.target.value))}
          style={{ '--fraction': fraction } as CSSProperties}
        />
        <span className="reader-percent">{percent.format(fraction)}</span>
        <button className="icon-button" onClick={() => viewRef.current?.goRight()} aria-label="Próxima página">
          <Icon name="direita" />
        </button>
      </footer>

      {panel && (
        <>
          <div className="panel-backdrop" onClick={() => setPanel(null)} />
          <aside
            className={`panel panel-${panel}`}
            aria-label={panel === 'sumario' ? 'Sumário' : panel === 'anotacoes' ? 'Marcadores e destaques' : 'Aparência do texto'}
          >
            <header className="panel-header">
              <h2>{panel === 'sumario' ? 'Sumário' : panel === 'anotacoes' ? 'Marcadores e destaques' : 'Aparência'}</h2>
              <button className="icon-button" onClick={() => setPanel(null)} aria-label="Fechar">
                <Icon name="fechar" />
              </button>
            </header>
            <div className="panel-body">
              {panel === 'sumario' && <TocList items={toc} currentHref={currentHref} onGo={go} />}
              {panel === 'anotacoes' && (
                <AnnotationList annotations={annotations} onGo={(item) => go(item.cfi)} onRemove={removeItem} />
              )}
              {panel === 'texto' && (
                <ReaderSettings settings={settings} fixedLayout={fixedLayout} onChange={changeSettings} />
              )}
            </div>
          </aside>
        </>
      )}

      {selection && (
        <div
          className="floating-toolbar"
          style={{ left: toolbarLeft(selection.x), top: Math.max(selection.y - 56, 8) }}
          role="toolbar"
          aria-label="Ações para o trecho selecionado"
        >
          {(Object.keys(highlightColors) as HighlightColor[]).map((color) => (
            <button
              key={color}
              className="swatch"
              style={{ background: highlightColors[color] }}
              onClick={() => addHighlight(color)}
              aria-label={`Destacar em ${color}`}
              title={`Destacar em ${color}`}
            />
          ))}
          <button className="toolbar-text" onClick={copySelection}>
            Copiar
          </button>
        </div>
      )}

      {popover && (
        <>
          <div className="popover-backdrop" onClick={() => setPopover(null)} />
          <div
            className="floating-toolbar"
            style={{ left: toolbarLeft(popover.x), top: Math.max(popover.y - 56, 8) }}
            role="toolbar"
            aria-label="Ações do destaque"
          >
            <button className="toolbar-text" onClick={() => editNote(popover.annotation)}>
              {popover.annotation.note ? 'Editar nota' : 'Adicionar nota'}
            </button>
            <button className="toolbar-text" onClick={() => removeItem(popover.annotation)}>
              Apagar destaque
            </button>
          </div>
        </>
      )}
    </div>
  )
}
