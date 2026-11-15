import { db, type BudgetRecord, type CategoryRecord, type TransactionRecord, type WalletRecord } from '../database/db'

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
  const [wallets, categories, transactions, budgets] = await Promise.all([
    db.wallets.toArray(), db.categories.toArray(), db.transactions.orderBy('transactionDate').reverse().toArray(), db.budgets.toArray(),
  ])
  return { wallets, categories, transactions: transactions.filter((item) => !item.deletedAt), budgets }
}

export async function updateTransaction(id: string, input: NewTransaction): Promise<void> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error('Masukkan nominal lebih dari nol dalam Rupiah bulat.')
  if (!input.transactionDate || Number.isNaN(Date.parse(input.transactionDate))) throw new Error('Tanggal transaksi tidak valid.')
  const [existing, wallet, category] = await Promise.all([
    db.transactions.get(id), db.wallets.get(input.walletId), db.categories.get(input.categoryId),
  ])
  if (!existing || existing.deletedAt) throw new Error('Transaksi tidak ditemukan atau sudah dihapus.')
  if (!wallet) throw new Error('Dompet tidak ditemukan.')
  if (!category || category.type !== input.type) throw new Error('Kategori tidak sesuai dengan jenis transaksi.')
  await db.transactions.update(id, {
    type: input.type, amount: input.amount, walletId: input.walletId,
    categoryId: input.categoryId, transactionDate: input.transactionDate,
    note: input.note.trim(), updatedAt: new Date().toISOString(),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await db.transactions.get(id)
  if (!existing || existing.deletedAt) throw new Error('Transaksi tidak ditemukan atau sudah dihapus.')
  const now = new Date().toISOString()
  await db.transactions.update(id, { deletedAt: now, updatedAt: now })
}


export async function createWallet(input: { name: string; type: WalletRecord['type']; openingBalance: number }): Promise<void> {
  const name = input.name.trim()
  if (!name) throw new Error('Nama dompet wajib diisi.')
  if (name.length > 40) throw new Error('Nama dompet maksimal 40 karakter.')
  if (!Number.isSafeInteger(input.openingBalance) || input.openingBalance < 0) throw new Error('Saldo awal harus berupa Rupiah bulat dan tidak boleh negatif.')
  const now = new Date().toISOString()
  await db.wallets.add({
    id: makeId(), name, type: input.type, openingBalance: input.openingBalance,
    createdAt: now, updatedAt: now,
  })
}

export async function addTransfer(input: {
  amount: number; walletId: string; destinationWalletId: string; transactionDate: string; note: string
}): Promise<void> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error('Nominal transfer harus lebih dari nol.')
  if (input.walletId === input.destinationWalletId) throw new Error('Dompet asal dan tujuan harus berbeda.')
  if (!input.transactionDate || Number.isNaN(Date.parse(input.transactionDate))) throw new Error('Tanggal transfer tidak valid.')
  const [source, destination] = await Promise.all([
    db.wallets.get(input.walletId), db.wallets.get(input.destinationWalletId),
  ])
  if (!source || !destination) throw new Error('Dompet asal atau tujuan tidak ditemukan.')
  const now = new Date().toISOString()
  await db.transactions.add({
    id: makeId(), type: 'transfer', amount: input.amount, walletId: input.walletId,
    destinationWalletId: input.destinationWalletId, transactionDate: input.transactionDate,
    note: input.note.trim(), createdAt: now, updatedAt: now,
  })
}


export async function setMonthlyBudget(input: { month: string; categoryId: string; amount: number }): Promise<void> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)) throw new Error('Pilih bulan yang valid.')
  if (!Number.isSafeInteger(input.amount) || input.amount < 0) throw new Error('Anggaran harus berupa Rupiah bulat dan tidak boleh negatif.')
  const category = await db.categories.get(input.categoryId)
  if (!category || category.type !== 'expense') throw new Error('Anggaran hanya dapat dibuat untuk kategori pengeluaran.')
  const id = `budget-${input.month}-${input.categoryId}`
  if (input.amount === 0) {
    await db.budgets.delete(id)
    return
  }
  const existing = await db.budgets.get(id)
  const now = new Date().toISOString()
  const record: BudgetRecord = {
    id, month: input.month, categoryId: input.categoryId, amount: input.amount,
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  }
  await db.budgets.put(record)
}


export interface FinanceBackup {
  app: 'Rupia'
  version: 1
  exportedAt: string
  data: {
    wallets: WalletRecord[]
    categories: CategoryRecord[]
    transactions: TransactionRecord[]
    budgets: BudgetRecord[]
  }
}

export async function createFinanceBackup(): Promise<FinanceBackup> {
  const [wallets, categories, transactions, budgets] = await Promise.all([
    db.wallets.toArray(), db.categories.toArray(), db.transactions.toArray(), db.budgets.toArray(),
  ])
  return {
    app: 'Rupia',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { wallets, categories, transactions, budgets },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateBackup(value: unknown): FinanceBackup {
  if (!isRecord(value) || value.app !== 'Rupia' || value.version !== 1 || !isRecord(value.data)) {
    throw new Error('Format cadangan tidak dikenali atau versinya tidak didukung.')
  }
  const { wallets, categories, transactions, budgets } = value.data
  if (![wallets, categories, transactions, budgets].every(Array.isArray)) {
    throw new Error('File cadangan tidak lengkap atau strukturnya rusak.')
  }
  const validWallets = (wallets as unknown[]).every((item) => isRecord(item)
    && typeof item.id === 'string' && typeof item.name === 'string'
    && ['cash', 'bank', 'ewallet', 'other'].includes(String(item.type))
    && Number.isSafeInteger(item.openingBalance) && Number(item.openingBalance) >= 0
    && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string')
  const validCategories = (categories as unknown[]).every((item) => isRecord(item)
    && typeof item.id === 'string' && typeof item.name === 'string'
    && ['income', 'expense'].includes(String(item.type))
    && typeof item.icon === 'string' && typeof item.color === 'string'
    && typeof item.isDefault === 'boolean' && typeof item.createdAt === 'string')
  const validTransactions = (transactions as unknown[]).every((item) => isRecord(item)
    && typeof item.id === 'string' && ['income', 'expense', 'transfer'].includes(String(item.type))
    && Number.isSafeInteger(item.amount) && Number(item.amount) > 0
    && typeof item.walletId === 'string' && typeof item.transactionDate === 'string'
    && !Number.isNaN(Date.parse(item.transactionDate)) && typeof item.note === 'string'
    && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string'
    && (item.categoryId === undefined || typeof item.categoryId === 'string')
    && (item.destinationWalletId === undefined || typeof item.destinationWalletId === 'string')
    && (item.deletedAt === undefined || typeof item.deletedAt === 'string'))
  const validBudgets = (budgets as unknown[]).every((item) => isRecord(item)
    && typeof item.id === 'string' && typeof item.month === 'string'
    && /^\\d{4}-(0[1-9]|1[0-2])$/.test(item.month)
    && typeof item.categoryId === 'string' && Number.isSafeInteger(item.amount)
    && Number(item.amount) > 0 && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string')
  if (!validWallets || !validCategories || !validTransactions || !validBudgets) {
    throw new Error('Ada data yang tidak valid di dalam file cadangan.')
  }
  const walletIds = new Set((wallets as WalletRecord[]).map((item) => item.id))
  const categoryMap = new Map((categories as CategoryRecord[]).map((item) => [item.id, item]))
  if ((transactions as TransactionRecord[]).some((item) =>
    !walletIds.has(item.walletId)
    || (item.destinationWalletId !== undefined && !walletIds.has(item.destinationWalletId))
    || (item.type === 'transfer' ? !item.destinationWalletId || item.categoryId !== undefined : !item.categoryId || categoryMap.get(item.categoryId)?.type !== item.type)
  ) || (budgets as BudgetRecord[]).some((item) => categoryMap.get(item.categoryId)?.type !== 'expense')) {
    throw new Error('Relasi dompet atau kategori dalam cadangan tidak cocok.')
  }
  return value as unknown as FinanceBackup
}

export async function restoreFinanceBackup(value: unknown): Promise<void> {
  const backup = validateBackup(value)
  await db.transaction('rw', db.wallets, db.categories, db.transactions, db.budgets, async () => {
    await Promise.all([db.wallets.clear(), db.categories.clear(), db.transactions.clear(), db.budgets.clear()])
    await db.wallets.bulkPut(backup.data.wallets)
    await db.categories.bulkPut(backup.data.categories)
    await db.transactions.bulkPut(backup.data.transactions)
    await db.budgets.bulkPut(backup.data.budgets)
  })
}


export async function createCategory(input: { name: string; type: CategoryRecord['type'] }): Promise<void> {
  const name = input.name.trim()
  if (!name) throw new Error('Nama kategori wajib diisi.')
  if (name.length > 30) throw new Error('Nama kategori maksimal 30 karakter.')
  const duplicate = await db.categories.filter((item) => item.type === input.type && item.name.toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID')).first()
  if (duplicate) throw new Error('Kategori dengan nama tersebut sudah ada.')
  await db.categories.add({
    id: makeId(), name, type: input.type, icon: input.type === 'income' ? 'plus-circle' : 'tag',
    color: input.type === 'income' ? '#39815d' : '#c17a51', isDefault: false,
    createdAt: new Date().toISOString(),
  })
}

export async function updateCategory(id: string, nameInput: string): Promise<void> {
  const name = nameInput.trim()
  if (!name) throw new Error('Nama kategori wajib diisi.')
  if (name.length > 30) throw new Error('Nama kategori maksimal 30 karakter.')
  const category = await db.categories.get(id)
  if (!category) throw new Error('Kategori tidak ditemukan.')
  if (category.isDefault) throw new Error('Kategori bawaan tidak dapat diubah.')
  const duplicate = await db.categories.filter((item) => item.id !== id && item.type === category.type && item.name.toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID')).first()
  if (duplicate) throw new Error('Kategori dengan nama tersebut sudah ada.')
  await db.categories.update(id, { name })
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await db.categories.get(id)
  if (!category) throw new Error('Kategori tidak ditemukan.')
  if (category.isDefault) throw new Error('Kategori bawaan tidak dapat dihapus.')
  const [transactionCount, budgetCount] = await Promise.all([
    db.transactions.where('categoryId').equals(id).count(),
    db.budgets.where('categoryId').equals(id).count(),
  ])
  if (transactionCount || budgetCount) throw new Error('Kategori sudah digunakan. Hapus atau ubah transaksi dan anggarannya terlebih dahulu.')
  await db.categories.delete(id)
}
