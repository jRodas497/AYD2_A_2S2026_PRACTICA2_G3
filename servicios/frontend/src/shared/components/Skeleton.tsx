// taste-skill-ignore: el pulso es de un estado de carga, no una animación de atención.
// Filas de carga con la forma de las filas reales, para que la lista no salte al llegar los datos.
export function SkeletonRows({ filas = 6 }: { filas?: number }) {
  return (
    <ul aria-busy="true" aria-label="Cargando" className="divide-y divide-borde">
      {Array.from({ length: filas }, (_, i) => (
        <li key={i} className="flex items-center justify-between gap-6 px-3 py-3.5 animate-pulse motion-reduce:animate-none">
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-2/5 rounded bg-marco" />
            <div className="h-3 w-1/4 rounded bg-marco" />
          </div>
          <div className="h-3.5 w-16 rounded bg-marco" />
        </li>
      ))}
    </ul>
  )
}
