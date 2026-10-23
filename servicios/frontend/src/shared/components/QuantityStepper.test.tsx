import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuantityStepper } from './QuantityStepper'

function montar(props: Partial<React.ComponentProps<typeof QuantityStepper>> = {}) {
  const onDecrementar = vi.fn()
  const onIncrementar = vi.fn()
  render(<QuantityStepper cantidad={2} onDecrementar={onDecrementar} onIncrementar={onIncrementar} {...props} />)
  return { onDecrementar, onIncrementar }
}

describe('QuantityStepper', () => {
  it('muestra la cantidad y llama a los manejadores', async () => {
    const { onDecrementar, onIncrementar } = montar({ etiqueta: 'Ficciones' })

    expect(screen.getByText('2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Ficciones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad de Ficciones' }))

    expect(onIncrementar).toHaveBeenCalledOnce()
    expect(onDecrementar).toHaveBeenCalledOnce()
  })

  it('no baja del mínimo', async () => {
    const { onDecrementar } = montar({ cantidad: 1 })

    const disminuir = screen.getByRole('button', { name: 'Disminuir cantidad' })
    await userEvent.click(disminuir)

    expect(disminuir).toBeDisabled()
    expect(onDecrementar).not.toHaveBeenCalled()
  })

  it('no sube del máximo', async () => {
    const { onIncrementar } = montar({ cantidad: 5, max: 5 })

    const aumentar = screen.getByRole('button', { name: 'Aumentar cantidad' })
    await userEvent.click(aumentar)

    expect(aumentar).toBeDisabled()
    expect(onIncrementar).not.toHaveBeenCalled()
  })
})
