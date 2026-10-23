import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Libro } from '../types'
import { LibroRow } from './LibroRow'

const LIBRO: Libro = { id: 7, titulo: 'Pedro Páramo', autor: 'Juan Rulfo', precio: 60, existencias: 22 }

function montar(libro: Libro) {
  render(
    <MemoryRouter>
      <ul>
        <LibroRow libro={libro} />
      </ul>
    </MemoryRouter>,
  )
}

describe('LibroRow', () => {
  it('enlaza al detalle y muestra título, autor, precio y existencias', () => {
    montar(LIBRO)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/libros/7')
    expect(screen.getByText('Pedro Páramo')).toBeInTheDocument()
    expect(screen.getByText('Juan Rulfo')).toBeInTheDocument()
    expect(screen.getByText('Q 60.00')).toBeInTheDocument()
    expect(screen.getByText('22 disponibles')).toBeInTheDocument()
  })

  it('marca como agotado un libro sin existencias', () => {
    montar({ ...LIBRO, existencias: 0 })

    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })
})
