import { LibroCard } from '../components/LibroCard'
import { useLibros } from '../hooks/useLibros'

export function LibrosListPage() {
  const { libros, cargando, error, query, setQuery } = useLibros()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Catálogo de libros</h1>

      <input
        type="search"
        placeholder="Buscar por título o autor..."
        aria-label="Buscar por título o autor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border border-linea rounded px-3 py-2 text-sm mb-4 bg-white"
      />

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando catálogo…</p>
      ) : error ? (
        <p className="text-sm text-falla">{error}</p>
      ) : libros.length === 0 ? (
        <p className="text-sm text-gray-500">No se encontraron libros.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {libros.map((libro) => (
            <LibroCard key={libro.id} libro={libro} />
          ))}
        </div>
      )}
    </div>
  )
}
