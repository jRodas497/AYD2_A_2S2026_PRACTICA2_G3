import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Portada } from './Portada'

describe('Portada', () => {
  it('usa la inicial del título en mayúscula', () => {
    const { container } = render(<Portada id={1} titulo="  el aleph" />)

    expect(container.firstElementChild).toHaveTextContent('E')
  })

  it('es decorativa para los lectores de pantalla', () => {
    const { container } = render(<Portada id={1} titulo="Ficciones" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('da siempre el mismo fondo al mismo libro y reparte tres tonos', () => {
    const fondo = (id: number) => (render(<Portada id={id} titulo="X" />).container.firstElementChild as HTMLElement).style.background
    const tonos = new Set([fondo(1), fondo(2), fondo(3)])

    expect(fondo(1)).toBe(fondo(4))
    expect(tonos.size).toBe(3)
  })
})
