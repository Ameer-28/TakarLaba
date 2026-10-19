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
Commit: [hash singkat + pesan, satu per baris]
Verifikasi: lint ✅ · typecheck ✅ · test ✅ (N lulus) · build ✅ · uji manual: [apa]
Keputusan/asumsi: [jika ada]
Risiko / yang belum selesai: [jika ada]
Butuh izin/keputusan user: [jika ada]
Tugas berikutnya yang diusulkan: T-xxx
```
3. Jika terblokir: tulis penyebab, apa yang sudah dicoba, dan opsi solusi; jangan diam-diam mengganti pendekatan.

## 6. Git & Alur Kerja

**Tujuan:** riwayat git adalah bukti kualitas teknis (slide TM: "Git history wajar"). Commit harus bertahap, kecil, dan bermakna sejak hari pertama — bukan satu unggahan besar di akhir.

### 6.1 Kapan commit
- Commit **setiap kali satu unit logis selesai** dan lint/typecheck/test untuk unit itu hijau. Jangan menunggu akhir sesi atau akhir hari.
- **1 commit = 1 alasan perubahan** yang bisa dijelaskan dalam satu kalimat. Patokan: diff ≤ ±300 baris dan ≤ ±10 file (kecuali scaffold, migrasi, hasil generate, fixture seed).
- Satu tugas TODO biasanya menghasilkan **3–6 commit**, mis.: `domain + test` → `service` → `route + validasi` → `docs/api.md` → `hook FE` → `UI`.
- **Setiap commit harus membuat build tetap hijau** (agar riwayat bisa di-bisect). Test ikut di commit yang sama dengan kodenya.
- Pisahkan commit untuk: refactor, perubahan format, perubahan dependency (`build(deps)`, butuh izin), migrasi DB (`feat(db)`), dan dokumentasi yang berdiri sendiri.
- Perubahan kontrak API: backend, `docs/api.md`, lalu tipe/hook frontend — commit berurutan, per sisi.
- Perbarui `TODO.md` di **commit terakhir tugas itu** (bukan commit terpisah per tugas).

### 6.2 Format pesan (Conventional Commits, bahasa Inggris)
`type(scope): ringkasan` — imperatif, ≤ 72 karakter, huruf kecil, tanpa titik di akhir.
- **type:** `feat` `fix` `refactor` `perf` `test` `docs` `style` `build` `ci` `chore` `revert`
- **scope:** nama fitur atau area kode (`auth`, `ingredients`, `purchases`, `menus`, `costing`, `pos`, `fefo`, `alerts`, `pricing`, `dashboard`, `analytics`, `seed`, `ui`, `api`, `db`, `deps`, `ci`, `docs`)

**Pesan menjelaskan perubahan di kode, bukan proses perencanaan.** Subject harus menyebut hal konkret yang berubah (fungsi, endpoint, komponen, tabel, aturan bisnis). Body hanya jika *alasan* tidak terlihat dari diff, maksimal 1–3 kalimat.

**Dilarang di subject, body, footer, dan nama branch:**
- label tahapan: `phase`, `fase`, `tahap`, `stage`, `step`, `sprint`, `milestone`, `iteration`
- ID tugas internal: `T-041`, nomor di TODO.md, "task 12", dan sejenisnya
- kata penutup proses atau kosong: `final`, `done`, `complete`, `wip`, `misc`, `update`, `revisi`
- kata promosi/klise: `comprehensive`, `robust`, `seamless`, `enhance`, `leverage`, `various improvements`
- emoji, bullet/daftar bernomor panjang di body, kalimat basa-basi

**Pecah scaffold awal menjadi beberapa commit kecil, bukan satu commit "setup project".**

| BURUK | BAIK |
|---|---|
| `Phase 0: setup project` | `chore: initialize frontend and backend folders` → `build(frontend): add vite, tailwind and shadcn config` → `feat(backend): add express app with health endpoint` → `ci: add lint and typecheck workflow` |
| `feat: implement phase 4 POS + FEFO` | `feat(fefo): allocate stock across batches by earliest expiry` → `feat(pos): add checkout endpoint with idempotency key` → `feat(ui): add cart and payment dialog to pos page` |
| `T-041 checkout FEFO` | `test(pos): cover insufficient stock rollback` |
| `Complete phase 5 price shock` | `feat(pricing): recommend new price when margin drops below target` |
| `update`, `fix`, `final`, `wip` | `fix(alerts): resolve open alert when margin recovers` |

### 6.3 Branch & merge
- `main` (production, terlindungi) ← `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- Nama branch mendeskripsikan perubahan, **tanpa ID tugas atau tahap**: `feat/pos-checkout`, `fix/alert-auto-resolve`, `chore/ci-pipeline`.
- Merge dengan **merge commit atau rebase-and-merge**. **Dilarang squash** satu fitur menjadi satu commit.
- Dilarang melewati pemeriksaan dengan `--no-verify`.

### 6.4 Larangan
- Dilarang menumpuk perubahan tak terkait dalam satu commit atau menunda commit berhari-hari.
- Dilarang `git add .` / `git add -A` tanpa meninjau `git status` dan `git diff --staged` (pastikan tidak ada `.env*`, secret, `backend/src/generated`, `dist/`, `node_modules`).
- Dilarang menulis ulang riwayat untuk memalsukan kronologi: tanpa backdate (`--date`), tanpa `push --force` ke `main`, tanpa `amend`/rebase pada commit yang sudah di-push, tanpa menggabungkan seluruh riwayat jadi satu commit.
- Dilarang pesan commit generik (lihat contoh BURUK).

### 6.5 Checklist sebelum commit
1. `git status` → hanya file yang relevan dengan satu alasan perubahan.
2. `git diff --staged` → tidak ada secret/debug/`console.log`.
3. lint + typecheck + test hijau di folder yang disentuh.
4. Pesan sesuai §6.2.

### 6.6 Ritme target (kebijakan tim, bukan aturan lomba)
- Setidaknya 1 commit bermakna per hari kerja aktif selama 19 Okt–9 Nov; tidak ada commit raksasa kecuali scaffold, migrasi, atau fixture seed.
- Sebelum submit: audit `git log --oneline --stat` (lihat TODO T-077).
- Opsional (butuh izin dependency): `commitlint` + `husky` untuk memvalidasi format pesan otomatis.

## 7. Awal & Akhir Sesi
**Awal:** baca `AGENTS.md` → `WORKFLOW.md` → `TODO.md` → bagian PRD/ARCHITECTURE terkait; tentukan sisi yang dikerjakan (FE/BE/DB) dan jalankan perintah di folder yang benar; pastikan hanya satu tugas `[/]`; nyatakan tugas yang akan dikerjakan.
**Akhir:** pastikan working tree bersih/terkomit, `TODO.md` mutakhir, laporan ringkas diberikan, dan usulkan langkah berikutnya.

## 8. Kalender Kritis (jangan terlewat)
19 Okt mulai · Fase 0–1 selesai 22 Okt · MVP P0 fungsional 3 Nov · **fitur dibekukan 7 Nov** (setelah itu hanya bug & polish) · **submit target 9 Nov** · batas 10 Nov 23:59 WIB · pengumuman finalis 12 Nov · Grand Final 14 Nov (warm-up situs & uji koneksi sebelum sesi).