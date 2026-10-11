import { useState } from 'react'
import { Library } from './components/Library'
import { Reader } from './components/Reader'
import { UpdateBanner } from './components/UpdateBanner'
import type { Book } from './lib/db'

export default function App() {
  const [book, setBook] = useState<Book | null>(null)

  return (
    <>
      {book ? <Reader key={book.id} book={book} onClose={() => setBook(null)} /> : <Library onOpen={setBook} />}
      {!book && <UpdateBanner />}
    </>
  )
}
