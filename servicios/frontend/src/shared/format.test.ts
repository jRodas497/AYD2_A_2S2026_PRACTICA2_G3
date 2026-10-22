import { describe, expect, it } from 'vitest'
import { formatQ } from './format'

describe('formatQ', () => {
  it('muestra el precio en quetzales con dos decimales', () => {
    expect(formatQ(95)).toBe('Q 95.00')
    expect(formatQ(89.5)).toBe('Q 89.50')
  })
})
