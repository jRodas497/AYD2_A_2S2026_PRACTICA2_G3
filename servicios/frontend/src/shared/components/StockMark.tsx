// Estado de existencias: un punto de color y el texto. El color indica el estado, no decora.
const POCAS_EXISTENCIAS = 5

export function StockMark({ existencias, className = '' }: { existencias: number; className?: string }) {
  const [color, texto] =
    existencias <= 0
      ? ['bg-falla', 'Agotado']
      : existencias <= POCAS_EXISTENCIAS
        ? ['bg-alerta', `Quedan ${existencias}`]
        : ['bg-ok', `${existencias} disponibles`]
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-suave whitespace-nowrap ${className}`}>
      <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
      {texto}
    </span>
  )
}
