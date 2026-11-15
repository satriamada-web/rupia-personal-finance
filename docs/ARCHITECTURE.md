# Arsitektur Rupia

## Prinsip
Offline-first, domain logic terpisah dari UI, nilai uang integer, dan penyimpanan melalui repository abstraction.

## Stack awal
- React + TypeScript + Vite.
- Dexie/IndexedDB untuk web.
- PWA service worker digunakan pada web; tidak didaftarkan di dalam native Capacitor WebView.
- Capacitor 8 membungkus hasil build Vite (`dist`) untuk Android.
- Vitest untuk unit test.
- Capacitor 8 + Android untuk APK debug.
- IndexedDB tetap menjadi penyimpanan lokal pada tahap wrapper awal; adapter SQLite native belum diimplementasikan.

## Batas platform
IndexedDB web dan SQLite native adalah penyimpanan berbeda. Keduanya tidak otomatis berbagi data. Pada wrapper Android saat ini, IndexedDB berjalan di WebView dan tidak otomatis menjadi SQLite. Migrasi ke SQLite native harus memakai adapter terpisah serta jalur backup/restore yang kompatibel. Jangan mengklaim penyimpanan SQLite sebelum adapter dan migrasinya diuji.

## Lapisan
1. UI: halaman dan komponen React.
2. Features: alur dashboard, transaksi, dompet, anggaran, tabungan.
3. Core: perhitungan, validasi, dan aturan transaksi murni TypeScript.
4. Database: schema, migrasi, dan adapter lokal.
5. Backup: format JSON berversi dan ekspor CSV.

## Keamanan
Tidak ada autentikasi palsu atau cloud sync pada MVP. UI lock bukan enkripsi. Enkripsi database hanya boleh diklaim setelah konfigurasi dan pengujian eksplisit.
