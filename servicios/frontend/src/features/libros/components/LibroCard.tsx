import { Link } from 'react-router-dom'
import { Pill } from '../../../shared/components/Pill'
import { PriceTag } from '../../../shared/components/PriceTag'
import type { Libro } from '../types'

export function LibroCard({ libro }: { libro: Libro }) {
  return (
    <Link
      to={`/libros/${libro.id}`}
      className="block bg-white border border-linea rounded p-3 hover:border-brand transition-colors"
    >
      <div className="text-sm font-medium text-ink">{libro.titulo}</div>
      <div className="text-xs text-gray-500 mb-3">{libro.autor}</div>
      <div className="flex justify-between items-center">
        <PriceTag valor={libro.precio} />
        <Pill tone={libro.existencias > 0 ? 'ok' : 'falla'}>
          {libro.existencias > 0 ? `${libro.existencias} disponibles` : 'Agotado'}
        </Pill>
      </div>
    </Link>
  )
}
