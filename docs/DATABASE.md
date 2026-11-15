# Desain Database Rupia

Semua ID berupa string UUID. Nilai uang adalah integer Rupiah (>= 0 untuk amount transaksi). Timestamp disimpan sebagai ISO-8601; tanggal transaksi sebagai YYYY-MM-DD.

## wallets
- id, name, type (cash/bank/ewallet/other)
- openingBalance (integer)
- createdAt, updatedAt

## categories
- id, name, type (income/expense), icon, color, isDefault, createdAt

## transactions
- id, type (income/expense/transfer), amount
- walletId (dompet sumber)
- destinationWalletId (wajib untuk transfer, berbeda dari walletId)
- categoryId (opsional untuk income/expense; tidak digunakan untuk transfer)
- transactionDate, note, createdAt, updatedAt, deletedAt

## Aturan transfer
Satu record transfer merepresentasikan perpindahan dana dari walletId ke destinationWalletId. Dalam satu operasi database, kedua saldo harus berubah konsisten. Transfer tidak dianggap pemasukan/pengeluaran. Validasi mencegah dompet sumber dan tujuan sama.

## Tabel berikutnya
MVP lanjutan menambah budgets, savings_goals, savings_contributions, obligations, dan app_settings melalui migrasi schema. Model kontribusi tabungan akan ditetapkan sebelum implementasi agar tidak terjadi penghitungan ganda.

## Indeks
Dexie schema awal mengindeks id, type, walletId, destinationWalletId, categoryId, transactionDate, createdAt, dan deletedAt.
