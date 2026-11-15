import { describe, expect, it } from 'vitest'
import { assertValidAmount, formatRupiah } from '../src/core/money'

describe('money helpers', () => {
  it('formats integer Rupiah', () => {
    expect(formatRupiah(125000)).toContain('125.000')
  })

  it('rejects fractional amounts', () => {
    expect(() => assertValidAmount(10.5)).toThrow()
  })

  it('rejects negative amounts', () => {
    expect(() => assertValidAmount(-1)).toThrow()
  })
})
