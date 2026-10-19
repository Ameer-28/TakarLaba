# TODO.md — Pelacak Progres & Memori Proyek

> AI **wajib** memperbarui file ini setiap selesai/mulai/terblokir pada satu tugas (lihat `WORKFLOW.md` §5).
> Terakhir diperbarui: 2026-10-19 · Stack: React+Vite / Express 5 / Prisma 7 · Fase aktif: 0 (Setup)

## Status Legend
`[ ]` Todo · `[/]` In Progress · `[x]` Done · `[~]` Blocked (tulis alasan) · `[-]` Cancelled (tulis alasan)

Format: `- [ ] **T-xxx** (Prioritas) [FE|BE|DB|OPS|DOC] Judul — dep: … — AC: …`
Aturan: hanya satu tugas `[/]` per agent pada satu waktu.

---

## 🔥 High Priority — Foundation & Core MVP (P0)

### Fase 0 — Setup & deploy awal (19–20 Okt)

- [x] **T-001** (P0) [DOC] Finalisasi dokumen perencanaan (PRD, AGENTS, ARCHITECTURE, TODO, SKILL, WORKFLOW) untuk Paket 1
- [x] **T-002** (P0) [OPS] Init repo GitHub publik, struktur `frontend/ backend/ database/ docs/`, `.gitignore`, LICENSE (MIT), README kerangka, root `package.json` (script `npm --prefix`), `.env.example` per folder — AC: tidak ada `.env` ter-commit
- [x] **T-003** (P0) [FE] Scaffold Vite + React 19 + TS strict, Tailwind v4 (`@tailwindcss/vite`), alias `@/`, ESLint — dep: T-002 — AC: `lint`, `typecheck`, `build` hijau
- [x] **T-004** (P0) [FE] shadcn/ui init (+ `tw-animate-css`), Sonner, design token, React Router v7 data router, QueryClientProvider, `api/client.ts` (envelope + ApiError) — dep: T-003
- [x] **T-005** (P0) [BE] Scaffold Express 5 ESM TS (`NodeNext`), `config/env.ts` (Zod), `app.ts`/`server.ts`, pino, helmet, `errorHandler` envelope, `/api/health`, tsx dev, tsc build — dep: T-002 — AC: `GET /api/health` 200
- [x] **T-006** (P0) [DB/BE] Prisma 7: `database/schema.prisma`, `backend/prisma.config.ts`, adapter-pg, `db.ts`, Docker Postgres lokal. **Spike:** `npm run build && npm start` berjalan dengan client Prisma (fallback: tsx runtime) — dep: T-005 — AC: `prisma validate` OK; start dari `dist/` berhasil
- [x] **T-007** (P0) [OPS] GitHub Actions CI: job `backend` (lint, typecheck, test, build) & `frontend` — dep: T-003, T-005
- [x] **T-008** (P0) [OPS] Deploy: Neon (pooled + direct URL), backend di Render/VPS, frontend di Vercel dengan `vercel.json` rewrite `/api/*`; monitor uptime — dep: T-004, T-006 — AC: `/api/health` **lewat domain frontend** = ok

### Fase 1 — Auth, tenant, shell (20–22 Okt)

- [ ] **T-010** (P0) [BE] Better Auth di Express (`/api/auth/*splat` sebelum `express.json`), generate skema via CLI, `additionalFields` role/businessId `input:false`, `trustedOrigins`, rate limit — dep: T-006
- [ ] **T-011** (P0) [DB] Skema domain lengkap + migrasi + `constraints.sql` — dep: T-006 — AC: migrasi bersih dari nol
- [ ] **T-012** (P0) [BE] Middleware: `requireAuth` (ctx tenant), `requireRole`, `validate` (Zod → `req.valid`), `sameOrigin`, rate limit, `requestId` — dep: T-010
- [ ] **T-013** (P0) [FE] Halaman login + `auth-client` + `ProtectedRoute`/`RoleRoute` + logout + error state; tombol Demo Owner/Kasir (placeholder) — dep: T-010
- [ ] **T-014** (P0) [FE] App shell responsif (sidebar desktop, bottom nav mobile), navigasi sadar peran, error boundary & 404
- [ ] **T-015** (P0) [BE/FE] Core libs: backend `money.ts` (Decimal), `date.ts` (`todayWIB`), `errors.ts`; frontend `formatRupiah`/`format.ts` + unit test — AC: pembulatan HALF_UP teruji
- [ ] **T-016** (P0) [BE] Seed v0: bisnis demo + user OWNER/CASHIER (`backend/src/seed`) — dep: T-011
- [ ] **T-017** (P0) [OPS] **Uji cookie sesi lewat proxy** di Chrome, Firefox, Edge, **Safari (macOS & iOS)**: login, refresh, logout — dep: T-008, T-013 — AC: lulus semua; bila gagal → buka ADR Plan B (domain kustom/bearer) sebelum lanjut
- [ ] **T-018** (P0) [BE] Test tenant isolation & RBAC kerangka (supertest atas `createApp()`) — dep: T-012

### Fase 2 — Bahan & stok (22–25 Okt)

- [ ] **T-020** (P0) [BE+FE] CRUD bahan (`domain/units.ts`, repo, service, route, validasi) + konversi satuan + yield + soft delete; halaman bahan — AC: FR-ING-01
- [ ] **T-021** (P0) [BE+FE] Pembelian multi-baris → Purchase + StockBatch + StockMovement (atomik) + form pembelian — dep: T-020 — AC: FR-PUR-01
- [ ] **T-022** (P0) [BE+FE] Ringkasan stok + detail batch + badge Aman/Segera/Kedaluwarsa + stok rendah (DTO kasir tanpa biaya) — dep: T-021 — AC: FR-ING-02
- [ ] **T-023** (P0) [BE] Unit test konversi satuan/yield/costPerBase; integration: rollback pembelian gagal
- [ ] **T-024** (P0) [DOC] `docs/api.md` untuk endpoint bahan/pembelian/stok

### Fase 3 — Menu, resep, costing (26–28 Okt)
- [ ] **T-030** (P0) [BE+FE] Overhead + pengaturan bisnis (target margin, step, expectedMonthlyPortions) — AC: FR-OVH-01
- [ ] **T-031** (P0) [BE+FE] CRUD menu — AC: FR-MENU-01
- [ ] **T-032** (P0) [BE] `domain/costing.ts` (HPP Bahan/Penuh, Aktual/Pengganti) + test fixture A — AC: 7.740 / 8.940 persis
- [ ] **T-033** (P0) [BE+FE] `POST /api/menus/preview-cost` + editor resep dengan live preview (debounce 300 ms) — dep: T-032 — AC: FR-REC-01
- [ ] **T-034** (P0) [FE] Daftar menu + badge margin (Aman/Waspada/Bahaya) + label "harga bahan belum lengkap" — AC: FR-COST-01

### Fase 4 — POS + FEFO (29 Okt–1 Nov)
- [ ] **T-040** (P0) [BE] `domain/fefo.ts` `allocateFefo` + unit test (batch campur, kedaluwarsa, null expiry, kurang stok)
- [ ] **T-041** (P0) [BE] `POST /api/sales` (lock `FOR UPDATE`, `Idempotency-Key`, snapshot biaya) — dep: T-040, T-032
- [ ] **T-042** (P0) [FE] UI POS (grid, keranjang reducer, pembayaran, struk dialog + print CSS, loading/toast, `Idempotency-Key` per percobaan) — dep: T-041 — AC: FR-POS-01
- [ ] **T-043** (P0) [BE] Integration + HTTP test: urutan FEFO, rollback stok kurang, `Promise.all` 2 checkout, idempotensi — AC: FR-POS-02
- [ ] **T-044** (P0) [BE+FE] Riwayat penjualan (daftar + detail alokasi batch)

### Fase 5 — Price Shock + dashboard v1 (2–3 Nov)
- [ ] **T-050** (P0) [BE] `domain/pricing.ts` (Opsi A/B, pembulatan step) + test — AC: 20.000 dan 115 ml
- [ ] **T-051** (P0) [BE] Evaluasi alert saat pembelian + `reevaluateAlertsForMenu` (resep/harga/overhead/target) + auto-resolve — dep: T-050, T-021
- [ ] **T-052** (P0) [BE+FE] Modal dampak pasca-pembelian + Pusat Peringatan + aksi terapkan harga/abaikan — AC: FR-PSI-01
- [ ] **T-053** (P0) [BE+FE] Dashboard v1 (omzet, transaksi, laba estimasi, alert, kedaluwarsa, stok rendah) — AC: FR-DASH-01

### Demo & submission (paralel, mulai 26 Okt)
- [ ] **T-060** (P0) [BE] Seed penuh fixture A & B (riwayat 30 hari deterministik, opening stock, edge case kedaluwarsa)
- [ ] **T-061** (P0) [BE+FE] `POST /api/demo/reset` (guard `DEMO_MODE` + `isDemo` + cooldown 60 dtk) + tombol demo login — dep: T-060
- [ ] **T-062** (P0) [FE] Banner Mode Demo + dry-run skrip demo Lampiran A
- [ ] **T-070** (P0) [DOC] README lengkap: masalah & solusi, fitur, stack & arsitektur, instalasi (frontend+backend+database), env vars, link live, screenshot
- [ ] **T-071** (P0) [DOC] Verifikasi klaim kompetitor via trial; verifikasi sumber berita/statistik (PRD §1.2)
- [ ] **T-072** (P0) [BE+FE] Security review (SKILL.md §2): tenant isolation, RBAC, DTO kasir, same-origin, helmet, rate limit
- [ ] **T-073** (P0) [FE] Uji responsif (360/768/1024/1440) + lintas browser (Chrome, Firefox, Edge, Safari)
- [ ] **T-074** (P0) [DOC] Proposal PDF (A4, Times New Roman 12, spasi 1,5, margin kiri 4 cm lainnya 3 cm, ≤ 15 hlm, logo GTNIC di sampul) — `GTNIC2026_WebDev_NamaTim.pdf`
- [ ] **T-075** (P0) [DOC] Video demo 3–5 menit (perkenalan tim, masalah & solusi, demo) di YouTube/Drive publik
- [ ] **T-076** (P0) [DOC] Surat Pernyataan Keaslian Karya + submit Google Form (**target 9 Nov**, batas 10 Nov 23:59 WIB) — dep: semua P0
- [ ] **T-077** (P0) [OPS] Audit git history sebelum submit: `git log --oneline --stat`; tidak ada commit raksasa, pesan bermakna, tidak ada secret/.env di riwayat (`git log -p -S"DATABASE_URL"`); kontribusi tiap anggota terlihat — dep: semua P0

---

## 🟡 Medium Priority — Fitur Sekunder & Polish UI/UX (P1)
- [ ] **T-100** (P1) [BE+FE] `domain/capacity.ts` + endpoint + UI kapasitas/bottleneck di POS, menu, dashboard — AC: FR-CAP-01
- [ ] **T-101** (P1) [BE+FE] `domain/menu-engineering.ts` + endpoint + scatter Recharts + tabel padanan + rekomendasi terhitung + guard data — AC: fixture B 6/6 (sebelum & sesudah shock)
- [ ] **T-102** (P1) [BE+FE] Void transaksi (restore ke batch asal, alasan wajib) — AC: FR-POS-03
- [ ] **T-103** (P1) [BE+FE] Catat bahan terbuang (WASTE) + nilai kerugian — AC: FR-INV-03
- [ ] **T-104** (P1) [BE+FE] Riwayat pembelian + void pembelian (hanya jika batch belum terpakai)
- [ ] **T-105** (P1) [BE+FE] Registrasi + onboarding wizard
- [ ] **T-106** (P1) [FE] Input uang diterima & kembalian; struk print
- [ ] **T-107** (P1) [BE+FE] Grafik dashboard (penjualan 7 hari, top menu)
- [ ] **T-108** (P1) [DOC] `docs/erd.md` + gambar, `docs/api.md` lengkap, screenshot
- [ ] **T-109** (P1) [FE] Polish UX: skeleton, empty state, error boundary, pesan Indonesia konsisten, a11y pass
- [ ] **T-110** (P1) [FE+BE] Lighthouse (perf ≥ 80, a11y ≥ 90), bundle size awal ≤ 250 KB gzip (route-level splitting), optimasi query dashboard
- [ ] **T-111** (P1) [DOC] Uji awam (3 orang): bahan → resep → penjualan; catat temuan
- [ ] **T-112** (P1) [FE] Test Testing Library: reducer keranjang, format Rupiah, form pembelian

---

## 🟢 Low Priority — Technical Debt, Optimasi & Nice-to-Have (P2)
- [ ] **T-200** (P2) [BE+FE] Waste Radar: nilai risiko, menu terkait, harga lantai promo, batas diskon aman — AC: FR-WST-01
- [ ] **T-201** (P2) [BE+FE] Ekspor CSV penjualan & stok
- [ ] **T-202** (P2) [OPS] E2E Playwright untuk skrip demo
- [ ] **T-203** (P2) [FE] Header keamanan/CSP di `vercel.json`
- [ ] **T-204** (P2) [BE+FE] Stock adjustment (opname)
- [ ] **T-205** (P2) [BE] Refactor duplikasi + laporan coverage; target `domain/` ≥ 85%
- [ ] **T-206** (P2) [FE] Pintasan keyboard POS
- [ ] **T-207** (P2) [OPS] Ekstrak skema Zod bersama ke paket workspace (mengurangi drift FE↔BE)

---

## Memori Proyek

### Keputusan (jangan dibalik tanpa persetujuan user)
- D-01: **Paket 1** — React (Vite) + Express 5 + PostgreSQL (Neon) + Prisma 7 + Better Auth; deploy Vercel + Render/VPS.
- D-02: Satu origin lewat Vercel rewrite `/api/*` (cookie first-party, tanpa CORS); wajib lulus uji Safari (T-017).
- D-03: Backend otoritatif; frontend tanpa duplikasi rumus; live HPP via `POST /menus/preview-cost`.
- D-04: Dua HPP — Aktual (batch terpakai) dan Pengganti (harga beli terbaru).
- D-05: Menu Engineering memakai margin kontribusi (Rp), ambang popularitas 70% × (1/n).
- D-06: Satu alert OPEN per menu (partial unique index); auto-resolve saat margin pulih.
- D-07: Stok disimpan dalam raw base unit; resep dalam qty usable; yield dipakai saat potong stok & costing.
- D-08: Demo reset hanya untuk bisnis `isDemo`, cooldown 60 dtk; seed berada di `backend/src/seed`.

### Pertanyaan terbuka
- OQ-01: Nama tim & anggota (untuk proposal).
- OQ-02 (terjawab): stack = Paket 1.
- OQ-03: Sumber asli artikel Qasir (17 Apr 2026), Mekari (30 Jan 2026), statistik "25% gagal 2 tahun" — belum ditemukan.
- OQ-04: Hosting backend: instance berbayar (Render Starter ±US$7/bln atau VPS) atau free tier + warm-up? Keputusan sebelum T-008.
- OQ-05: Pembagian tugas FE/BE antar anggota tim.

### Log sesi (tambah baris baru di atas)
| Tanggal | Agent/Orang | Ringkasan | Tugas terkait |
|---|---|---|---|
| 2026-10-19 | Agent | Selesai Fase 0: Setup repo (T-002), Frontend Vite+React 19 (T-003), Router+Query+Client (T-004), Backend Express 5 (T-005), Prisma 7+Neon (T-006), CI (T-007), Vercel Deploy (T-008) | T-002 s.d. T-008 |
| 2026-10-19 | Planner | Dokumen disesuaikan ke Paket 1 (React + Express) | T-001 |
