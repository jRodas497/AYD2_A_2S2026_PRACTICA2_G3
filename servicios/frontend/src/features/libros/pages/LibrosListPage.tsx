import { Search } from 'lucide-react'
import { SkeletonRows } from '../../../shared/components/Skeleton'
import { COLUMNAS_LIBRO, LibroRow } from '../components/LibroRow'
import { useLibros } from '../hooks/useLibros'

export function LibrosListPage() {
  const { libros, cargando, error, query, setQuery } = useLibros()
  const hayBusqueda = query.trim() !== ''

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Catálogo de libros</h1>
        {!cargando && !error && (
          <p className="text-sm text-suave tabular-nums" aria-live="polite">
            {libros.length} {libros.length === 1 ? 'libro' : 'libros'}
          </p>
        )}
      </div>

      <div className="relative w-full max-w-sm mb-4">
        <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-suave pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por título o autor"
          aria-label="Buscar por título o autor"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-9 border border-linea rounded-lg pl-9 pr-3 text-base sm:text-sm bg-white placeholder:text-suave transition-colors duration-150 focus:border-brand focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-brand/25"
        />
      </div>

      {cargando ? (
        <SkeletonRows />
      ) : error ? (
        <p role="alert" className="text-sm text-falla">
          {error}
        </p>
      ) : libros.length === 0 ? (
        <p className="text-sm text-suave py-8">
          {hayBusqueda ? `Ningún libro coincide con “${query.trim()}”.` : 'Todavía no hay libros en el catálogo.'}
        </p>
      ) : (
        <>
          <div className={`hidden sm:grid ${COLUMNAS_LIBRO} gap-x-4 -mx-3 px-3 pb-2 text-xs font-medium text-suave`}>
            <span>Libro</span>
            <span>Existencias</span>
            <span className="text-right">Precio</span>
          </div>
          <ul className="space-y-0.5 -mx-3">
            {libros.map((libro) => (
              <LibroRow key={libro.id} libro={libro} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
