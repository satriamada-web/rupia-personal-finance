import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart3, Plus, Wallet, X, CalendarDays, CheckCircle2, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { calculateWalletBalances } from './core/balance'
import { formatRupiah } from './core/money'
import { addTransaction, addTransfer, createWallet, deleteTransaction, getFinanceSnapshot, initializeFinanceData, updateTransaction } from './core/finance'
import type { CategoryRecord, TransactionRecord, WalletRecord } from './database/db'

type TransactionType = 'income' | 'expense'
const today = () => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }

export default function App() {
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [ready, setReady] = useState(false)
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
    setWallets(snapshot.wallets); setCategories(snapshot.categories); setTransactions(snapshot.transactions)
  }

  useEffect(() => {
    let active = true
    initializeFinanceData().then(getFinanceSnapshot).then((snapshot) => {
      if (!active) return
      setWallets(snapshot.wallets); setCategories(snapshot.categories); setTransactions(snapshot.transactions); setReady(true)
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
      <section className="wallet-section">
        <div className="section-heading"><div><p className="eyebrow">TEMPAT PENYIMPANAN</p><h2>Dompetmu</h2></div><button className="secondary-button" type="button" onClick={() => { setError(''); setWalletModalOpen(true) }}><Plus size={15} /> Dompet</button></div>
        <div className="wallet-list">{wallets.map((wallet) => { const balance = balances.find((item) => item.walletId === wallet.id)?.balance ?? wallet.openingBalance; return <article className="wallet-item" key={wallet.id}><div className="wallet-item-icon"><Wallet size={17} /></div><div><strong>{wallet.name}</strong><span>{wallet.type === 'cash' ? 'Tunai' : wallet.type === 'bank' ? 'Rekening bank' : wallet.type === 'ewallet' ? 'E-wallet' : 'Lainnya'}</span></div><b>{formatRupiah(balance)}</b></article> })}</div>
        <button className="transfer-button" type="button" onClick={() => { setError(''); setTransferFrom(wallets[0]?.id ?? ''); setTransferTo(wallets[1]?.id ?? ''); setTransferModalOpen(true) }} disabled={wallets.length < 2}><ArrowLeftRight size={16} /> Transfer antar-dompet</button>
      </section>
      <section className="summary-grid" aria-label="Ringkasan keuangan">
        <article className="summary-card"><div className="summary-icon income"><ArrowDownLeft size={18} /></div><span>Pemasukan tercatat</span><strong>{formatRupiah(totalIncome)}</strong></article>
        <article className="summary-card"><div className="summary-icon expense"><ArrowUpRight size={18} /></div><span>Pengeluaran tercatat</span><strong>{formatRupiah(totalExpense)}</strong></article>
      </section>
      <section className="transaction-section">
        <div className="section-heading">
          <div><p className="eyebrow">AKTIVITAS</p><h2>Transaksi terbaru</h2></div>
          <button className="primary-button" type="button" onClick={openNewTransaction} disabled={!ready}><Plus size={17} /> Catat</button>
        </div>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="first-step-icon"><BarChart3 size={22} /></div><h3>Belum ada transaksi</h3>
            <p>Catat pemasukan atau pengeluaran pertamamu untuk mulai melihat arus uang.</p>
            <button className="text-button" type="button" onClick={openNewTransaction} disabled={!ready}>+ Tambah transaksi pertama</button>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.slice(0, 12).map((transaction) => {
              const category = categories.find((item) => item.id === transaction.categoryId)
              const income = transaction.type === 'income'
              return <article className="transaction-row" key={transaction.id}>
                <div className={`transaction-icon ${income ? 'income' : 'expense'}`}>{income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div>
                <div className="transaction-info"><strong>{category?.name ?? 'Transaksi'}</strong><span>{transaction.note || (income ? 'Pemasukan' : 'Pengeluaran')} · {transaction.transactionDate}</span></div>
                <div className="transaction-trailing"><strong className={income ? 'amount-income' : 'amount-expense'}>{income ? '+' : '−'}{formatRupiah(transaction.amount)}</strong><div className="transaction-actions"><button type="button" className="row-action" aria-label="Edit transaksi" onClick={() => openEditTransaction(transaction)}><Pencil size={14} /></button><button type="button" className="row-action delete-action" aria-label="Hapus transaksi" onClick={() => handleDelete(transaction)}><Trash2 size={14} /></button></div></div>
              </article>
            })}
          </div>
        )}
      </section>
      <footer>Rupia <span>•</span> Versi awal 0.2.0 <span>•</span> Data tersimpan lokal</footer>
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
    </main>
  )
}
