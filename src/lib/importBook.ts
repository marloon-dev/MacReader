import { addBook, type Book } from './db'
import { readBookInfo } from './foliate'

export const ACCEPTED_FILES = '.epub,.pdf,.mobi,.azw3,.azw,.fb2,.fbz,.cbz,application/epub+zip,application/pdf'

export function formatOf(name: string): string {
  const match = name.toLowerCase().match(/\.(fb2\.zip|[a-z0-9]+)$/)
  const ext = match?.[1] ?? ''
  return ext === 'fb2.zip' ? 'FB2' : ext.toUpperCase()
}

export type ImportResult = { imported: Book[]; failed: string[] }

/** Lê os arquivos escolhidos e guarda cada livro na estante. */
export async function importFiles(files: Iterable<File>): Promise<ImportResult> {
  const imported: Book[] = []
  const failed: string[] = []
  for (const file of files) {
    try {
      const info = await readBookInfo(file)
      const book: Book = {
        id: crypto.randomUUID(),
        title: info.title,
        author: info.author,
        format: formatOf(file.name),
        size: file.size,
        addedAt: Date.now(),
        openedAt: null,
        cover: info.cover,
        location: null,
        progress: 0,
        chapter: null,
      }
      await addBook(book, file)
      imported.push(book)
    } catch (error) {
      console.error(`Não foi possível importar ${file.name}`, error)
      failed.push(file.name)
    }
  }
  return { imported, failed }
}
