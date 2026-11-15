import { db, type CategoryRecord, type TransactionRecord, type WalletRecord } from '../database/db'

const defaultCategories: Array<Pick<CategoryRecord, 'id' | 'name' | 'type' | 'icon' | 'color' | 'isDefault'>> = [
  { id: 'income-salary', name: 'Uang saku', type: 'income', icon: 'wallet', color: '#39815d', isDefault: true },
  { id: 'income-other', name: 'Pemasukan lain', type: 'income', icon: 'plus', color: '#39815d', isDefault: true },
  { id: 'expense-food', name: 'Makanan', type: 'expense', icon: 'utensils', color: '#c17a51', isDefault: true },
  { id: 'expense-transport', name: 'Transportasi', type: 'expense', icon: 'car', color: '#c17a51', isDefault: true },
  { id: 'expense-bills', name: 'Tagihan', type: 'expense', icon: 'receipt', color: '#c17a51', isDefault: true },
  { id: 'expense-shopping', name: 'Belanja', type: 'expense', icon: 'shopping-bag', color: '#c17a51', isDefault: true },
  { id: 'expense-other', name: 'Lainnya', type: 'expense', icon: 'circle', color: '#c17a51', isDefault: true },
]

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `rupia-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function initializeFinanceData(): Promise<void> {
  await db.transaction('rw', db.wallets, db.categories, async () => {
    if (await db.wallets.count() === 0) {
      const now = new Date().toISOString()
      const wallet: WalletRecord = { id: 'wallet-cash', name: 'Tunai', type: 'cash', openingBalance: 0, createdAt: now, updatedAt: now }
      await db.wallets.add(wallet)
    }
    const existing = new Set((await db.categories.toArray()).map((category) => category.id))
    const now = new Date().toISOString()
    const missing = defaultCategories.filter((category) => !existing.has(category.id)).map((category) => ({ ...category, createdAt: now }))
    if (missing.length) await db.categories.bulkAdd(missing)
  })
}

export interface NewTransaction {
  type: 'income' | 'expense'
  amount: number
  walletId: string
  categoryId: string
  transactionDate: string
  note: string
}

export async function addTransaction(input: NewTransaction): Promise<void> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error('Masukkan nominal lebih dari nol dalam Rupiah bulat.')
  if (!input.transactionDate || Number.isNaN(Date.parse(input.transactionDate))) throw new Error('Tanggal transaksi tidak valid.')
  const [wallet, category] = await Promise.all([db.wallets.get(input.walletId), db.categories.get(input.categoryId)])
  if (!wallet) throw new Error('Dompet tidak ditemukan.')
  if (!category || category.type !== input.type) throw new Error('Kategori tidak sesuai dengan jenis transaksi.')
  const now = new Date().toISOString()
  const transaction: TransactionRecord = {
    id: makeId(), type: input.type, amount: input.amount, walletId: input.walletId,
    categoryId: input.categoryId, transactionDate: input.transactionDate,
    note: input.note.trim(), createdAt: now, updatedAt: now,
  }
  await db.transactions.add(transaction)
}

export async function getFinanceSnapshot() {
  const [wallets, categories, transactions] = await Promise.all([
    db.wallets.toArray(), db.categories.toArray(), db.transactions.orderBy('transactionDate').reverse().toArray(),
  ])
  return { wallets, categories, transactions: transactions.filter((item) => !item.deletedAt) }
}
