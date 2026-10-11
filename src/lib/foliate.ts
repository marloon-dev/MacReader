// Ponte com o foliate-js (public/foliate-js, licença MIT), que lê EPUB, MOBI,
// AZW3, FB2, CBZ e PDF. Ele é servido como arquivos estáticos, sem passar pelo
// empacotador, porque carrega partes de si mesmo por caminho relativo.

type LanguageMap = string | Record<string, string> | undefined
type Contributor = string | { name?: LanguageMap } | Array<string | { name?: LanguageMap }>

export type TocItem = {
  label: string
  href: string
  subitems?: TocItem[]
}

export type FoliateBook = {
  metadata?: { title?: LanguageMap; author?: Contributor; language?: string | string[] }
  toc?: TocItem[]
  dir?: string
  getCover?: () => Promise<Blob | null> | Blob | null
}

export type RelocateDetail = {
  fraction: number
  cfi: string
  tocItem?: { label?: string; href?: string }
  location?: { current: number; total: number }
}

export type FoliateRenderer = HTMLElement & {
  setStyles?: (css: string) => void
  next: () => Promise<void>
  prev: () => Promise<void>
}

export type FoliateView = HTMLElement & {
  book: FoliateBook
  renderer: FoliateRenderer
  isFixedLayout: boolean
  lastLocation: RelocateDetail | null
  open: (file: File) => Promise<void>
  close: () => void
  init: (options: { lastLocation?: string | null; showTextStart?: boolean }) => Promise<void>
  goTo: (target: string | number) => Promise<unknown>
  goToFraction: (fraction: number) => Promise<void>
  goLeft: () => Promise<void>
  goRight: () => Promise<void>
  prev: () => Promise<void>
  next: () => Promise<void>
  getCFI: (index: number, range: Range) => string
  getSectionFractions: () => number[]
  addAnnotation: (annotation: { value: string; color?: string }) => Promise<unknown>
  deleteAnnotation: (annotation: { value: string }) => Promise<unknown>
  deselect: () => void
}

type ViewModule = { makeBook: (file: File) => Promise<FoliateBook> }
type OverlayerModule = { Overlayer: { highlight: unknown } }

const base = () => new URL('foliate-js/', document.baseURI).href

let viewModule: Promise<ViewModule> | null = null

/** Carrega o foliate-js uma vez; isso também registra o elemento <foliate-view>. */
export function loadFoliate(): Promise<ViewModule> {
  viewModule ??= import(/* @vite-ignore */ base() + 'view.js') as Promise<ViewModule>
  return viewModule
}

export async function loadOverlayer(): Promise<OverlayerModule> {
  return import(/* @vite-ignore */ base() + 'overlayer.js') as Promise<OverlayerModule>
}

export function readLanguageMap(value: LanguageMap): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return Object.values(value)[0] ?? ''
}

export function readContributor(value: Contributor | undefined): string {
  if (!value) return ''
  const list = Array.isArray(value) ? value : [value]
  const names = list
    .map((item) => (typeof item === 'string' ? item : readLanguageMap(item.name)))
    .filter(Boolean)
  return new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(names)
}

export type BookInfo = { title: string; author: string; cover: Blob | null }

/** Lê título, autor e capa sem abrir o livro na tela. */
export async function readBookInfo(file: File): Promise<BookInfo> {
  const { makeBook } = await loadFoliate()
  const book = await makeBook(file)
  const fallback = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
  let cover: Blob | null = null
  try {
    cover = (await book.getCover?.()) ?? null
  } catch {
    cover = null
  }
  // PDFs gerados por outros programas costumam trazer o nome do arquivo de origem como título.
  const title = readLanguageMap(book.metadata?.title).trim()
  const looksLikeFileName = /\.[a-z0-9]{2,5}$/i.test(title)
  return {
    title: title && !looksLikeFileName ? title : fallback,
    author: readContributor(book.metadata?.author),
    cover,
  }
}
