import type { TransactionRecord, WalletRecord } from '../database/db'

export interface WalletBalance {
  walletId: string
  balance: number
}

export function calculateWalletBalances(
  wallets: WalletRecord[],
  transactions: TransactionRecord[],
): WalletBalance[] {
  const balances = new Map(wallets.map((wallet) => [wallet.id, wallet.openingBalance]))

  for (const transaction of transactions) {
    if (transaction.deletedAt) continue

    const amount = transaction.amount
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error('Transaction amount must be a non-negative safe integer')
    }

    if (transaction.type === 'income') {
      requireWallet(balances, transaction.walletId)
      balances.set(transaction.walletId, balances.get(transaction.walletId)! + amount)
    } else if (transaction.type === 'expense') {
      requireWallet(balances, transaction.walletId)
      balances.set(transaction.walletId, balances.get(transaction.walletId)! - amount)
    } else {
      if (!transaction.destinationWalletId || transaction.destinationWalletId === transaction.walletId) {
        throw new Error('Transfer requires two different wallets')
      }
      requireWallet(balances, transaction.walletId)
      requireWallet(balances, transaction.destinationWalletId)
      balances.set(transaction.walletId, balances.get(transaction.walletId)! - amount)
      balances.set(
        transaction.destinationWalletId,
        balances.get(transaction.destinationWalletId)! + amount,
      )
    }
  }

  return [...balances.entries()].map(([walletId, balance]) => ({ walletId, balance }))
}

function requireWallet(balances: Map<string, number>, walletId: string): void {
  if (!balances.has(walletId)) {
    throw new Error(`Unknown wallet: ${walletId}`)
  }
}
