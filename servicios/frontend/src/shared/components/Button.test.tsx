import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('llama a onClick al pulsarlo', async () => {
    const alPulsar = vi.fn()
    render(<Button onClick={alPulsar}>Registrar venta</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Registrar venta' }))

    expect(alPulsar).toHaveBeenCalledOnce()
  })

  it('no responde cuando está deshabilitado', async () => {
    const alPulsar = vi.fn()
    render(
      <Button onClick={alPulsar} disabled>
        Registrando…
      </Button>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toBeDisabled()
    expect(alPulsar).not.toHaveBeenCalled()
  })

  it('distingue la variante secundaria y acepta clases extra', () => {
    render(
      <Button variant="secondary" className="w-full">
        Cancelar
      </Button>,
    )

    const boton = screen.getByRole('button', { name: 'Cancelar' })
    expect(boton).toHaveClass('w-full', 'border')
    expect(boton).not.toHaveClass('text-white')
  })
})
