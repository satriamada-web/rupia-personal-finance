import Dexie, { type Table } from 'dexie'

export interface WalletRecord {
  id: string
  name: string
  type: 'cash' | 'bank' | 'ewallet' | 'other'
  openingBalance: number
  createdAt: string
  updatedAt: string
}

export interface CategoryRecord {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  isDefault: boolean
  createdAt: string
}

export interface TransactionRecord {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  walletId: string
  destinationWalletId?: string
  categoryId?: string
  transactionDate: string
  note: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export class RupiaDatabase extends Dexie {
  wallets!: Table<WalletRecord, string>
  categories!: Table<CategoryRecord, string>
  transactions!: Table<TransactionRecord, string>

  constructor() {
    super('rupia-local')
    this.version(1).stores({
      wallets: 'id, name, type, createdAt',
      categories: 'id, type, name, isDefault',
      transactions: 'id, type, walletId, destinationWalletId, categoryId, transactionDate, createdAt, deletedAt',
    })
  }
}

export const db = new RupiaDatabase()
