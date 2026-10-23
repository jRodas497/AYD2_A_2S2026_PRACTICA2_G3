import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { comprarLibro, obtenerLibro } from '../api/librosApi'
import type { Libro } from '../types'
import { LibroDetallePage } from './LibroDetallePage'

vi.mock('../api/librosApi')

const LIBRO: Libro = { id: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', precio: 95, existencias: 3 }

function montar() {
  render(
    <MemoryRouter initialEntries={['/libros/1']}>
      <Routes>
        <Route path="/libros/:id" element={<LibroDetallePage />} />
        <Route path="/" element={<p>Catálogo</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const botonVender = () => screen.getByRole('button', { name: 'Registrar venta' })

describe('LibroDetallePage', () => {
  beforeEach(() => {
    vi.mocked(obtenerLibro).mockResolvedValue(LIBRO)
  })

  it('muestra la ficha del libro', async () => {
    montar()

    expect(await screen.findByRole('heading', { level: 1, name: 'Cien años de soledad' })).toBeInTheDocument()
    expect(obtenerLibro).toHaveBeenCalledWith('1')
    // El precio aparece en la ficha y como total de una unidad.
    expect(screen.getAllByText('Q 95.00')).toHaveLength(2)
    expect(screen.getByText('Quedan 3')).toBeInTheDocument()
  })

  it('actualiza el total al cambiar la cantidad y no pasa de las existencias', async () => {
    montar()
    await screen.findByRole('heading', { level: 1 })

    const aumentar = screen.getByRole('button', { name: /Aumentar cantidad/ })
    await userEvent.click(aumentar)
    expect(screen.getByText('Q 190.00')).toBeInTheDocument()
    await userEvent.click(aumentar)
    expect(screen.getByText('Q 285.00')).toBeInTheDocument()

    expect(aumentar).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /Disminuir cantidad/ }))
    expect(screen.getByText('Q 190.00')).toBeInTheDocument()
  })

  it('registra la venta, avisa, recarga el libro y vuelve la cantidad a uno', async () => {
    vi.mocked(comprarLibro).mockResolvedValue({
      id: 9, libroId: 1, titulo: LIBRO.titulo, autor: LIBRO.autor, cantidad: 2, precioUnitario: 95, fecha: '2026-10-22T20:00:00Z',
    })
    montar()
    await screen.findByRole('heading', { level: 1 })

    await userEvent.click(screen.getByRole('button', { name: /Aumentar cantidad/ }))
    vi.mocked(obtenerLibro).mockResolvedValue({ ...LIBRO, existencias: 1 })
    await userEvent.click(botonVender())

    expect(comprarLibro).toHaveBeenCalledWith(1, 2)
    expect(await screen.findByRole('status')).toHaveTextContent('Venta registrada: 2 × Q 95.00.')
    expect(screen.getByRole('link', { name: 'Ver ranking' })).toHaveAttribute('href', '/ranking')
    expect(await screen.findByText('Quedan 1')).toBeInTheDocument()
    expect(obtenerLibro).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('Q 95.00')).toHaveLength(2)
  })

  it('muestra el motivo cuando la venta se rechaza', async () => {
    vi.mocked(comprarLibro).mockRejectedValue(new Error('Existencias insuficientes: hay 1 y se pidió descontar 2'))
    montar()
    await screen.findByRole('heading', { level: 1 })

    await userEvent.click(botonVender())

    expect(await screen.findByRole('status')).toHaveTextContent('Existencias insuficientes')
    expect(screen.queryByRole('link', { name: 'Ver ranking' })).not.toBeInTheDocument()
    expect(botonVender()).toBeEnabled()
  })

  it('deshabilita el botón mientras registra', async () => {
    let terminar: (v: Awaited<ReturnType<typeof comprarLibro>>) => void = () => {}
    vi.mocked(comprarLibro).mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    montar()
    await screen.findByRole('heading', { level: 1 })

    await userEvent.click(botonVender())

    expect(screen.getByRole('button', { name: 'Registrando…' })).toBeDisabled()
    terminar({ id: 1, libroId: 1, titulo: '', autor: '', cantidad: 1, precioUnitario: 95, fecha: '' })
    expect(await screen.findByRole('button', { name: 'Registrar venta' })).toBeEnabled()
  })

  it('no permite vender un libro agotado', async () => {
    vi.mocked(obtenerLibro).mockResolvedValue({ ...LIBRO, existencias: 0 })
    montar()

    expect(await screen.findByText(/está agotado/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar venta' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Agotado').length).toBeGreaterThan(0)
  })

  it('muestra el error y el regreso al catálogo si el libro no existe', async () => {
    vi.mocked(obtenerLibro).mockRejectedValue(new Error('No existe el libro 1'))
    montar()

    expect(await screen.findByRole('alert')).toHaveTextContent('No existe el libro 1')
    expect(screen.getByRole('link', { name: /Volver al catálogo/ })).toHaveAttribute('href', '/')
  })
})
