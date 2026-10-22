import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerRanking, type RankingItem } from '../api/rankingApi'

export function RankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    obtenerRanking()
      .then((resultado) => {
        if (!cancelado) setRanking(resultado)
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar el ranking')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Libros más vendidos</h1>

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando ranking…</p>
      ) : error ? (
        <p className="text-sm text-falla">{error}</p>
      ) : ranking.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay ventas registradas.</p>
      ) : (
        <ol className="max-w-2xl bg-white border border-linea rounded divide-y divide-linea">
          {ranking.map((item, indice) => (
            <li key={item.libroId} className="flex items-center gap-4 px-4 py-3">
              <span className="w-6 text-center text-lg font-semibold text-brand">{indice + 1}</span>
              <Link to={`/libros/${item.libroId}`} className="flex-1 min-w-0 hover:underline">
                <span className="block text-sm font-medium text-ink truncate">{item.titulo}</span>
                <span className="block text-xs text-gray-500 truncate">{item.autor}</span>
              </Link>
              <span className="text-sm text-ink whitespace-nowrap">{item.totalVendido} vendidos</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
