export type BudgetPeriod = 'daily' | 'weekly' | 'monthly'

export interface DateRange {
  from: string
  to: string
}

function parseDateKey(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Tanggal harus menggunakan format YYYY-MM-DD.')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('Tanggal tidak valid.')
  }
  return date
}

export function getBudgetPeriodKey(period: BudgetPeriod, dateKey: string): string {
  const date = parseDateKey(dateKey)
  if (period === 'monthly') return dateKey.slice(0, 7)
  if (period === 'daily') return dateKey
  const mondayOffset = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - mondayOffset)
  return date.toISOString().slice(0, 10)
}

export function getBudgetPeriodRange(period: BudgetPeriod, periodKey: string): DateRange {
  if (period === 'monthly') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey)) throw new Error('Periode bulanan tidak valid.')
    const [year, month] = periodKey.split('-').map(Number)
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return { from: periodKey + '-01', to: periodKey + '-' + String(lastDay).padStart(2, '0') }
  }
  const start = parseDateKey(periodKey)
  if (period === 'weekly' && start.getUTCDay() !== 1) throw new Error('Periode mingguan harus dimulai pada hari Senin.')
  const end = new Date(start)
  if (period === 'weekly') end.setUTCDate(end.getUTCDate() + 6)
  const endKey = end.toISOString().slice(0, 10)
  return { from: periodKey, to: endKey }
}

export function calculateBudgetProgress(spent: number, budget: number) {
  const safeSpent = Number.isFinite(spent) ? Math.max(0, spent) : 0
  const safeBudget = Number.isFinite(budget) ? Math.max(0, budget) : 0
  return {
    remaining: Math.max(0, safeBudget - safeSpent),
    overBudget: Math.max(0, safeSpent - safeBudget),
    percent: safeBudget > 0 ? Math.min(100, Math.round((safeSpent / safeBudget) * 100)) : 0,
  }
}
