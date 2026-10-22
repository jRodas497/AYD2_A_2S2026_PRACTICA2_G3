import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  cantidad: number
  onDecrementar: () => void
  onIncrementar: () => void
  min?: number
  max?: number
  etiqueta?: string
}

const BOTON =
  'pulsable w-9 h-9 flex items-center justify-center text-ink hover:bg-marco disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100'

export function QuantityStepper({
  cantidad,
  onDecrementar,
  onIncrementar,
  min = 1,
  max,
  etiqueta,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center border border-linea rounded-ctl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onDecrementar}
        disabled={cantidad <= min}
        className={BOTON}
        aria-label={etiqueta ? `Disminuir cantidad de ${etiqueta}` : 'Disminuir cantidad'}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {cantidad}
      </span>
      <button
        type="button"
        onClick={onIncrementar}
        disabled={max !== undefined && cantidad >= max}
        className={BOTON}
        aria-label={etiqueta ? `Aumentar cantidad de ${etiqueta}` : 'Aumentar cantidad'}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
