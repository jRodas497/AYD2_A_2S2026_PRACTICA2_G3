import { formatQ } from '../format'

export function PriceTag({ valor }: { valor: number }) {
  return <span className="text-sm font-semibold text-ink">{formatQ(valor)}</span>
}
