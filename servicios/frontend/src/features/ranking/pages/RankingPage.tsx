import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SkeletonRows } from '../../../shared/components/Skeleton'
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

  const maximo = Math.max(1, ...ranking.map((item) => item.totalVendido))

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-5">Libros más vendidos</h1>

      {cargando ? (
        <SkeletonRows filas={5} />
      ) : error ? (
        <p role="alert" className="text-sm text-falla">
          {error}
        </p>
      ) : ranking.length === 0 ? (
        <p className="text-sm text-suave py-8">Todavía no hay ventas registradas.</p>
      ) : (
        <ol className="space-y-0.5 -mx-3">
          {ranking.map((item, indice) => (
            <li key={item.libroId}>
              <Link
                to={`/libros/${item.libroId}`}
                className="pulsable grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3 py-3 rounded-lg active:scale-[0.99] hover:bg-marco"
              >
                <span className="text-sm font-semibold text-suave tabular-nums">{indice + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{item.titulo}</span>
                  <span className="block text-sm text-suave truncate">{item.autor}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-right whitespace-nowrap">
                  {item.totalVendido} <span className="font-normal text-suave">vendidos</span>
                </span>
                {/* La barra es el dato: la longitud es proporcional al más vendido. */}
                <span aria-hidden="true" className="col-start-2 col-span-2 h-1.5 rounded-full bg-marco">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(item.totalVendido / maximo) * 100}%` }} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
