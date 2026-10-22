import { manejarRespuesta } from '../../../shared/api/httpErrors'
import type { Libro, Venta } from '../types'

// Rutas relativas: el gateway decide a qué servicio va cada una.
export async function buscarLibros(q: string): Promise<Libro[]> {
  const consulta = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
  return manejarRespuesta<Libro[]>(await fetch(`/api/libros${consulta}`))
}

export async function obtenerLibro(id: string): Promise<Libro> {
  return manejarRespuesta<Libro>(await fetch(`/api/libros/${encodeURIComponent(id)}`))
}

export async function comprarLibro(libroId: number, cantidad: number): Promise<Venta> {
  const respuesta = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ libroId, cantidad }),
  })
  return manejarRespuesta<Venta>(respuesta)
}
