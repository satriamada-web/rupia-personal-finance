import { describe, expect, it } from 'vitest'
import { calculateWalletBalances } from '../src/core/balance'
import type { TransactionRecord, WalletRecord } from '../src/database/db'

const wallets: WalletRecord[] = [
  { id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 100000, createdAt: '', updatedAt: '' },
  { id: 'bank', name: 'Bank', type: 'bank', openingBalance: 500000, createdAt: '', updatedAt: '' },
]

function transaction(overrides: Partial<TransactionRecord>): TransactionRecord {
  return {
    id: 't1',
    type: 'expense',
    amount: 25000,
    walletId: 'cash',
    transactionDate: '2026-11-15',
    note: '',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('calculateWalletBalances', () => {
  it('applies income and expense to the correct wallet', () => {
    const result = calculateWalletBalances(wallets, [
      transaction({ type: 'income', amount: 50000 }),
      transaction({ type: 'expense', amount: 10000 }),
    ])
    expect(result).toEqual([{ walletId: 'cash', balance: 140000 }, { walletId: 'bank', balance: 500000 }])
  })

  it('moves money between wallets without changing total balance', () => {
    const result = calculateWalletBalances(wallets, [
      transaction({ type: 'transfer', amount: 75000, destinationWalletId: 'bank' }),
    ])
    expect(result).toEqual([{ walletId: 'cash', balance: 25000 }, { walletId: 'bank', balance: 575000 }])
  })

  it('ignores soft-deleted transactions', () => {
    const result = calculateWalletBalances(wallets, [
      transaction({ deletedAt: '2026-11-15T00:00:00.000Z' }),
    ])
    expect(result[0].balance).toBe(100000)
  })
})
