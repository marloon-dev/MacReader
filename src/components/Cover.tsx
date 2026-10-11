import { coverUrl } from '../lib/coverUrls'
import type { Book } from '../lib/db'

/** Capa do livro; sem imagem, desenha uma capa de tecido com título e autor. */
export function Cover({ book, className = '' }: { book: Book; className?: string }) {
  const url = coverUrl(book)
  const started = book.progress > 0 && book.progress < 0.995

  return (
    <div className={`cover ${className}`}>
      {url ? (
        <img src={url} alt="" draggable={false} />
      ) : (
        <div className="cover-plain" aria-hidden="true">
          <span className="cover-plain-title">{book.title}</span>
          {book.author && <span className="cover-plain-author">{book.author}</span>}
        </div>
      )}
      {started && (
        <span className="ribbon" aria-hidden="true">
          {Math.round(book.progress * 100)}%
        </span>
      )}
    </div>
  )
}
