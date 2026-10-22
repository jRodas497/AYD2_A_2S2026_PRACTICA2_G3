import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../../../shared/components/BackLink'
import { Button } from '../../../shared/components/Button'
import { Pill } from '../../../shared/components/Pill'
import { PriceTag } from '../../../shared/components/PriceTag'
import { QuantityStepper } from '../../../shared/components/QuantityStepper'
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

  if (cargando) return <p className="text-sm text-gray-500">Cargando libro…</p>
  if (error || !libro) {
    return (
      <div>
        <BackLink to="/" label="Volver al catálogo" />
        <p className="text-sm text-falla">{error ?? 'No se encontró el libro.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <BackLink to="/" label="Volver al catálogo" />
      <div className="bg-white border border-linea rounded p-5">
        <h1 className="text-2xl font-semibold text-ink">{libro.titulo}</h1>
        <p className="text-sm text-gray-600 mb-4">{libro.autor}</p>

        <div className="flex items-center gap-3 mb-5">
          <PriceTag valor={libro.precio} />
          <Pill tone={libro.existencias > 0 ? 'ok' : 'falla'}>
            {libro.existencias > 0 ? `${libro.existencias} en existencia` : 'Agotado'}
          </Pill>
        </div>

        {libro.existencias > 0 && (
          <div className="flex items-center gap-3">
            <QuantityStepper
              cantidad={cantidad}
              etiqueta={libro.titulo}
              onDecrementar={() => setCantidad((c) => Math.max(1, c - 1))}
              onIncrementar={() => setCantidad((c) => Math.min(libro.existencias, c + 1))}
            />
            <Button onClick={comprar} disabled={comprando}>
              {comprando ? 'Registrando…' : 'Registrar venta'}
            </Button>
          </div>
        )}

        {aviso && (
          <p role="status" className={`text-sm mt-4 ${aviso.tono === 'ok' ? 'text-ok' : 'text-falla'}`}>
            {aviso.texto}{' '}
            {aviso.tono === 'ok' && (
              <Link to="/ranking" className="underline">
                Ver ranking
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
