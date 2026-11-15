import { ArrowDownLeft, ArrowUpRight, BarChart3, Plus, Wallet } from 'lucide-react'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Rupia beranda">
          <span className="brand-mark">R</span>
          <span>rupia</span>
        </a>
        <span className="offline-pill"><span className="status-dot" /> Tersimpan di perangkat</span>
      </header>

      <section className="welcome">
        <p className="eyebrow">KEUANGAN PRIBADIMU</p>
        <h1>Uangmu, lebih <span>terarah.</span></h1>
        <p className="welcome-copy">Mulai dengan mencatat. Pelan-pelan, kamu akan lebih mengenal ke mana uangmu pergi.</p>
      </section>

      <section className="balance-card" aria-labelledby="balance-title">
        <div className="balance-top">
          <span id="balance-title">Total saldo</span>
          <Wallet size={19} aria-hidden="true" />
        </div>
        <p className="balance-amount">{rupiah.format(0)}</p>
        <p className="balance-note">Saldo akan dihitung dari dompet dan transaksimu.</p>
        <div className="balance-decoration" aria-hidden="true" />
      </section>

      <section className="summary-grid" aria-label="Ringkasan keuangan">
        <article className="summary-card">
          <div className="summary-icon income"><ArrowDownLeft size={18} /></div>
          <span>Pemasukan</span>
          <strong>{rupiah.format(0)}</strong>
        </article>
        <article className="summary-card">
          <div className="summary-icon expense"><ArrowUpRight size={18} /></div>
          <span>Pengeluaran</span>
          <strong>{rupiah.format(0)}</strong>
        </article>
      </section>

      <section className="first-step">
        <div className="first-step-icon"><BarChart3 size={22} /></div>
        <div>
          <h2>Langkah kecil pertama</h2>
          <p>Tambahkan transaksi pertamamu. Fitur pencatatan sedang kami bangun.</p>
        </div>
        <button className="add-button" type="button" disabled aria-label="Tambah transaksi segera hadir">
          <Plus size={20} />
        </button>
      </section>

      <footer>Rupia <span>•</span> Versi awal 0.1.0</footer>
    </main>
  )
}
