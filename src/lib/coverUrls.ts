import type { Book } from './db'

// Uma URL por capa, reaproveitada entre as telas.
const coverUrls = new Map<string, string>()

export function coverUrl(book: Book): string | null {
  if (!book.cover) return null
  let url = coverUrls.get(book.id)
  if (!url) {
    url = URL.createObjectURL(book.cover)
    coverUrls.set(book.id, url)
  }
  return url
}

export function forgetCover(bookId: string): void {
  const url = coverUrls.get(bookId)
  if (url) URL.revokeObjectURL(url)
  coverUrls.delete(bookId)
}
