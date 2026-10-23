import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { buscarLibros } from './features/libros/api/librosApi'
import { obtenerRanking } from './features/ranking/api/rankingApi'

vi.mock('./features/libros/api/librosApi')
vi.mock('./features/ranking/api/rankingApi')

function montar(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(buscarLibros).mockResolvedValue([])
    vi.mocked(obtenerRanking).mockResolvedValue([])
  })

  it('abre el catálogo en la raíz y marca su pestaña como activa', async () => {
    montar('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Catálogo de libros' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Ranking' })).not.toHaveAttribute('aria-current')
  })

  it('abre el ranking en /ranking', async () => {
    montar('/ranking')

    expect(await screen.findByRole('heading', { level: 1, name: 'Libros más vendidos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ranking' })).toHaveAttribute('aria-current', 'page')
  })

  it('avisa en una ruta que no existe', () => {
    montar('/nada')

    expect(screen.getByText('Página no encontrada.')).toBeInTheDocument()
  })

  it('tiene la navegación principal con el nombre de la tienda', () => {
    montar('/')

    expect(screen.getByRole('navigation', { name: 'Principal' })).toHaveTextContent('Librería AYD')
  })
})
