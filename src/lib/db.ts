// Banco local (IndexedDB): os livros, o arquivo de cada um e as anotações
// ficam no próprio aparelho. Nada sai dele.

export type Book = {
  id: string
  title: string
  author: string
  format: string
  size: number
  addedAt: number
  openedAt: number | null
  cover: Blob | null
  /** Posição salva (CFI) e progresso de 0 a 1. */
  location: string | null
  progress: number
  chapter: string | null
}

export type Annotation = {
  id: string
  bookId: string
  kind: 'highlight' | 'bookmark'
  /** CFI do trecho destacado ou da página marcada. */
  cfi: string
  text: string
  color: HighlightColor
  note: string
  chapter: string
  progress: number
  createdAt: number
}

export type HighlightColor = 'amarelo' | 'verde' | 'azul' | 'rosa'

const DB_NAME = 'macreader'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('books', { keyPath: 'id' })
      db.createObjectStore('files')
      const annotations = db.createObjectStore('annotations', { keyPath: 'id' })
      annotations.createIndex('bookId', 'bookId')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function done<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function store(name: string, mode: IDBTransactionMode = 'readonly') {
  return (await open()).transaction(name, mode).objectStore(name)
}

export async function listBooks(): Promise<Book[]> {
  const books = await done((await store('books')).getAll() as IDBRequest<Book[]>)
  return books.sort((a, b) => (b.openedAt ?? b.addedAt) - (a.openedAt ?? a.addedAt))
}

export async function getBook(id: string): Promise<Book | undefined> {
  return done((await store('books')).get(id) as IDBRequest<Book | undefined>)
}

export async function getBookFile(id: string): Promise<File | undefined> {
  return done((await store('files')).get(id) as IDBRequest<File | undefined>)
}

export async function addBook(book: Book, file: File): Promise<void> {
  const tx = (await open()).transaction(['books', 'files'], 'readwrite')
  tx.objectStore('books').put(book)
  tx.objectStore('files').put(file, book.id)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updateBook(id: string, changes: Partial<Book>): Promise<void> {
  const books = await store('books', 'readwrite')
  const book = await done(books.get(id) as IDBRequest<Book | undefined>)
  if (book) await done(books.put({ ...book, ...changes }))
}

export async function removeBook(id: string): Promise<void> {
  const annotations = await listAnnotations(id)
  const tx = (await open()).transaction(['books', 'files', 'annotations'], 'readwrite')
  tx.objectStore('books').delete(id)
  tx.objectStore('files').delete(id)
  for (const annotation of annotations) tx.objectStore('annotations').delete(annotation.id)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listAnnotations(bookId: string): Promise<Annotation[]> {
  const index = (await store('annotations')).index('bookId')
  const list = await done(index.getAll(bookId) as IDBRequest<Annotation[]>)
  return list.sort((a, b) => a.progress - b.progress)
}

export async function saveAnnotation(annotation: Annotation): Promise<void> {
  await done((await store('annotations', 'readwrite')).put(annotation))
}

export async function removeAnnotation(id: string): Promise<void> {
  await done((await store('annotations', 'readwrite')).delete(id))
}
