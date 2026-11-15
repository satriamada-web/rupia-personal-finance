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

export interface BudgetRecord {
  id: string
  month: string
  categoryId: string
  amount: number
  createdAt: string
  updatedAt: string
}

export interface SavingsGoalRecord {
  id: string
  name: string
  targetAmount: number
  deadline?: string
  createdAt: string
  updatedAt: string
}

export interface GoalContributionRecord {
  id: string
  goalId: string
  amount: number
  contributionDate: string
  note: string
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
  budgets!: Table<BudgetRecord, string>
  savingsGoals!: Table<SavingsGoalRecord, string>
  goalContributions!: Table<GoalContributionRecord, string>

  constructor() {
    super('rupia-local')
    this.version(1).stores({
      wallets: 'id, name, type, createdAt',
      categories: 'id, type, name, isDefault',
      transactions: 'id, type, walletId, destinationWalletId, categoryId, transactionDate, createdAt, deletedAt',
    })
    this.version(2).stores({
      wallets: 'id, name, type, createdAt',
      categories: 'id, type, name, isDefault',
      transactions: 'id, type, walletId, destinationWalletId, categoryId, transactionDate, createdAt, deletedAt',
      budgets: 'id, month, categoryId, [month+categoryId]',
    })
    this.version(3).stores({
      wallets: 'id, name, type, createdAt',
      categories: 'id, type, name, isDefault',
      transactions: 'id, type, walletId, destinationWalletId, categoryId, transactionDate, createdAt, deletedAt',
      budgets: 'id, month, categoryId, [month+categoryId]',
      savingsGoals: 'id, name, deadline, createdAt',
      goalContributions: 'id, goalId, contributionDate, createdAt',
    })
  }
}

export const db = new RupiaDatabase()
