import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../../../shared/components/BackLink'
import { Button } from '../../../shared/components/Button'
import { Portada } from '../../../shared/components/Portada'
import { PriceTag } from '../../../shared/components/PriceTag'
import { QuantityStepper } from '../../../shared/components/QuantityStepper'
import { StockMark } from '../../../shared/components/StockMark'
import { formatQ } from '../../../shared/format'
import { comprarLibro } from '../api/librosApi'
import { useLibro } from '../hooks/useLibros'

export function LibroDetallePage() {
  const { id } = useParams()
  const { libro, cargando, error, recargar } = useLibro(id)
  const [cantidad, setCantidad] = useState(1)
  const [comprando, setComprando] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'ok' | 'falla'; texto: string } | null>(null)

  async function comprar() {
    if (!libro) return
    setComprando(true)
    setAviso(null)
    try {
      const venta = await comprarLibro(libro.id, cantidad)
      setAviso({ tono: 'ok', texto: `Venta registrada: ${venta.cantidad} × ${formatQ(venta.precioUnitario)}.` })
      setCantidad(1)
      await recargar()
    } catch (e) {
      setAviso({ tono: 'falla', texto: e instanceof Error ? e.message : 'No se pudo registrar la venta' })
    } finally {
      setComprando(false)
    }
  }

  if (cargando) return <p className="text-sm text-suave">Cargando libro…</p>
  if (error || !libro) {
    return (
      <div>
        <BackLink to="/" label="Volver al catálogo" />
        <p role="alert" className="text-sm text-falla">
          {error ?? 'No se encontró el libro.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <BackLink to="/" label="Volver al catálogo" />

      <header className="mb-8 flex items-end gap-5">
        <Portada id={libro.id} titulo={libro.titulo} className="w-20 h-28 text-4xl" />
        <div>
          <h1>{libro.titulo}</h1>
          <p className="text-base text-suave">{libro.autor}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-labelledby="ficha">
          <h2 id="ficha" className="text-base font-bold mb-3">
            Ficha del libro
          </h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
            <dt className="text-suave">Precio</dt>
            <dd>
              <PriceTag valor={libro.precio} />
            </dd>
            <dt className="text-suave">Existencias</dt>
            <dd>
              <StockMark existencias={libro.existencias} className="text-ink" />
            </dd>
          </dl>
        </section>

        <section aria-labelledby="venta" className="rounded-panel bg-marco p-5">
          <h2 id="venta" className="text-base font-bold mb-4">
            Registrar venta
          </h2>
          {libro.existencias > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <QuantityStepper
                  cantidad={cantidad}
                  max={libro.existencias}
                  etiqueta={libro.titulo}
                  onDecrementar={() => setCantidad((c) => Math.max(1, c - 1))}
                  onIncrementar={() => setCantidad((c) => Math.min(libro.existencias, c + 1))}
                />
                <p className="text-sm text-suave">
                  Total{' '}
                  <span className="text-lg font-bold text-ink tabular-nums">{formatQ(libro.precio * cantidad)}</span>
                </p>
              </div>
              <Button onClick={comprar} disabled={comprando} className="w-full">
                {comprando ? 'Registrando…' : 'Registrar venta'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-suave">Este libro está agotado; no se pueden registrar ventas.</p>
          )}

          {aviso && (
            <p role="status" className={`text-sm mt-4 ${aviso.tono === 'ok' ? 'text-ok' : 'text-falla'}`}>
              {aviso.texto}{' '}
              {aviso.tono === 'ok' && (
                <Link to="/ranking" className="font-semibold underline underline-offset-2">
                  Ver ranking
                </Link>
              )}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
