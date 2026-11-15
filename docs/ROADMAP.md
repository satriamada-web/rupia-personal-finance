# Roadmap

## Fondasi dan fitur inti

- [x] M0.1 — Repository dan fondasi React/Vite/TypeScript
- [x] M0.2 — Identitas visual awal dan schema IndexedDB dasar
- [x] M0.3 — Instalasi dependency, typecheck, test, dan production build terverifikasi melalui GitHub Actions
- [x] M1 — Finance engine dan unit tests
- [x] M2 — Dompet dan transaksi CRUD
- [x] M3 — Anggaran harian/mingguan/bulanan, tabungan, Safe-to-Spend, kalender, dan insight
- [x] M4 — Backup/restore JSON, ekspor laporan, dan PWA offline

## Android

- [x] M5.1 — Capacitor Android wrapper dan build APK debug melalui GitHub Actions
- [ ] M5.2 — Migrasi penyimpanan native ke SQLite dan verifikasi kompatibilitas data

**Catatan:** APK debug saat ini sudah dapat dibangun, tetapi penyimpanan aplikasi masih menggunakan IndexedDB. Jangan menganggap migrasi SQLite sudah selesai.

## Pengujian dan rilis

- [ ] M6.1 — Uji instalasi dan alur utama pada perangkat Android fisik
- [ ] M6.2 — Uji backup lalu restore, termasuk data transaksi, dompet, kategori, anggaran, dan tabungan
- [ ] M6.3 — Perbaikan bug hasil uji beta dan pemeriksaan aksesibilitas
- [ ] M6.4 — Build release bertanda tangan dan persiapan distribusi

Milestone hanya ditandai selesai setelah kode dan pengujiannya benar-benar diverifikasi.