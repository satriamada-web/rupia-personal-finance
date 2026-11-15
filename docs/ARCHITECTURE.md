# Arsitektur Rupia

## Prinsip
Offline-first, domain logic terpisah dari UI, nilai uang integer, dan penyimpanan melalui repository abstraction.

## Stack awal
- React + TypeScript + Vite.
- Dexie/IndexedDB untuk web.
- PWA service worker akan ditambahkan setelah shell aplikasi stabil.
- Vitest untuk unit test.
- Capacitor + SQLite direncanakan untuk Android pada milestone platform.

## Batas platform
IndexedDB web dan SQLite native adalah penyimpanan berbeda. Keduanya tidak otomatis berbagi data. Implementasi Android harus menggunakan adapter repository yang sama secara konseptual serta jalur backup/restore yang kompatibel.

## Lapisan
1. UI: halaman dan komponen React.
2. Features: alur dashboard, transaksi, dompet, anggaran, tabungan.
3. Core: perhitungan, validasi, dan aturan transaksi murni TypeScript.
4. Database: schema, migrasi, dan adapter lokal.
5. Backup: format JSON berversi dan ekspor CSV.

## Keamanan
Tidak ada autentikasi palsu atau cloud sync pada MVP. UI lock bukan enkripsi. Enkripsi database hanya boleh diklaim setelah konfigurasi dan pengujian eksplisit.
