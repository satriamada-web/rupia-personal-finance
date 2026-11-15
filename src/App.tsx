import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart3, Plus, Wallet, X, CalendarDays, CheckCircle2, Pencil, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { calculateWalletBalances } from './core/balance'
import { formatRupiah } from './core/money'
import { addTransaction, addTransfer, createWallet, deleteTransaction, getFinanceSnapshot, initializeFinanceData, setMonthlyBudget, updateTransaction, createFinanceBackup, restoreFinanceBackup, createCategory, updateCategory, deleteCategory, createSavingsGoal, addGoalContribution, deleteSavingsGoal } from './core/finance'
import type { BudgetRecord, CategoryRecord, TransactionRecord, WalletRecord, SavingsGoalRecord, GoalContributionRecord } from './database/db'

type TransactionType = 'income' | 'expense'
const today = () => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
const currentMonth = () => today().slice(0, 7)

export default function App() {
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [budgets, setBudgets] = useState<BudgetRecord[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalRecord[]>([])
  const [goalContributions, setGoalContributions] = useState<GoalContributionRecord[]>([])
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionDate, setContributionDate] = useState(today())
  const [contributionNote, setContributionNote] = useState('')
  const [goalError, setGoalError] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)
  const [budgetMonth, setBudgetMonth] = useState(currentMonth())
  const [analyticsMonth, setAnalyticsMonth] = useState(currentMonth())
  const [calendarMonth, setCalendarMonth] = useState(currentMonth())
  const [selectedDate, setSelectedDate] = useState(today())
  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState('all')
  const [historyCategory, setHistoryCategory] = useState('all')
  const [historyWallet, setHistoryWallet] = useState('all')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({})
  const [budgetSaving, setBudgetSaving] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryRecord['type']>('expense')
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState('')
  const [categorySaving, setCategorySaving] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [backupBusy, setBackupBusy] = useState(false)
  const backupInputRef = useRef<HTMLInputElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [transactionWalletId, setTransactionWalletId] = useState('')
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [walletName, setWalletName] = useState('')
  const [walletType, setWalletType] = useState<WalletRecord['type']>('bank')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferFrom, setTransferFrom] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferDate, setTransferDate] = useState(today())
  const [transferNote, setTransferNote] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [transactionDate, setTransactionDate] = useState(today())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const snapshot = await getFinanceSnapshot()
    setWallets(snapshot.wallets); setCategories(snapshot.categories); setTransactions(snapshot.transactions); setBudgets(snapshot.budgets); setSavingsGoals(snapshot.savingsGoals); setGoalContributions(snapshot.goalContributions)
  }

  useEffect(() => {
    let active = true
    initializeFinanceData().then(getFinanceSnapshot).then((snapshot) => {
      if (!active) return
      setWallets(snapshot.wallets); setCategories(snapshot.categories); setTransactions(snapshot.transactions); setBudgets(snapshot.budgets); setSavingsGoals(snapshot.savingsGoals); setGoalContributions(snapshot.goalContributions); setReady(true)
    }).catch(() => { if (active) setError('Data lokal belum dapat dibuka. Coba muat ulang aplikasi.') })
    return () => { active = false }
  }, [])

  const availableCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type])
  useEffect(() => {
    if (availableCategories.length && !availableCategories.some((item) => item.id === categoryId)) setCategoryId(availableCategories[0].id)
  }, [availableCategories, categoryId])

  const balances = useMemo(() => calculateWalletBalances(wallets, transactions), [wallets, transactions])
  const totalBalance = balances.reduce((sum, item) => sum + item.balance, 0)
  const totalIncome = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const monthlyExpenses = transactions.filter((item) => item.type === 'expense' && item.transactionDate.startsWith(budgetMonth))
  const monthlyBudgetRows = categories.filter((category) => category.type === 'expense').map((category) => {
    const budget = budgets.find((item) => item.month === budgetMonth && item.categoryId === category.id)
    const spent = monthlyExpenses.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0)
    return { category, budget, spent, percent: budget ? Math.min(100, Math.round(spent / budget.amount * 100)) : 0 }
  })
  const totalMonthlyBudget = monthlyBudgetRows.reduce((sum, row) => sum + (row.budget?.amount ?? 0), 0)
  const totalMonthlySpent = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0)
  const safeMonth = currentMonth()
  const safeBudgetRows = categories.filter((category) => category.type === 'expense').map((category) => {
    const budget = budgets.find((item) => item.month === safeMonth && item.categoryId === category.id)
    const spent = transactions.filter((item) => item.type === 'expense' && item.categoryId === category.id && item.transactionDate.startsWith(safeMonth)).reduce((sum, item) => sum + item.amount, 0)
    return { category, budget, spent, remaining: budget ? Math.max(0, budget.amount - spent) : 0 }
  })
  const configuredSafeBudgets = safeBudgetRows.filter((row) => row.budget)
  const safeBudgetRemaining = configuredSafeBudgets.reduce((sum, row) => sum + row.remaining, 0)
  const safeUnbudgetedExpenses = transactions.filter((item) => item.type === 'expense' && item.transactionDate.startsWith(safeMonth) && !safeBudgetRows.some((row) => row.category.id === item.categoryId && row.budget)).reduce((sum, item) => sum + item.amount, 0)
  const safeToSpend = configuredSafeBudgets.length ? Math.min(Math.max(0, totalBalance), safeBudgetRemaining) : null
  const analyticsDate = new Date(analyticsMonth + '-01T12:00:00')
  const analyticsMonthLabel = analyticsDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const analyticsMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(analyticsDate.getFullYear(), analyticsDate.getMonth() - 5 + index, 1, 12)
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
  })
  const analyticsTotals = analyticsMonths.map((month) => ({
    month,
    income: transactions.filter((item) => item.type === 'income' && item.transactionDate.startsWith(month)).reduce((sum, item) => sum + item.amount, 0),
    expense: transactions.filter((item) => item.type === 'expense' && item.transactionDate.startsWith(month)).reduce((sum, item) => sum + item.amount, 0),
  }))
  const selectedAnalytics = analyticsTotals.find((item) => item.month === analyticsMonth) ?? { month: analyticsMonth, income: 0, expense: 0 }
  const previousAnalyticsDate = new Date(analyticsDate.getFullYear(), analyticsDate.getMonth() - 1, 1, 12)
  const previousAnalyticsMonth = previousAnalyticsDate.getFullYear() + '-' + String(previousAnalyticsDate.getMonth() + 1).padStart(2, '0')
  const previousAnalytics = transactions.filter((item) => item.transactionDate.startsWith(previousAnalyticsMonth))
  const previousExpense = previousAnalytics.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const previousIncome = previousAnalytics.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenseChange = previousExpense ? Math.round((selectedAnalytics.expense - previousExpense) / previousExpense * 100) : null
  const incomeChange = previousIncome ? Math.round((selectedAnalytics.income - previousIncome) / previousIncome * 100) : null
  const expenseByCategory = categories.filter((category) => category.type === 'expense').map((category) => ({
    category,
    amount: transactions.filter((item) => item.type === 'expense' && item.categoryId === category.id && item.transactionDate.startsWith(analyticsMonth)).reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount)
  const maxAnalyticsValue = Math.max(1, ...analyticsTotals.flatMap((item) => [item.income, item.expense]))

  const filteredTransactions = transactions.filter((item) => {
    const category = categories.find((entry) => entry.id === item.categoryId)
    const source = wallets.find((entry) => entry.id === item.walletId)
    const destination = wallets.find((entry) => entry.id === item.destinationWalletId)
    const query = historySearch.trim().toLocaleLowerCase('id-ID')
    const searchable = [item.note, category?.name, source?.name, destination?.name, item.type].filter(Boolean).join(' ').toLocaleLowerCase('id-ID')
    return (historyType === 'all' || item.type === historyType)
      && (historyCategory === 'all' || item.categoryId === historyCategory)
      && (historyWallet === 'all' || item.walletId === historyWallet || item.destinationWalletId === historyWallet)
      && (!historyFrom || item.transactionDate >= historyFrom)
      && (!historyTo || item.transactionDate <= historyTo)
      && (!query || searchable.includes(query))
  })
  const hasActiveHistoryFilter = Boolean(historySearch || historyType !== 'all' || historyCategory !== 'all' || historyWallet !== 'all' || historyFrom || historyTo)
  function resetHistoryFilters() {
    setHistorySearch(''); setHistoryType('all'); setHistoryCategory('all'); setHistoryWallet('all'); setHistoryFrom(''); setHistoryTo('')
  }

  const calendarDate = new Date(calendarMonth + '-01T12:00:00')
  const calendarDaysCount = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate()
  const calendarStartOffset = calendarDate.getDay()
  const calendarCells = Array.from({ length: calendarStartOffset + calendarDaysCount }, (_, index) => index < calendarStartOffset ? null : index - calendarStartOffset + 1)
  const calendarTransactions = transactions.filter((item) => item.transactionDate.startsWith(calendarMonth))
  const selectedDayTransactions = calendarTransactions.filter((item) => item.transactionDate === selectedDate)
  const calendarIncome = calendarTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const calendarExpense = calendarTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const monthLabel = calendarDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  function shiftCalendarMonth(amount: number) {
    const next = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + amount, 1, 12)
    const nextMonth = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0')
    setCalendarMonth(nextMonth)
    setSelectedDate(nextMonth + '-01')
  }


  async function exportBackup() {
    setBackupBusy(true); setBackupStatus('')
    try {
      const backup = await createFinanceBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'rupia-backup-' + today() + '.json'
      document.body.appendChild(link); link.click(); link.remove()
      URL.revokeObjectURL(url)
      setBackupStatus('Cadangan berhasil dibuat. Simpan file JSON di tempat yang aman.')
    } catch (cause) {
      setBackupStatus(cause instanceof Error ? cause.message : 'Cadangan gagal dibuat.')
    } finally { setBackupBusy(false) }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBackupBusy(true); setBackupStatus('')
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!window.confirm('Pulihkan cadangan ini? Seluruh data Rupia saat ini akan diganti dengan isi file. Sebaiknya ekspor cadangan data sekarang terlebih dahulu.')) return
      await restoreFinanceBackup(parsed)
      await refresh()
      setBackupStatus('Data berhasil dipulihkan dari file cadangan.')
    } catch (cause) {
      setBackupStatus(cause instanceof Error ? cause.message : 'File cadangan tidak dapat dipulihkan.')
    } finally { setBackupBusy(false) }
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const numericAmount = Number(amount)
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) { setError('Masukkan nominal Rupiah berupa angka bulat lebih dari nol.'); return }
    if (!wallets.some((wallet) => wallet.id === transactionWalletId) || !categoryId) { setError('Dompet atau kategori belum siap. Coba lagi.'); return }
    setSaving(true)
    try {
      const input = { type, amount: numericAmount, walletId: transactionWalletId, categoryId, transactionDate, note }
      if (editingId) await updateTransaction(editingId, input)
      else await addTransaction(input)
      await refresh(); setAmount(''); setNote(''); setTransactionDate(today()); setEditingId(null); setModalOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transaksi gagal disimpan.')
    } finally { setSaving(false) }
  }

  function openNewTransaction() {
    setEditingId(null); setType('expense'); setAmount(''); setNote(''); setTransactionDate(today()); setTransactionWalletId(wallets[0]?.id ?? ''); setError(''); setModalOpen(true)
  }

  function openEditTransaction(transaction: TransactionRecord) {
    setEditingId(transaction.id); setType(transaction.type === 'income' ? 'income' : 'expense')
    setAmount(String(transaction.amount)); setTransactionWalletId(transaction.walletId); setCategoryId(transaction.categoryId ?? '')
    setTransactionDate(transaction.transactionDate); setNote(transaction.note); setError(''); setModalOpen(true)
  }

  async function saveBudget(categoryId: string) {
    const existing = budgets.find((item) => item.month === budgetMonth && item.categoryId === categoryId)
    const amountValue = Number(budgetDrafts[categoryId] ?? existing?.amount ?? 0)
    setBudgetSaving(categoryId); setError('')
    try { await setMonthlyBudget({ month: budgetMonth, categoryId, amount: amountValue }); await refresh(); setBudgetDrafts((current) => { const next = { ...current }; delete next[categoryId]; return next }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Anggaran gagal disimpan.') }
    finally { setBudgetSaving(null) }
  }

  function openNewCategory() {
    setCategoryEditingId(null); setCategoryName(''); setCategoryType('expense'); setCategoryError(''); setCategoryModalOpen(true)
  }

  function openEditCategory(category: CategoryRecord) {
    setCategoryEditingId(category.id); setCategoryName(category.name); setCategoryType(category.type); setCategoryError(''); setCategoryModalOpen(true)
  }

  async function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setGoalError(''); setGoalSaving(true)
    try {
      await createSavingsGoal({ name: goalName, targetAmount: Number(goalTarget), ...(goalDeadline ? { deadline: goalDeadline } : {}) })
      await refresh(); setGoalModalOpen(false); setGoalName(''); setGoalTarget(''); setGoalDeadline('')
    } catch (cause) { setGoalError(cause instanceof Error ? cause.message : 'Target gagal disimpan.') }
    finally { setGoalSaving(false) }
  }

  async function submitContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!contributionGoalId) return
    setGoalError(''); setGoalSaving(true)
    try {
      await addGoalContribution({ goalId: contributionGoalId, amount: Number(contributionAmount), contributionDate, note: contributionNote })
      await refresh(); setContributionGoalId(null); setContributionAmount(''); setContributionNote('')
    } catch (cause) { setGoalError(cause instanceof Error ? cause.message : 'Kontribusi gagal disimpan.') }
    finally { setGoalSaving(false) }
  }

  async function handleDeleteGoal(goal: SavingsGoalRecord) {
    if (!window.confirm('Hapus target "' + goal.name + '" beserta catatan kontribusinya?')) return
    try { await deleteSavingsGoal(goal.id); await refresh() }
    catch (cause) { setGoalError(cause instanceof Error ? cause.message : 'Target gagal dihapus.') }
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCategoryError(''); setCategorySaving(true)
    try {
      if (categoryEditingId) await updateCategory(categoryEditingId, categoryName)
      else await createCategory({ name: categoryName, type: categoryType })
      await refresh(); setCategoryModalOpen(false)
    } catch (cause) {
      setCategoryError(cause instanceof Error ? cause.message : 'Kategori gagal disimpan.')
    } finally { setCategorySaving(false) }
  }

  async function handleDeleteCategory(category: CategoryRecord) {
    if (!window.confirm('Hapus kategori "' + category.name + '"? Kategori bawaan tidak dapat dihapus.')) return
    setCategoryError('')
    try { await deleteCategory(category.id); await refresh() }
    catch (cause) { setCategoryError(cause instanceof Error ? cause.message : 'Kategori gagal dihapus.') }
  }

  async function submitWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const balance = Number(openingBalance)
    try {
      await createWallet({ name: walletName, type: walletType, openingBalance: balance })
      await refresh(); setWalletName(''); setWalletType('bank'); setOpeningBalance('0'); setWalletModalOpen(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Dompet gagal dibuat.') }
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    try {
      await addTransfer({ amount: Number(transferAmount), walletId: transferFrom, destinationWalletId: transferTo, transactionDate: transferDate, note: transferNote })
      await refresh(); setTransferAmount(''); setTransferNote(''); setTransferDate(today()); setTransferModalOpen(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Transfer gagal disimpan.') }
  }

  async function handleDelete(transaction: TransactionRecord) {
    const label = transaction.note || 'transaksi ini'
    if (!window.confirm('Hapus ' + label + '? Saldo dan ringkasan akan dihitung ulang.')) return
    try { await deleteTransaction(transaction.id); await refresh(); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Transaksi gagal dihapus.') }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Rupia beranda"><span className="brand-mark">R</span><span>rupia</span></a>
        <span className="offline-pill"><span className="status-dot" /> Tersimpan di perangkat</span>
      </header>
      <section className="welcome">
        <p className="eyebrow">KEUANGAN PRIBADIMU</p>
        <h1>Uangmu, lebih <span>terarah.</span></h1>
        <p className="welcome-copy">Mulai dengan mencatat. Pelan-pelan, kamu akan lebih mengenal ke mana uangmu pergi.</p>
      </section>
      <section className="balance-card" aria-labelledby="balance-title">
        <div className="balance-top"><span id="balance-title">Total saldo</span><Wallet size={19} aria-hidden="true" /></div>
        <p className="balance-amount">{ready ? formatRupiah(totalBalance) : 'Memuat…'}</p>
        <p className="balance-note">{wallets.length ? `Dompet utama: ${wallets[0].name}` : 'Saldo tersimpan di perangkat ini.'}</p>
        <div className="balance-decoration" aria-hidden="true" />
      </section>
      <section className="safe-section" aria-labelledby="safe-title">
        <div className="section-heading"><div><p className="eyebrow">BATAS BELANJA BULAN INI</p><h2 id="safe-title">Aman digunakan</h2></div><CheckCircle2 size={20} /></div>
        {safeToSpend === null ? <div className="safe-empty"><strong>Atur anggaran terlebih dahulu</strong><p>Rupia perlu mengetahui batas pengeluaranmu agar bisa memperkirakan uang yang aman digunakan.</p></div> : <>
          <p className="safe-amount">{formatRupiah(safeToSpend)}</p>
          <p className="safe-caption">Perkiraan batas maksimal yang masih aman digunakan bulan ini.</p>
          <div className="safe-breakdown">
            <div><span>Sisa anggaran kategori</span><strong>{formatRupiah(safeBudgetRemaining)}</strong></div>
            <div><span>Saldo seluruh dompet</span><strong>{formatRupiah(Math.max(0, totalBalance))}</strong></div>
          </div>
          {safeUnbudgetedExpenses > 0 && <p className="safe-warning">Perhatian: ada {formatRupiah(safeUnbudgetedExpenses)} pengeluaran pada kategori tanpa anggaran. Angka aman digunakan belum memperhitungkan batas untuk kategori tersebut.</p>}
          {safeBudgetRemaining > Math.max(0, totalBalance) && <p className="safe-caption">Nilai dibatasi oleh saldo yang tersedia, bukan hanya sisa anggaran.</p>}
        </>}
      </section>
      <section className="wallet-section">
        <div className="section-heading"><div><p className="eyebrow">TEMPAT PENYIMPANAN</p><h2>Dompetmu</h2></div><button className="secondary-button" type="button" onClick={() => { setError(''); setWalletModalOpen(true) }}><Plus size={15} /> Dompet</button></div>
        <div className="wallet-list">{wallets.map((wallet) => { const balance = balances.find((item) => item.walletId === wallet.id)?.balance ?? wallet.openingBalance; return <article className="wallet-item" key={wallet.id}><div className="wallet-item-icon"><Wallet size={17} /></div><div><strong>{wallet.name}</strong><span>{wallet.type === 'cash' ? 'Tunai' : wallet.type === 'bank' ? 'Rekening bank' : wallet.type === 'ewallet' ? 'E-wallet' : 'Lainnya'}</span></div><b>{formatRupiah(balance)}</b></article> })}</div>
        <button className="transfer-button" type="button" onClick={() => { setError(''); setTransferFrom(wallets[0]?.id ?? ''); setTransferTo(wallets[1]?.id ?? ''); setTransferModalOpen(true) }} disabled={wallets.length < 2}><ArrowLeftRight size={16} /> Transfer antar-dompet</button>
      </section>
      <section className="goals-section">
        <div className="section-heading"><div><p className="eyebrow">SIMPAN UNTUK MASA DEPAN</p><h2>Target tabungan</h2></div><button className="secondary-button" type="button" onClick={() => { setGoalError(''); setGoalModalOpen(true) }}><Plus size={15} /> Target</button></div>
        {savingsGoals.length ? <div className="goals-list">{savingsGoals.map((goal) => {
          const contributed = goalContributions.filter((item) => item.goalId === goal.id).reduce((sum, item) => sum + item.amount, 0)
          const percent = Math.min(100, Math.round(contributed / goal.targetAmount * 100))
          return <article className="goal-card" key={goal.id}>
            <div className="goal-heading"><div><strong>{goal.name}</strong><span>{goal.deadline ? 'Target: ' + new Date(goal.deadline + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa batas waktu'}</span></div><button className="row-action delete-action" type="button" aria-label={'Hapus target ' + goal.name} onClick={() => handleDeleteGoal(goal)}><Trash2 size={14} /></button></div>
            <div className="goal-amounts"><strong>{formatRupiah(contributed)}</strong><span>dari {formatRupiah(goal.targetAmount)}</span></div>
            <div className="goal-track"><i style={{ width: percent + '%' }} /></div>
            <div className="goal-footer"><span>{percent}% tercapai{contributed >= goal.targetAmount ? ' · Target tercapai!' : ''}</span><button type="button" onClick={() => { setGoalError(''); setContributionGoalId(goal.id); setContributionAmount(''); setContributionDate(today()); setContributionNote('') }}>+ Catat tabungan</button></div>
          </article>
        })}</div> : <div className="goals-empty"><strong>Belum ada target tabungan</strong><p>Buat target pertamamu, lalu catat setiap kali kamu menyisihkan uang.</p></div>}
        {goalError && !goalModalOpen && !contributionGoalId && <p className="form-error" role="alert">{goalError}</p>}
        <p className="goal-hint">Kontribusi tabungan hanya mencatat progres target. Tidak mengurangi saldo dompet atau dihitung sebagai pengeluaran lagi.</p>
      </section>
      <section className="category-section">
        <div className="section-heading"><div><p className="eyebrow">PENGELOMPOKAN UANG</p><h2>Kategori transaksi</h2></div><button className="secondary-button" type="button" onClick={openNewCategory}><Plus size={15} /> Kategori</button></div>
        <p className="category-description">Buat kategori sesuai kebutuhanmu. Kategori bawaan tetap tersedia untuk menjaga data lama.</p>
        <div className="category-groups">
          {(['expense', 'income'] as const).map((kind) => <div className="category-group" key={kind}>
            <strong className="category-group-title">{kind === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</strong>
            {categories.filter((item) => item.type === kind).map((category) => <div className="category-manage-row" key={category.id}>
              <div><span className={'category-type-dot ' + kind} /><strong>{category.name}</strong>{category.isDefault && <small>Bawaan</small>}</div>
              {!category.isDefault && <span className="category-manage-actions"><button type="button" aria-label={'Ubah kategori ' + category.name} onClick={() => openEditCategory(category)}><Pencil size={14} /></button><button type="button" aria-label={'Hapus kategori ' + category.name} onClick={() => handleDeleteCategory(category)}><Trash2 size={14} /></button></span>}
            </div>)}
          </div>)}
        </div>
        {categoryError && !categoryModalOpen && <p className="form-error" role="alert">{categoryError}</p>}
      </section>
      <section className="summary-grid" aria-label="Ringkasan keuangan">
        <article className="summary-card"><div className="summary-icon income"><ArrowDownLeft size={18} /></div><span>Pemasukan tercatat</span><strong>{formatRupiah(totalIncome)}</strong></article>
        <article className="summary-card"><div className="summary-icon expense"><ArrowUpRight size={18} /></div><span>Pengeluaran tercatat</span><strong>{formatRupiah(totalExpense)}</strong></article>
      </section>

      <section className="analytics-section">
        <div className="section-heading"><div><p className="eyebrow">POLA KEUANGAN</p><h2>Analisis keuangan</h2></div><BarChart3 size={20} /></div>
        <label className="field-label" htmlFor="analytics-month">Periode analisis</label>
        <input id="analytics-month" className="form-input analytics-month" type="month" value={analyticsMonth} onChange={(event) => setAnalyticsMonth(event.target.value)} />
        <div className="analytics-kpis">
          <article><span>Pemasukan</span><strong className="amount-income">{formatRupiah(selectedAnalytics.income)}</strong><small>{incomeChange === null ? 'Belum ada data pembanding' : (incomeChange > 0 ? '+' : '') + incomeChange + '% dari bulan lalu'}</small></article>
          <article><span>Pengeluaran</span><strong className="amount-expense">{formatRupiah(selectedAnalytics.expense)}</strong><small>{expenseChange === null ? 'Belum ada data pembanding' : (expenseChange > 0 ? '+' : '') + expenseChange + '% dari bulan lalu'}</small></article>
        </div>
        <div className="analytics-net"><span>Selisih pemasukan - pengeluaran</span><strong className={selectedAnalytics.income - selectedAnalytics.expense >= 0 ? 'amount-income' : 'amount-expense'}>{formatRupiah(selectedAnalytics.income - selectedAnalytics.expense)}</strong></div>
        <div className="analytics-chart-heading"><strong>Tren 6 bulan</strong><span>Perbandingan pemasukan dan pengeluaran</span></div>
        <div className="analytics-chart">
          {analyticsTotals.map((item) => <div className="analytics-chart-column" key={item.month}>
            <div className="analytics-bars">
              <i className="analytics-bar income-bar" style={{ height: Math.max(item.income ? 4 : 0, item.income / maxAnalyticsValue * 100) + '%' }} title={'Pemasukan ' + formatRupiah(item.income)} />
              <i className="analytics-bar expense-bar" style={{ height: Math.max(item.expense ? 4 : 0, item.expense / maxAnalyticsValue * 100) + '%' }} title={'Pengeluaran ' + formatRupiah(item.expense)} />
            </div>
            <span>{new Date(item.month + '-01T12:00:00').toLocaleDateString('id-ID', { month: 'short' })}</span>
          </div>)}
        </div>
        <div className="analytics-legend"><span><i className="income-bar" /> Pemasukan</span><span><i className="expense-bar" /> Pengeluaran</span></div>
        <div className="analytics-category-heading"><strong>Pengeluaran per kategori</strong><span>{analyticsMonthLabel}</span></div>
        {expenseByCategory.length ? expenseByCategory.map(({ category, amount: categoryAmount }) => <div className="analytics-category" key={category.id}>
          <div><strong>{category.name}</strong><span>{formatRupiah(categoryAmount)} · {Math.round(categoryAmount / Math.max(1, selectedAnalytics.expense) * 100)}%</span></div>
          <div className="analytics-category-track"><i style={{ width: (categoryAmount / Math.max(1, selectedAnalytics.expense) * 100) + '%' }} /></div>
        </div>) : <p className="analytics-empty">Belum ada pengeluaran pada periode ini.</p>}
      </section>
      <section className="calendar-section">
        <div className="section-heading"><div><p className="eyebrow">ARUS KAS HARIAN</p><h2>Kalender keuangan</h2></div><div className="calendar-nav"><button type="button" aria-label="Bulan sebelumnya" onClick={() => shiftCalendarMonth(-1)}><ChevronLeft size={18} /></button><button type="button" aria-label="Bulan berikutnya" onClick={() => shiftCalendarMonth(1)}><ChevronRight size={18} /></button></div></div>
        <div className="calendar-month-label">{monthLabel}</div>
        <div className="calendar-summary"><div><span>Pemasukan</span><strong className="amount-income">{formatRupiah(calendarIncome)}</strong></div><div><span>Pengeluaran</span><strong className="amount-expense">{formatRupiah(calendarExpense)}</strong></div></div>
        <div className="calendar-grid" role="group" aria-label="Pilih tanggal">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}
          {calendarCells.map((day, index) => {
            if (!day) return <span className="calendar-empty" key={'empty-' + index} />
            const dateKey = calendarMonth + '-' + String(day).padStart(2, '0')
            const dayItems = calendarTransactions.filter((item) => item.transactionDate === dateKey)
            const hasIncome = dayItems.some((item) => item.type === 'income')
            const hasExpense = dayItems.some((item) => item.type === 'expense')
            return <button type="button" key={dateKey} className={'calendar-day' + (selectedDate === dateKey ? ' selected' : '') + (dateKey === today() ? ' today' : '')} onClick={() => setSelectedDate(dateKey)} aria-pressed={selectedDate === dateKey}>
              <span>{day}</span><i className="calendar-dots">{hasIncome && <b className="income-dot" />}{hasExpense && <b className="expense-dot" />}{dayItems.some((item) => item.type === 'transfer') && <b className="transfer-dot" />}</i>
            </button>
          })}
        </div>
        <div className="calendar-legend"><span><i className="income-dot" /> Pemasukan</span><span><i className="expense-dot" /> Pengeluaran</span><span><i className="transfer-dot" /> Transfer</span></div>
        <div className="calendar-day-detail"><div className="calendar-detail-heading"><strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span>{selectedDayTransactions.length} aktivitas</span></div>
          {selectedDayTransactions.length ? selectedDayTransactions.map((item) => {
            const category = categories.find((entry) => entry.id === item.categoryId)
            const isIncome = item.type === 'income'
            const isTransfer = item.type === 'transfer'
            const source = wallets.find((wallet) => wallet.id === item.walletId)
            const destination = wallets.find((wallet) => wallet.id === item.destinationWalletId)
            return <div className="calendar-transaction" key={item.id}><div><strong>{isTransfer ? 'Transfer antar-dompet' : category?.name ?? 'Transaksi'}</strong><span>{isTransfer ? (source?.name ?? 'Dompet') + ' → ' + (destination?.name ?? 'Dompet tujuan') : item.note || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</span></div><b className={isTransfer ? 'transfer-amount' : isIncome ? 'amount-income' : 'amount-expense'}>{isTransfer ? '' : isIncome ? '+' : '−'}{formatRupiah(item.amount)}</b></div>
          }) : <p className="calendar-no-activity">Belum ada transaksi pada tanggal ini.</p>}
        </div>
      </section>
      <section className="budget-section">
        <div className="section-heading"><div><p className="eyebrow">RENCANA PENGELUARAN</p><h2>Anggaran bulanan</h2></div></div>
        <label className="field-label" htmlFor="budget-month">Periode anggaran</label>
        <input id="budget-month" className="form-input budget-month" type="month" value={budgetMonth} onChange={(event) => { setBudgetMonth(event.target.value); setBudgetDrafts({}); setError('') }} />
        <div className="budget-overview"><div><span>Terpakai bulan ini</span><strong>{formatRupiah(totalMonthlySpent)}</strong></div><div><span>Total anggaran</span><strong>{formatRupiah(totalMonthlyBudget)}</strong></div></div>
        {monthlyBudgetRows.map(({ category, budget, spent, percent }) => <div className="budget-row" key={category.id}>
          <div className="budget-row-heading"><strong>{category.name}</strong><span>{budget ? formatRupiah(spent) + ' / ' + formatRupiah(budget.amount) : formatRupiah(spent) + ' terpakai'}</span></div>
          {budget && <div className="budget-track"><div className={spent > budget.amount ? 'budget-fill over' : 'budget-fill'} style={{ width: percent + '%' }} /></div>}
          <div className="budget-edit"><input className="form-input" type="number" min="0" step="1" inputMode="numeric" aria-label={"Anggaran kategori " + category.name} placeholder="Atur batas anggaran (Rp)" value={budgetDrafts[category.id] ?? (budget ? String(budget.amount) : '')} onChange={(event) => setBudgetDrafts((current) => ({ ...current, [category.id]: event.target.value }))} /><button type="button" className="budget-save" disabled={budgetSaving === category.id} onClick={() => saveBudget(category.id)}>{budgetSaving === category.id ? '…' : 'Simpan'}</button></div>
          {budget && <p className={spent > budget.amount ? 'budget-status over' : 'budget-status'}>{spent > budget.amount ? 'Melebihi anggaran ' + formatRupiah(spent - budget.amount) : 'Sisa ' + formatRupiah(budget.amount - spent) + ' · ' + percent + '% terpakai'}</p>}
        </div>)}
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="budget-hint">Isi nominal batas pengeluaran per kategori. Masukkan 0 lalu simpan untuk menghapus anggaran.</p>
      </section>
      <section className="transaction-section">
        <div className="section-heading">
          <div><p className="eyebrow">CATATAN KEUANGAN</p><h2>Riwayat transaksi</h2></div>
          <button className="primary-button" type="button" onClick={openNewTransaction} disabled={!ready}><Plus size={17} /> Catat</button>
        </div>

        {transactions.length > 0 && <div className="history-filters">
          <div className="history-search"><Search size={17} /><input aria-label="Cari transaksi" placeholder="Cari catatan, kategori, atau dompet..." value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} /><SlidersHorizontal size={16} /></div>
          <div className="history-filter-grid">
            <label><span>Jenis</span><select value={historyType} onChange={(event) => { setHistoryType(event.target.value); if (event.target.value === 'transfer') setHistoryCategory('all') }}><option value="all">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option><option value="transfer">Transfer</option></select></label>
            <label><span>Kategori</span><select value={historyCategory} onChange={(event) => setHistoryCategory(event.target.value)}><option value="all">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span>Dompet</span><select value={historyWallet} onChange={(event) => setHistoryWallet(event.target.value)}><option value="all">Semua dompet</option>{wallets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span>Dari tanggal</span><input type="date" value={historyFrom} max={historyTo || undefined} onChange={(event) => setHistoryFrom(event.target.value)} /></label>
            <label><span>Sampai tanggal</span><input type="date" value={historyTo} min={historyFrom || undefined} onChange={(event) => setHistoryTo(event.target.value)} /></label>
          </div>
          <div className="history-filter-footer"><span>{filteredTransactions.length} dari {transactions.length} transaksi</span>{hasActiveHistoryFilter && <button type="button" onClick={resetHistoryFilters}>Hapus filter</button>}</div>
        </div>}
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="first-step-icon"><BarChart3 size={22} /></div><h3>Belum ada transaksi</h3>
            <p>Catat pemasukan atau pengeluaran pertamamu untuk mulai melihat arus uang.</p>
            <button className="text-button" type="button" onClick={openNewTransaction} disabled={!ready}>+ Tambah transaksi pertama</button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="history-no-results"><Search size={20} /><strong>Tidak ada transaksi yang cocok</strong><span>Coba ubah kata kunci atau filter pencarian.</span><button type="button" onClick={resetHistoryFilters}>Reset pencarian</button></div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map((transaction) => {
              const category = categories.find((item) => item.id === transaction.categoryId)
              const income = transaction.type === 'income'
              const transfer = transaction.type === 'transfer'
              const destination = wallets.find((wallet) => wallet.id === transaction.destinationWalletId)
              return <article className="transaction-row" key={transaction.id}>
                <div className={`transaction-icon ${transfer ? 'transfer' : income ? 'income' : 'expense'}`}>{transfer ? <ArrowLeftRight size={18} /> : income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div>
                <div className="transaction-info"><strong>{transfer ? 'Transfer antar-dompet' : category?.name ?? 'Transaksi'}</strong><span>{transfer ? `${wallets.find((wallet) => wallet.id === transaction.walletId)?.name ?? 'Dompet'} → ${destination?.name ?? 'Dompet tujuan'}` : transaction.note || (income ? 'Pemasukan' : 'Pengeluaran')} · {transaction.transactionDate}</span></div>
                <div className="transaction-trailing"><strong className={transfer ? '' : income ? 'amount-income' : 'amount-expense'}>{transfer ? '' : income ? '+' : '−'}{formatRupiah(transaction.amount)}</strong><div className="transaction-actions">{!transfer && <button type="button" className="row-action" aria-label="Edit transaksi" onClick={() => openEditTransaction(transaction)}><Pencil size={14} /></button>}<button type="button" className="row-action delete-action" aria-label="Hapus transaksi" onClick={() => handleDelete(transaction)}><Trash2 size={14} /></button></div></div>
              </article>
            })}
          </div>
        )}
      </section>
      <section className="backup-section">
        <div className="section-heading"><div><p className="eyebrow">KEAMANAN DATA</p><h2>Backup &amp; Restore</h2></div></div>
        <p className="backup-description">Simpan salinan data keuangan sebagai file JSON, lalu pulihkan kapan saja di perangkat lain.</p>
        <div className="backup-actions">
          <button type="button" className="backup-export" onClick={exportBackup} disabled={!ready || backupBusy}>{backupBusy ? 'Memproses…' : 'Ekspor cadangan'}</button>
          <button type="button" className="backup-import" onClick={() => backupInputRef.current?.click()} disabled={!ready || backupBusy}>Pulihkan dari file</button>
          <input ref={backupInputRef} className="backup-file-input" type="file" accept="application/json,.json" onChange={importBackup} />
        </div>
        {backupStatus && <p className="backup-status" role="status">{backupStatus}</p>}
        <p className="backup-hint">File cadangan berisi dompet, kategori, transaksi, dan anggaran. File ini tidak dienkripsi; simpan di tempat pribadi.</p>
      </section>
      <footer>Rupia <span>•</span> Versi awal 0.2.0 <span>•</span> Data tersimpan lokal</footer>
      {goalModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGoalModalOpen(false) }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title"><div className="modal-heading"><div><p className="eyebrow">TARGET BARU</p><h2 id="goal-modal-title">Buat target tabungan</h2></div><button className="icon-button" type="button" onClick={() => setGoalModalOpen(false)} aria-label="Tutup"><X size={20} /></button></div><form onSubmit={submitGoal}><label className="field-label" htmlFor="goal-name">Nama target</label><input id="goal-name" className="form-input" value={goalName} onChange={(event) => setGoalName(event.target.value)} maxLength={50} placeholder="Misalnya: Laptop baru" required /><label className="field-label" htmlFor="goal-target">Nominal target (Rp)</label><input id="goal-target" className="form-input amount-input" type="number" min="1" step="1" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder="5000000" required /><label className="field-label" htmlFor="goal-deadline">Tenggat waktu <span>(opsional)</span></label><input id="goal-deadline" className="form-input" type="date" value={goalDeadline} onChange={(event) => setGoalDeadline(event.target.value)} />{goalError && <p className="form-error" role="alert">{goalError}</p>}<button className="save-button" type="submit" disabled={goalSaving}>{goalSaving ? 'Menyimpan…' : <><CheckCircle2 size={18} /> Buat target</>}</button></form></section></div>}
      {contributionGoalId && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContributionGoalId(null) }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="contribution-modal-title"><div className="modal-heading"><div><p className="eyebrow">PROGRES TABUNGAN</p><h2 id="contribution-modal-title">Catat kontribusi</h2></div><button className="icon-button" type="button" onClick={() => setContributionGoalId(null)} aria-label="Tutup"><X size={20} /></button></div><form onSubmit={submitContribution}><label className="field-label" htmlFor="contribution-amount">Nominal (Rp)</label><input id="contribution-amount" className="form-input amount-input" type="number" min="1" step="1" value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} placeholder="100000" required /><label className="field-label" htmlFor="contribution-date">Tanggal</label><input id="contribution-date" className="form-input" type="date" value={contributionDate} onChange={(event) => setContributionDate(event.target.value)} required /><label className="field-label" htmlFor="contribution-note">Catatan <span>(opsional)</span></label><input id="contribution-note" className="form-input" value={contributionNote} onChange={(event) => setContributionNote(event.target.value)} maxLength={100} placeholder="Misalnya: sisa uang bulanan" />{goalError && <p className="form-error" role="alert">{goalError}</p>}<button className="save-button" type="submit" disabled={goalSaving}>{goalSaving ? 'Menyimpan…' : <><CheckCircle2 size={18} /> Simpan kontribusi</>}</button></form></section></div>}
      {categoryModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryModalOpen(false) }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title"><div className="modal-heading"><div><p className="eyebrow">{categoryEditingId ? 'UBAH KATEGORI' : 'KATEGORI BARU'}</p><h2 id="category-modal-title">{categoryEditingId ? 'Edit kategori' : 'Tambah kategori'}</h2></div><button className="icon-button" type="button" onClick={() => setCategoryModalOpen(false)} aria-label="Tutup"><X size={20} /></button></div><form onSubmit={submitCategory}><label className="field-label" htmlFor="category-name">Nama kategori</label><input id="category-name" className="form-input" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={30} placeholder="Misalnya: Kesehatan" required />{!categoryEditingId && <><label className="field-label" htmlFor="category-type">Jenis kategori</label><select id="category-type" className="form-input" value={categoryType} onChange={(event) => setCategoryType(event.target.value as CategoryRecord['type'])}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></>}{categoryError && <p className="form-error" role="alert">{categoryError}</p>}<button className="save-button" type="submit" disabled={categorySaving}>{categorySaving ? 'Menyimpan…' : <><CheckCircle2 size={18} /> Simpan kategori</>}</button></form></section></div>}
      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}>
        <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-heading"><div><p className="eyebrow">{editingId ? 'UBAH TRANSAKSI' : 'TRANSAKSI BARU'}</p><h2 id="modal-title">{editingId ? 'Edit transaksi' : 'Catat uangmu'}</h2></div><button className="icon-button" type="button" onClick={() => setModalOpen(false)} aria-label="Tutup"><X size={20} /></button></div>
          <form onSubmit={submitTransaction}>
            <div className="type-switch" role="group" aria-label="Jenis transaksi">
              <button type="button" className={type === 'income' ? 'selected income-choice' : ''} onClick={() => setType('income')}><ArrowDownLeft size={17} /> Pemasukan</button>
              <button type="button" className={type === 'expense' ? 'selected expense-choice' : ''} onClick={() => setType('expense')}><ArrowUpRight size={17} /> Pengeluaran</button>
            </div>
            <label className="field-label" htmlFor="amount">Nominal (Rp)</label>
            <input id="amount" className="form-input amount-input" type="number" inputMode="numeric" min="1" step="1" placeholder="Contoh: 25000" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            <label className="field-label" htmlFor="transaction-wallet">Sumber dompet</label>
            <select id="transaction-wallet" className="form-input" value={transactionWalletId} onChange={(event) => setTransactionWalletId(event.target.value)} required>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select>
            <label className="field-label" htmlFor="category">Kategori</label>
            <select id="category" className="form-input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            <label className="field-label" htmlFor="date">Tanggal</label>
            <div className="input-with-icon"><CalendarDays size={17} /><input id="date" className="form-input" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} required /></div>
            <label className="field-label" htmlFor="note">Catatan <span>(opsional)</span></label>
            <input id="note" className="form-input" type="text" maxLength={120} placeholder="Misalnya: makan siang" value={note} onChange={(event) => setNote(event.target.value)} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="save-button" type="submit" disabled={saving || !ready}>{saving ? 'Menyimpan…' : <><CheckCircle2 size={18} /> {editingId ? 'Simpan perubahan' : 'Simpan transaksi'}</>}</button>
          </form>
        </section>
      </div>}
      {walletModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setWalletModalOpen(false) }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title"><div className="modal-heading"><div><p className="eyebrow">DOMPET BARU</p><h2 id="wallet-modal-title">Tambah dompet</h2></div><button className="icon-button" type="button" onClick={() => setWalletModalOpen(false)} aria-label="Tutup"><X size={20} /></button></div><form onSubmit={submitWallet}><label className="field-label" htmlFor="wallet-name">Nama dompet</label><input id="wallet-name" className="form-input" value={walletName} onChange={(event) => setWalletName(event.target.value)} maxLength={40} placeholder="Misalnya: BCA atau Dana" required /><label className="field-label" htmlFor="wallet-type">Jenis dompet</label><select id="wallet-type" className="form-input" value={walletType} onChange={(event) => setWalletType(event.target.value as WalletRecord['type'])}><option value="cash">Tunai</option><option value="bank">Rekening bank</option><option value="ewallet">E-wallet</option><option value="other">Lainnya</option></select><label className="field-label" htmlFor="opening-balance">Saldo awal (Rp)</label><input id="opening-balance" className="form-input" type="number" min="0" step="1" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} required />{error && <p className="form-error">{error}</p>}<button className="save-button" type="submit"><CheckCircle2 size={18} /> Simpan dompet</button></form></section></div>}
      {transferModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTransferModalOpen(false) }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title"><div className="modal-heading"><div><p className="eyebrow">PINDAH SALDO</p><h2 id="transfer-modal-title">Transfer antar-dompet</h2></div><button className="icon-button" type="button" onClick={() => setTransferModalOpen(false)} aria-label="Tutup"><X size={20} /></button></div><form onSubmit={submitTransfer}><label className="field-label" htmlFor="transfer-from">Dari dompet</label><select id="transfer-from" className="form-input" value={transferFrom} onChange={(event) => setTransferFrom(event.target.value)} required>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select><label className="field-label" htmlFor="transfer-to">Ke dompet</label><select id="transfer-to" className="form-input" value={transferTo} onChange={(event) => setTransferTo(event.target.value)} required>{wallets.filter((wallet) => wallet.id !== transferFrom).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select><label className="field-label" htmlFor="transfer-amount">Nominal (Rp)</label><input id="transfer-amount" className="form-input amount-input" type="number" min="1" step="1" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} required /><label className="field-label" htmlFor="transfer-date">Tanggal</label><input id="transfer-date" className="form-input" type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} required /><label className="field-label" htmlFor="transfer-note">Catatan (opsional)</label><input id="transfer-note" className="form-input" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} maxLength={120} placeholder="Misalnya: isi saldo e-wallet" />{error && <p className="form-error">{error}</p>}<button className="save-button" type="submit"><ArrowLeftRight size={18} /> Simpan transfer</button></form></section></div>}
    </main>
  )
}
