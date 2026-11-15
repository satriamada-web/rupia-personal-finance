# Rupia — Personal Finance Companion

> Kenali uangmu. Kendalikan harimu.

Rupia adalah aplikasi pencatatan keuangan pribadi yang mengutamakan pengalaman sederhana, ramah, dan offline-first. Proyek ini berdiri sendiri dan tidak terkait dengan LabaKita, Semusika, atau EVO.

## Status
**M5 — Persiapan Android.** Aplikasi web/PWA sudah memiliki konfigurasi Capacitor dan workflow untuk membangun APK debug secara otomatis.

## Teknologi
- React + TypeScript + Vite
- Dexie + IndexedDB untuk penyimpanan lokal web
- PWA untuk pengalaman installable dan cache aplikasi
- Vitest untuk pengujian
- Capacitor 8 untuk membungkus aplikasi web menjadi Android APK
- Penyimpanan Android saat ini masih memakai IndexedDB pada WebView; migrasi SQLite native belum dilakukan

## Menjalankan lokal
```bash
npm install
npm run dev
```

## Pemeriksaan
```bash
npm run typecheck
npm run test
npm run build
```

## Prinsip produk
- Offline-first: data transaksi disimpan di perangkat.
- Rupiah disimpan sebagai bilangan bulat, bukan floating point.
- Transfer antar-dompet tidak dihitung sebagai pemasukan atau pengeluaran.
- Backup dan restore harus dapat dilakukan tanpa akun.
- Tidak ada sinkronisasi cloud atau integrasi bank pada MVP.

## Dokumen
- [PRD](docs/PRD.md)
- [Arsitektur](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Roadmap](docs/ROADMAP.md)

## Privasi
Data keuangan MVP disimpan lokal di perangkat pengguna. Jangan commit file backup, data pribadi, token, atau rahasia ke repository.
