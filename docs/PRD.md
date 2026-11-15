# Product Requirements Document — Rupia

## 1. Ringkasan
Rupia adalah aplikasi keuangan pribadi untuk masyarakat umum. Produk mengutamakan antarmuka ramah, pencatatan yang mudah, dan penyimpanan lokal/offline.

**Tagline:** Kenali uangmu. Kendalikan harimu.

## 2. Masalah pengguna
Pengguna sering tidak mengetahui total saldo, pola pengeluaran, dan sisa anggaran karena transaksi kecil tidak tercatat atau catatan tersebar.

## 3. Tujuan produk
- Membantu pengguna mencatat pemasukan dan pengeluaran.
- Menampilkan saldo dompet secara mudah dipahami.
- Membantu pengguna mengelola anggaran per kategori dengan periode harian, mingguan, dan bulanan, serta tujuan tabungan.
- Menjaga data tetap tersedia tanpa koneksi internet.

## 4. Target pengguna
Masyarakat umum yang ingin mengelola uang pribadi, termasuk pelajar, mahasiswa, pekerja, dan keluarga.

## 5. MVP
1. Dashboard saldo, pemasukan, dan pengeluaran.
2. Dompet: tunai, rekening, dan e-wallet.
3. Transaksi pemasukan, pengeluaran, dan transfer.
4. Kategori transaksi.
5. Anggaran kategori dengan periode harian, mingguan, dan bulanan.
6. Tujuan tabungan.
7. Riwayat, pencarian, dan filter.
8. Ringkasan dan insight dasar.
9. Backup/restore JSON dan ekspor transaksi CSV.
10. Operasi inti offline.

## 6. Di luar MVP
Integrasi bank, pembayaran, sinkronisasi cloud, login, OCR struk, asisten AI, prediksi, investasi, dan pinjaman.

## 7. Prinsip perhitungan
- Nilai uang disimpan sebagai integer Rupiah.
- Saldo dompet = saldo awal + pemasukan - pengeluaran - transfer keluar + transfer masuk.
- Transfer tidak masuk ke total pemasukan/pengeluaran.
- Kontribusi tabungan tidak boleh dihitung dua kali sebagai pengeluaran bila hanya pencatatan target.
- Penghapusan/edit transaksi harus memperbarui ringkasan.

## 8. Platform dan privasi
Target: Web responsif/PWA dan Android. Tidak ada akun atau server pada MVP. Data keuangan disimpan di perangkat. Backup manual disediakan. PIN/biometrik dan enkripsi data memerlukan desain dan implementasi keamanan terpisah sebelum diklaim tersedia.

## 9. Kriteria penerimaan MVP
- Semua transaksi dapat dibuat, diedit, dan dihapus.
- Saldo dan ringkasan konsisten dengan transaksi.
- Transfer antar-dompet tercatat satu kali dan atomik.
- Data bertahan setelah aplikasi ditutup/dibuka dan saat offline.
- Backup dapat dipulihkan dengan validasi versi.
- Layout nyaman pada layar ponsel dan desktop.
- Perhitungan inti memiliki unit test.
