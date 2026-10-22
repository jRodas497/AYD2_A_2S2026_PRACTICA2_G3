import { Link } from 'react-router-dom'
import { PriceTag } from '../../../shared/components/PriceTag'
import { StockMark } from '../../../shared/components/StockMark'
import type { Libro } from '../types'

// Columnas compartidas con el encabezado de LibrosListPage: identidad, existencias, precio.
export const COLUMNAS_LIBRO = 'sm:grid-cols-[minmax(0,1fr)_10rem_6rem]'

export function LibroRow({ libro }: { libro: Libro }) {
  return (
    <li>
      <Link
        to={`/libros/${libro.id}`}
        className={`pulsable grid grid-cols-[minmax(0,1fr)_auto] ${COLUMNAS_LIBRO} items-center gap-x-4 px-3 py-3 rounded-lg active:scale-[0.99] hover:bg-marco`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink truncate">{libro.titulo}</span>
          <span className="block text-sm text-suave truncate">{libro.autor}</span>
        </span>
        <span className="flex flex-col items-end gap-1 sm:contents">
          <StockMark existencias={libro.existencias} className="sm:justify-self-start order-2 sm:order-none text-xs sm:text-sm" />
          <PriceTag valor={libro.precio} className="sm:text-right" />
        </span>
      </Link>
    </li>
  )
}
