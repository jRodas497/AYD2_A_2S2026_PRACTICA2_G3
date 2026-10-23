import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { obtenerRanking, type RankingItem } from '../api/rankingApi'
import { RankingPage } from './RankingPage'

vi.mock('../api/rankingApi')

const RANKING: RankingItem[] = [
  { libroId: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', totalVendido: 18 },
  { libroId: 9, titulo: 'Crónica de una muerte anunciada', autor: 'Gabriel García Márquez', totalVendido: 9 },
]

function montar() {
  render(
    <MemoryRouter>
      <RankingPage />
    </MemoryRouter>,
  )
}

describe('RankingPage', () => {
  it('lista los libros en orden con sus totales y enlaces al detalle', async () => {
    vi.mocked(obtenerRanking).mockResolvedValue(RANKING)
    montar()

    await screen.findByText('Cien años de soledad')
    const filas = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(filas).toHaveLength(2)
    expect(within(filas[0]).getByText('Cien años de soledad')).toBeInTheDocument()
    expect(within(filas[0]).getByText('18')).toBeInTheDocument()
    expect(within(filas[1]).getByRole('link')).toHaveAttribute('href', '/libros/9')
  })

  it('dibuja las barras en proporción al más vendido', async () => {
    vi.mocked(obtenerRanking).mockResolvedValue(RANKING)
    montar()

    await screen.findByText('Cien años de soledad')
    const barras = Array.from(document.querySelectorAll<HTMLElement>('span[style*="width"]'))
    expect(barras.map((barra) => barra.style.width)).toEqual(['100%', '50%'])
  })

  it('avisa cuando todavía no hay ventas', async () => {
    vi.mocked(obtenerRanking).mockResolvedValue([])
    montar()

    expect(await screen.findByText('Todavía no hay ventas registradas.')).toBeInTheDocument()
  })

  it('muestra el error como alerta', async () => {
    vi.mocked(obtenerRanking).mockRejectedValue(new Error('No se pudo cargar el ranking'))
    montar()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el ranking')
  })
})
