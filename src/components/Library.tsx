import { useCallback, useEffect, useRef, useState } from 'react'
import { listBooks, removeBook, type Book } from '../lib/db'
import { ACCEPTED_FILES, importFiles } from '../lib/importBook'
import { forgetCover } from '../lib/coverUrls'
import { Cover } from './Cover'
import { Icon } from './Icon'

type Props = { onOpen: (book: Book) => void }

const percent = new Intl.NumberFormat('pt-BR', { style: 'percent' })

export function Library({ onOpen }: Props) {
  const [books, setBooks] = useState<Book[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => listBooks().then(setBooks), [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return
    setBusy(true)
    setMessage(null)
    const { imported, failed } = await importFiles(Array.from(files))
    setBusy(false)
    await refresh()
    if (failed.length) {
      setMessage(
        `${failed.length === 1 ? 'Este arquivo não pôde ser aberto' : 'Estes arquivos não puderam ser abertos'}: ${failed.join(', ')}. Use EPUB, PDF, MOBI, AZW3, FB2 ou CBZ.`,
      )
    } else if (imported.length > 1) {
      setMessage(`${imported.length} livros adicionados.`)
    }
  }

  const handleRemove = async (book: Book) => {
    if (!confirm(`Remover “${book.title}” da estante? Os destaques e marcadores dele também serão apagados.`)) return
    await removeBook(book.id)
    forgetCover(book.id)
    refresh()
  }

  const current = books?.find((book) => book.openedAt && book.progress < 0.995)
  const shelf = books?.filter((book) => book !== current) ?? []

  return (
    <div
      className={`library ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
    >
      <header className="library-header">
        <div className="brand">
          <img src="/icon.svg" alt="" width={32} height={32} />
          <span>MacReader</span>
        </div>
        <button className="button button-primary" onClick={() => input.current?.click()} disabled={busy}>
          <Icon name="mais" size={18} />
          {busy ? 'Adicionando…' : 'Adicionar livros'}
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_FILES}
          multiple
          hidden
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </header>

      {message && (
        <p className="notice" role="status">
          {message}
          <button className="icon-button" onClick={() => setMessage(null)} aria-label="Fechar aviso">
            <Icon name="fechar" size={18} />
          </button>
        </p>
      )}

      {books && books.length === 0 && (
        <section className="empty">
          <h1>Sua estante está vazia</h1>
          <p>
            Adicione livros em EPUB, PDF, MOBI, AZW3, FB2 ou CBZ. Eles ficam guardados neste aparelho, e você pode ler sem
            internet.
          </p>
          <button className="button button-primary" onClick={() => input.current?.click()}>
            <Icon name="mais" size={18} />
            Adicionar livros
          </button>
          <p className="empty-hint">No computador, você também pode arrastar os arquivos para esta janela.</p>
        </section>
      )}

      {current && (
        <section className="continue" aria-labelledby="continue-title">
          <button className="continue-cover" onClick={() => onOpen(current)} aria-label={`Continuar lendo ${current.title}`}>
            <Cover book={current} />
          </button>
          <div className="continue-info">
            <h1 id="continue-title">{current.title}</h1>
            {current.author && <p className="continue-author">{current.author}</p>}
            <div className="progress" aria-label={`Lido: ${percent.format(current.progress)}`}>
              <span style={{ width: `${current.progress * 100}%` }} />
            </div>
            <p className="continue-where">
              {percent.format(current.progress)} lido{current.chapter ? `, em “${current.chapter}”` : ''}
            </p>
            <button className="button button-primary" onClick={() => onOpen(current)}>
              Continuar leitura
            </button>
          </div>
        </section>
      )}

      {shelf.length > 0 && (
        <section className="shelf" aria-labelledby="shelf-title">
          <h2 id="shelf-title">{current ? 'Na estante' : 'Seus livros'}</h2>
          <ul className="shelf-grid">
            {shelf.map((book) => (
              <li key={book.id} className="shelf-item">
                <button className="shelf-open" onClick={() => onOpen(book)}>
                  <Cover book={book} />
                  <span className="shelf-title">{book.title}</span>
                  {book.author && <span className="shelf-author">{book.author}</span>}
                </button>
                <button
                  className="icon-button shelf-remove"
                  onClick={() => handleRemove(book)}
                  aria-label={`Remover ${book.title} da estante`}
                  title="Remover da estante"
                >
                  <Icon name="lixeira" size={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {current && (
        <p className="library-footnote">
          <button className="link-button" onClick={() => handleRemove(current)}>
            Remover “{current.title}” da estante
          </button>
        </p>
      )}
    </div>
  )
}
