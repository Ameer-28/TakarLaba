# WORKFLOW.md — SOP & Aturan Main Kolaborasi AI

> Berlaku untuk semua AI agent dan kontributor. Berpasangan dengan `AGENTS.md`.

## 1. Prinsip Umum
1. **Kualitas di atas kecepatan.** Lebih baik satu fitur benar dan teruji daripada tiga fitur setengah jadi. Alur demo harus berjalan dari awal sampai selesai tanpa error.
2. **Transparansi.** Jelaskan rencana sebelum perubahan besar; laporkan apa yang diubah, mengapa, dan apa yang belum selesai. Jangan menyembunyikan kegagalan test atau asumsi.
3. **Keamanan dulu.** Tidak ada secret di repo, tenant isolation tidak boleh bocor, validasi di server.
4. **Komunikasi jelas.** Pakai Bahasa Indonesia untuk penjelasan; istilah teknis tetap Inggris. Jika permintaan ambigu atau bertentangan dengan dokumen, **tanya satu pertanyaan spesifik** sebelum lanjut.
5. **Perubahan kecil & terarah.** Satu tugas = satu tujuan = commit-commit kecil. Jangan refactor di luar lingkup.
6. **Dokumen adalah kontrak.** PRD (BR-xx, fixture) dan ARCHITECTURE adalah sumber kebenaran. Jika kode perlu menyimpang, minta izin dan perbarui dokumen.

## 2. Kapan Wajib Minta Izin (Ask Permission First)
- Menghapus file/folder penting, atau menimpa file yang bukan milik tugas.
- **Mengubah skema database**: model Prisma, migrasi baru/diubah, constraint, index; atau menjalankan `migrate reset`, `db push`, `DROP`, `TRUNCATE`, seed pada DB selain lokal/demo.
- Menambah, menghapus, atau mengubah versi **dependency** (termasuk dev dependency) dan mengubah config build/tooling (`vite.config.ts`, `vercel.json`, `tsconfig`, ESLint, CI, Dockerfile/konfigurasi hosting).
- Mengubah **aturan bisnis** (BR-xx), rumus, fixture, atau kontrak API (envelope `{ ok, data | error }`).
- Mengubah auth/otorisasi, matriks peran, konfigurasi Better Auth, security headers.
- **Deploy ke production**, mengubah env var produksi, mengubah URL backend di `vercel.json`, `prisma migrate deploy`, atau menyentuh data produksi.
- Mengubah struktur direktori utama atau pola layering.
- Menghapus/melemahkan test, atau menonaktifkan aturan lint/typecheck.
- Operasi git berisiko: `push --force`, rewrite history, merge ke `main`.
- Hal apa pun yang tidak jelas cakupannya atau menyentuh lebih dari ±10 file di luar rencana.

## 3. Kapan Boleh Jalan Sendiri (Autonomous Actions)
- Membuat file/komponen/fungsi baru **sesuai arsitektur** dan lingkup tugas yang sedang `[/]`.
- Menulis dan menjalankan **unit/integration test**; menambah test untuk bug.
- Memperbaiki bug terisolasi di dalam lingkup tugas (dengan test regresi).
- Merapikan kode lokal pada file yang sedang dikerjakan (penamaan, ekstraksi fungsi kecil) tanpa mengubah perilaku.
- Menjalankan `lint`, `typecheck`, `test`, `build`, dan memperbaiki error yang muncul dari perubahan sendiri.
- Memperbarui dokumentasi (README, docs, JSDoc) agar sesuai kode.
- Memperbarui `docs/api.md` dan tipe/hook frontend agar sinkron dengan perubahan endpoint dalam lingkup tugas.
- Membuat commit kecil di branch fitur dengan pesan Conventional Commits.
- Membaca dokumentasi resmi library untuk memverifikasi API.
- Memperbarui `TODO.md` (status, log sesi).

## 4. Definition of Done (DoD)
Sebuah tugas/fitur `[x]` hanya jika **semua** terpenuhi:
- [ ] Memenuhi Acceptance Criteria tugas dan FR/BR terkait di `PRD.md` (angka fixture persis bila relevan).
- [ ] `npm run lint`, `npm run typecheck`, dan `npm run build` **tanpa error/warning baru**.
- [ ] Test relevan ditulis dan hijau (domain: unit; alur DB/konkurensi: integration); tidak ada test yang dilemahkan.
- [ ] Validasi input (Zod) + otorisasi server + scope `businessId` ada dan teruji untuk setiap mutasi baru.
- [ ] Respons untuk CASHIER tidak memuat field biaya.
- [ ] Uang/kuantitas memakai Decimal; tidak ada `any`/`@ts-ignore`.
- [ ] UI: loading, error, empty state, toast; terlihat benar di 360 px dan desktop; teks Indonesia.
- [ ] Tidak ada secret/`.env` ter-commit; tidak ada `console.log` sisa.
- [ ] Dokumentasi diperbarui jika perilaku/kontrak berubah (README/docs/JSDoc).
- [ ] Jika kontrak API berubah: backend, docs/api.md, dan tipe/hook frontend sudah sinkron (commit berurutan).
- [ ] Commit kecil & bermakna sudah dibuat; branch siap review.
- [ ] `TODO.md` sudah diperbarui (status + log sesi).

## 5. Protokol Pelaporan
**Setiap kali selesai (atau terblokir pada) satu tugas, AI wajib:**
1. Memperbarui `TODO.md`: ubah status (`[/]`→`[x]` atau `[~]` + alasan), centang AC, tambahkan baris di *Log sesi*, catat keputusan baru di *Memori Proyek*.
2. Melaporkan ringkasan singkat dengan format:

```text
Tugas: T-xxx — [judul]  → Status: Done | Blocked | Partial
Perubahan: [3–6 bullet; file/area utama]
Verifikasi: lint ✅ · typecheck ✅ · test ✅ (N lulus) · build ✅ · uji manual: [apa]
Keputusan/asumsi: [jika ada]
Risiko / yang belum selesai: [jika ada]
Butuh izin/keputusan user: [jika ada]
Tugas berikutnya yang diusulkan: T-xxx
```
3. Jika terblokir: tulis penyebab, apa yang sudah dicoba, dan opsi solusi; jangan diam-diam mengganti pendekatan.

## 6. Git & Alur Kerja
- Branch: `main` (production, terlindungi) ← `feat/…`, `fix/…`, `docs/…`, `chore/…`. Nama mengacu tugas: `feat/t-041-checkout-fefo`.
- **Commit kecil & bermakna** (Conventional Commits, Inggris): `feat(pos): allocate stock batches using FEFO`, `test(costing): cover yield loss`, `fix(alerts): resolve alert when margin recovers`. Juri menilai git history: hindari satu commit raksasa di akhir. Perubahan lintas FE & BE dipecah menjadi commit terpisah per sisi (mis. `feat(api): …` lalu `feat(ui): …`).
- Merge dengan **merge commit atau rebase-and-merge** (jangan squash seluruh fitur menjadi satu commit).
- Jangan commit: `.env*` (kecuali `.env.example`), `node_modules`, `backend/src/generated`, `dist/`, build output.
- Sebelum PR/merge: DoD lengkap, CI hijau, tidak ada konflik.

## 7. Awal & Akhir Sesi
**Awal:** baca `AGENTS.md` → `WORKFLOW.md` → `TODO.md` → bagian PRD/ARCHITECTURE terkait; tentukan sisi yang dikerjakan (FE/BE/DB) dan jalankan perintah di folder yang benar; pastikan hanya satu tugas `[/]`; nyatakan tugas yang akan dikerjakan.
**Akhir:** pastikan working tree bersih/terkomit, `TODO.md` mutakhir, laporan ringkas diberikan, dan usulkan langkah berikutnya.

## 8. Kalender Kritis (jangan terlewat)
19 Okt mulai · Fase 0–1 selesai 22 Okt · MVP P0 fungsional 3 Nov · **fitur dibekukan 7 Nov** (setelah itu hanya bug & polish) · **submit target 9 Nov** · batas 10 Nov 23:59 WIB · pengumuman finalis 12 Nov · Grand Final 14 Nov (warm-up situs & uji koneksi sebelum sesi).