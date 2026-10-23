import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buscarLibros } from '../api/librosApi'
import type { Libro } from '../types'
import { LibrosListPage } from './LibrosListPage'

vi.mock('../api/librosApi')

const LIBROS: Libro[] = [
  { id: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', precio: 95, existencias: 15 },
  { id: 2, titulo: 'Rayuela', autor: 'Julio Cortázar', precio: 92, existencias: 0 },
]

function montar() {
  render(
    <MemoryRouter>
      <LibrosListPage />
    </MemoryRouter>,
  )
}

describe('LibrosListPage', () => {
  beforeEach(() => {
    vi.mocked(buscarLibros).mockResolvedValue(LIBROS)
  })

  it('muestra una carga y luego los libros con su total', async () => {
    montar()

    expect(screen.getByLabelText('Cargando')).toBeInTheDocument()
    expect(await screen.findByText('Cien años de soledad')).toBeInTheDocument()
    expect(screen.getByText('Rayuela')).toBeInTheDocument()
    expect(screen.getByText('2 libros')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Catálogo de libros' })).toBeInTheDocument()
  })

  it('usa el singular cuando hay un solo libro', async () => {
    vi.mocked(buscarLibros).mockResolvedValue([LIBROS[0]])
    montar()

    expect(await screen.findByText('1 libro')).toBeInTheDocument()
  })

  it('busca lo que se escribe, esperando a que termine de teclear', async () => {
    montar()
    await screen.findByText('Rayuela')

    vi.mocked(buscarLibros).mockResolvedValue([LIBROS[0]])
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar por título o autor' }), 'garcia')

    expect(await screen.findByText('1 libro')).toBeInTheDocument()
    expect(screen.queryByText('Rayuela')).not.toBeInTheDocument()
    expect(buscarLibros).toHaveBeenLastCalledWith('garcia')
    // Una petición por cada letra sería un fallo del retardo: solo la inicial y la final.
    expect(vi.mocked(buscarLibros).mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('explica cuando la búsqueda no encuentra nada', async () => {
    montar()
    await screen.findByText('Rayuela')

    vi.mocked(buscarLibros).mockResolvedValue([])
    await userEvent.type(screen.getByRole('searchbox'), 'zzz')

    expect(await screen.findByText('Ningún libro coincide con “zzz”.')).toBeInTheDocument()
  })

  it('avisa cuando el catálogo está vacío', async () => {
    vi.mocked(buscarLibros).mockResolvedValue([])
    montar()

    expect(await screen.findByText('Todavía no hay libros en el catálogo.')).toBeInTheDocument()
  })

  it('muestra el error como alerta y sin contador', async () => {
    vi.mocked(buscarLibros).mockRejectedValue(new Error('No se pudo cargar el catálogo'))
    montar()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el catálogo')
    expect(screen.queryByText(/^\d+ libros?$/)).not.toBeInTheDocument()
  })
})
