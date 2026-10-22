import { formatQ } from '../format'

export function PriceTag({ valor, className = '' }: { valor: number; className?: string }) {
  return <span className={`text-sm font-semibold text-ink tabular-nums whitespace-nowrap ${className}`}>{formatQ(valor)}</span>
}
