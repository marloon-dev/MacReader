import type { Annotation, HighlightColor } from './db'

export const highlightColors: Record<HighlightColor, string> = {
  amarelo: '#F2C94C',
  verde: '#6FCF97',
  azul: '#56A8F5',
  rosa: '#F28AB2',
}

type NewAnnotation = Pick<Annotation, 'bookId' | 'kind' | 'cfi' | 'chapter' | 'progress'> &
  Partial<Pick<Annotation, 'text' | 'color'>>

export function createAnnotation(fields: NewAnnotation): Annotation {
  return {
    id: crypto.randomUUID(),
    text: '',
    color: 'amarelo',
    note: '',
    createdAt: Date.now(),
    ...fields,
  }
}
