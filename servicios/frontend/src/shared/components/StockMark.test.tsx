import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StockMark } from './StockMark'

describe('StockMark', () => {
  it.each([
    [15, '15 disponibles', 'bg-ok'],
    [6, '6 disponibles', 'bg-ok'],
    [5, 'Quedan 5', 'bg-alerta'],
    [1, 'Quedan 1', 'bg-alerta'],
    [0, 'Agotado', 'bg-falla'],
  ])('con %i ejemplares dice «%s»', (existencias, texto, claseDelPunto) => {
    const { container } = render(<StockMark existencias={existencias} />)

    expect(screen.getByText(texto)).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(claseDelPunto)
  })

  it('trata las existencias negativas como agotado', () => {
    render(<StockMark existencias={-2} />)

    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })
})
