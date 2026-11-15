import { describe, expect, it } from 'vitest'
import { calculateBudgetProgress, getBudgetPeriodKey, getBudgetPeriodRange } from '../src/core/budget'

describe('getBudgetPeriodKey', () => {
  it('keeps daily dates and derives monthly keys', () => {
    expect(getBudgetPeriodKey('daily', '2026-11-15')).toBe('2026-11-15')
    expect(getBudgetPeriodKey('monthly', '2026-11-15')).toBe('2026-11')
  })

  it('uses Monday as the start of a week, including Sunday boundaries', () => {
    expect(getBudgetPeriodKey('weekly', '2026-11-15')).toBe('2026-11-09')
    expect(getBudgetPeriodKey('weekly', '2026-11-09')).toBe('2026-11-09')
    expect(getBudgetPeriodKey('weekly', '2026-11-16')).toBe('2026-11-16')
  })

  it('rejects impossible calendar dates', () => {
    expect(() => getBudgetPeriodKey('daily', '2026-02-31')).toThrow('Tanggal tidak valid.')
  })
})

describe('getBudgetPeriodRange', () => {
  it('returns a one-day range for daily budgets', () => {
    expect(getBudgetPeriodRange('daily', '2026-11-15')).toEqual({ from: '2026-11-15', to: '2026-11-15' })
  })

  it('returns Monday through Sunday for weekly budgets', () => {
    expect(getBudgetPeriodRange('weekly', '2026-11-09')).toEqual({ from: '2026-11-09', to: '2026-11-15' })
  })

  it('rejects a weekly key that does not start on Monday', () => {
    expect(() => getBudgetPeriodRange('weekly', '2026-11-10')).toThrow('Periode mingguan harus dimulai pada hari Senin.')
  })

  it('handles leap years and month lengths', () => {
    expect(getBudgetPeriodRange('monthly', '2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' })
    expect(getBudgetPeriodRange('monthly', '2026-11')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
  })
})

describe('calculateBudgetProgress', () => {
  it('calculates remaining amount and percentage', () => {
    expect(calculateBudgetProgress(25000, 100000)).toEqual({ remaining: 75000, overBudget: 0, percent: 25 })
  })

  it('reports overspending and caps the progress bar at 100 percent', () => {
    expect(calculateBudgetProgress(125000, 100000)).toEqual({ remaining: 0, overBudget: 25000, percent: 100 })
  })

  it('handles zero budgets safely', () => {
    expect(calculateBudgetProgress(10000, 0)).toEqual({ remaining: 0, overBudget: 10000, percent: 0 })
  })
})
