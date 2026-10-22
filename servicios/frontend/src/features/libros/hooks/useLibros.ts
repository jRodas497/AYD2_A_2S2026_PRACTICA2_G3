import { useCallback, useEffect, useState } from 'react'
import { buscarLibros, obtenerLibro } from '../api/librosApi'
import type { Libro } from '../types'

export function useLibros() {
  const [query, setQuery] = useState('')
  const [libros, setLibros] = useState<Libro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    // La espera evita una petición por cada letra que se teclea.
    const temporizador = setTimeout(() => {
      buscarLibros(query)
        .then((resultado) => {
          if (cancelado) return
          setLibros(resultado)
          setCargando(false)
        })
        .catch((e) => {
          if (cancelado) return
          setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo')
          setCargando(false)
        })
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [query])

  return { libros, cargando, error, query, setQuery }
}

export function useLibro(id: string | undefined) {
  const [libro, setLibro] = useState<Libro | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    if (!id) return Promise.resolve()
    return obtenerLibro(id)
      .then((resultado) => {
        setLibro(resultado)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el libro'))
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => {
    setCargando(true)
    cargar()
  }, [cargar])

  return { libro, cargando, error, recargar: cargar }
}
