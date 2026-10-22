// Portada tipográfica generada del título: la API no trae imágenes, así que cada libro
// recibe una portada estable (tono según su id).
const FONDOS = [
  'var(--brand-dark)',
  'var(--ink)',
  'color-mix(in srgb, var(--brand-dark) 70%, var(--brand))',
]

export function Portada({ id, titulo, className = '' }: { id: number; titulo: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ background: FONDOS[id % FONDOS.length] }}
      className={`flex shrink-0 items-center justify-center rounded-[5px] text-white font-semibold shadow-[inset_3px_0_0_rgb(0_0_0/0.22)] ${className}`}
    >
      {titulo.trim().charAt(0).toUpperCase()}
    </span>
  )
}
