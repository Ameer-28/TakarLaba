# TODO.md — Pelacak Progres & Memori Proyek

> AI **wajib** memperbarui file ini setiap selesai/mulai/terblokir pada satu tugas (lihat `WORKFLOW.md` §5).
> Terakhir diperbarui: 2026-11-02 · Stack: React 19 + Vite / Express 5 / Prisma 7 · Status: Demo Seed & Reset Selesai 100% (T-060, T-061, T-062)

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
- [x] **T-004** (P0) [FE] shadcn/ui init (+ `tw-animate-css`), Sonner, design token, React Router v8 data router, QueryClientProvider, `api/client.ts` (envelope + ApiError) — dep: T-003
- [x] **T-005** (P0) [BE] Scaffold Express 5 ESM TS (`NodeNext`), `config/env.ts` (Zod), `app.ts`/`server.ts`, pino, helmet, `errorHandler` envelope, `/api/health`, tsx dev, tsc build — dep: T-002 — AC: `GET /api/health` 200
- [x] **T-006** (P0) [DB/BE] Prisma 7: `database/schema.prisma`, `backend/prisma.config.ts`, adapter-pg, `db.ts`, Docker Postgres lokal. **Spike:** `npm run build && npm start` berjalan dengan client Prisma (fallback: tsx runtime) — dep: T-005 — AC: `prisma validate` OK; start dari `dist/` berhasil
- [x] **T-007** (P0) [OPS] GitHub Actions CI: job `backend` (format check, lint, typecheck, test, build) & `frontend` (format check, lint, typecheck, test, build) — dep: T-003, T-005
- [x] **T-008** (P0) [OPS] Deploy: Neon (pooled + direct URL), backend di Vercel Functions (sin1), frontend di Vercel dengan `vercel.json` rewrite `/api/*` — terverifikasi 3 curl (200 OK & db: ok) — dep: T-004, T-006
- [x] **T-009** (P0) [OPS] Verifikasi deploy live (frontend, direct backend, proxy rewrite) berhasil dengan status 200 OK

### Fase 1 — Auth, tenant, shell (20–22 Okt)

- [x] **T-010** (P0) [BE] Better Auth di Express (`/api/auth/*splat` sebelum `express.json`), generate skema via CLI, `additionalFields` role/businessId `input:false`, `trustedOrigins`, rate limit — dep: T-006
- [x] **T-011** (P0) [DB] Skema domain lengkap + migrasi + `constraints.sql` — dep: T-006 — AC: migrasi bersih dari nol
- [x] **T-012** (P0) [BE] Middleware: `requireAuth` (ctx tenant), `requireRole`, `validate` (Zod → `req.valid`), `sameOrigin`, rate limit, `requestId` — dep: T-010
- [x] **T-013** (P0) [FE] Halaman login + `auth-client` + `ProtectedRoute`/`RoleRoute` + logout + error state; tombol Demo Owner/Kasir (placeholder) — dep: T-010
- [x] **T-014** (P0) [FE] App shell responsif (sidebar desktop, bottom nav mobile), navigasi sadar peran, error boundary & 404
- [x] **T-015** (P0) [BE/FE] Core libs: backend `money.ts` (Decimal), `date.ts` (`todayWIB`), `errors.ts`; frontend `formatRupiah`/`format.ts` + unit test — AC: pembulatan HALF_UP teruji
- [x] **T-016** (P0) [BE] Seed v0: bisnis demo + user OWNER/CASHIER (`backend/src/seed`) — dep: T-011
- [x] **T-017** (P0) [OPS] **Uji cookie sesi lewat proxy** di Chrome, Firefox, Edge, **Safari (macOS & iOS)**: login, refresh, logout — dep: T-008, T-013 — AC: lulus semua; bila gagal → buka ADR Plan B (domain kustom/bearer) sebelum lanjut
- [x] **T-018** (P0) [BE] Test tenant isolation & RBAC kerangka (supertest atas `createApp()`) — dep: T-012

### Fase 2 — Bahan & stok (22–25 Okt)

- [x] **T-020** (P0) [BE+FE] CRUD bahan (`domain/units.ts`, repo, service, route, validasi) + konversi satuan + yield + soft delete; halaman bahan — AC: FR-ING-01
- [x] **T-021** (P0) [BE+FE] Pembelian multi-baris → Purchase + StockBatch + StockMovement (atomik) + form pembelian — dep: T-020 — AC: FR-PUR-01
- [x] **T-022** (P0) [BE+FE] Ringkasan stok + detail batch + badge Aman/Segera/Kedaluwarsa + stok rendah (DTO kasir tanpa biaya) — dep: T-021 — AC: FR-ING-02
- [x] **T-023** (P0) [BE] Unit test konversi satuan/yield/costPerBase; integration: rollback pembelian gagal
- [x] **T-024** (P0) [DOC] `docs/api.md` untuk endpoint bahan/pembelian/stok

### Fase 3 — Menu, resep, costing (26–28 Okt)

- [x] **T-030** (P0) [BE+FE] Overhead + pengaturan bisnis (target margin, step, expectedMonthlyPortions) — AC: FR-OVH-01
- [x] **T-031** (P0) [BE+FE] CRUD menu — AC: FR-MENU-01
- [x] **T-032** (P0) [BE] `domain/costing.ts` (HPP Bahan/Penuh, Aktual/Pengganti) + test fixture A — AC: 7.740 / 8.940 persis
- [x] **T-033** (P0) [BE+FE] `POST /api/menus/preview-cost` + editor resep dengan live preview (debounce 300 ms) — dep: T-032 — AC: FR-REC-01
- [x] **T-034** (P0) [FE] Daftar menu + badge margin (Aman/Waspada/Bahaya) + label "harga bahan belum lengkap" — AC: FR-COST-01

### Fase 4 — POS + FEFO (29 Okt–1 Nov)

- [x] **T-040** (P0) [BE] `domain/fefo.ts` `allocateFefo` + unit test (batch campur, kedaluwarsa, null expiry, kurang stok)
- [x] **T-041** (P0) [BE] `POST /api/sales` (lock `FOR UPDATE`, `Idempotency-Key`, snapshot biaya) — dep: T-040, T-032
- [x] **T-042** (P0) [FE] UI POS (grid, keranjang reducer, pembayaran, struk dialog + print CSS, loading/toast, `Idempotency-Key` per percobaan) — dep: T-041 — AC: FR-POS-01
- [x] **T-043** (P0) [BE] Integration + HTTP test: urutan FEFO, rollback stok kurang, `Promise.all` 2 checkout, idempotensi — AC: FR-POS-02 (diverifikasi hijau pada GitHub Actions CI Run 37 melawan PostgreSQL 17)
- [x] **T-044** (P0) [BE+FE] Riwayat penjualan (daftar + detail alokasi batch)
- [x] **T-045** (P0) [BE+FE] POS Kasir endpoint allowlist `GET /api/pos/menus` (OWNER/CASHIER) tanpa field biaya + hook `usePosMenus` di frontend POS + tests RBAC/DTO allowlist — AC: Rule 7
- [x] **T-046** (P0) [BE] Integration test database nyata PostgreSQL (`sale-atomic.test.ts` & `demo-scenario.test.ts` PRD Lampiran A) dengan factory helpers, FEFO multi-batch, concurrency `Promise.all`, idempotensi, dan RBAC kasir (diverifikasi hijau pada GitHub Actions CI Run 37 melawan PostgreSQL 17)
- [x] **T-047** (P1) [BE] Refactor backend services & domain (DRY `decimalInput` validation helper, dekomposisi checkout atomic ke `domain/checkout.ts`, unifikasi evaluasi margin & snapshot alert, optimasi N+1 kueri harga beli, pemecahan `dashboard.service.ts`, `menu.service.ts`, dan `sale.service.ts` agar <= 350 baris dan fungsi <= 60 baris)
- [x] **T-048** (P1) [FE] Refactor frontend UI & modularisasi komponen (unifikasi formatter uang/tanggal di `lib/format.ts`, shared components `StatusBadge`, `MoneyText`, `Field`, serta dekomposisi `menu-manager.tsx`, `recipe-editor-modal.tsx`, `pages/sales.tsx`, `sale-detail-modal.tsx`, dan `pos-checkout-modal.tsx` menjadi <= 200 baris dengan unit tests)

### Fase 5 — Price Shock + dashboard v1 (2–3 Nov)

- [x] **T-050** (P0) [BE] `domain/pricing.ts` (Opsi A/B, pembulatan step) + test — AC: 20.000 dan 115 ml
- [x] **T-051** (P0) [BE] Evaluasi alert saat pembelian + `reevaluateAlertsForMenu` (resep/harga/overhead/target) + auto-resolve — dep: T-050, T-021
- [x] **T-052** (P0) [BE+FE] Modal dampak pasca-pembelian + Pusat Peringatan + aksi terapkan harga/abaikan — AC: FR-PSI-01
- [x] **T-053** (P0) [BE+FE] Dashboard v1 (omzet, transaksi, laba estimasi, alert, kedaluwarsa, stok rendah) — AC: FR-DASH-01

### Demo & submission (paralel, mulai 26 Okt)

- [x] **T-060** (P0) [BE] Seed penuh fixture A & B (riwayat 30 hari deterministik, opening stock, edge case kedaluwarsa)
- [x] **T-061** (P0) [BE+FE] `POST /api/demo/reset` (guard `DEMO_MODE` + `isDemo` + cooldown 60 dtk) + tombol demo login — dep: T-060
- [x] **T-062** (P0) [FE] Banner Mode Demo + dry-run skrip demo Lampiran A
- [x] **T-070** (P0) [DOC] README lengkap: masalah & solusi, fitur, stack & arsitektur, instalasi (frontend+backend+database), env vars, link live, panduan evaluasi juri
- [x] **T-071** (P0) [DOC] Verifikasi klaim kompetitor via trial; verifikasi sumber berita/statistik (PRD §1.2) (`docs/market-and-competitor-analysis.md`)
- [x] **T-072** (P0) [BE+FE] Security review (SKILL.md §2): tenant isolation, RBAC, DTO kasir, same-origin, helmet, rate limit (`docs/security-audit-report.md`)
- [x] **T-073** (P0) [FE] Uji responsif (360/768/1024/1440) + lintas browser (Chrome, Firefox, Edge, Safari) (`docs/responsive-and-browser-audit.md`)
- [x] **T-074** (P0) [DOC] Proposal PDF (A4, Times New Roman 12, spasi 1,5, margin kiri 4 cm lainnya 3 cm, ≤ 15 hlm, logo GTNIC di sampul) — draft di `docs/proposal-gtnic-2026.md`
- [ ] **T-075** (P0) [DOC] Video demo 3–5 menit (perkenalan tim, masalah & solusi, demo) di YouTube/Drive publik
- [ ] **T-076** (P0) [DOC] Surat Pernyataan Keaslian Karya + submit Google Form (**target 9 Nov**, batas 10 Nov 23:59 WIB) — dep: semua P0
- [x] **T-077** (P0) [OPS] Audit git history sebelum submit: verifikasi commit history, larangan label proses/ID tugas, dan bebas kebocoran kredensial

---

## 🟡 Medium Priority — Fitur Sekunder & Polish UI/UX (P1)

- [x] **T-100** (P1) [BE+FE] `domain/capacity.ts` + endpoint + UI kapasitas/bottleneck di POS, menu, dashboard — AC: FR-CAP-01
- [x] **T-101** (P1) [BE+FE] `domain/menu-engineering.ts` + endpoint + scatter Recharts + tabel padanan + rekomendasi terhitung + guard data — AC: fixture B 6/6 (sebelum & sesudah shock)
- [x] **T-102** (P1) [BE+FE] Void transaksi (restore ke batch asal, alasan wajib) — AC: FR-POS-03
- [x] **T-103** (P1) [BE+FE] Catat bahan terbuang (WASTE) + nilai kerugian — AC: FR-INV-03
- [x] **T-104** (P1) [BE+FE] Riwayat pembelian + void pembelian (hanya jika batch belum terpakai)
- [x] **T-105** (P1) [BE+FE] Registrasi + onboarding wizard
- [x] **T-106** (P1) [FE] Input uang diterima & kembalian; struk print
- [x] **T-107** (P1) [BE+FE] Grafik dashboard (penjualan 7 hari, top menu)
- [x] **T-108** (P1) [DOC] `docs/erd.md` + gambar, `docs/api.md` lengkap, screenshot
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
- D-09: Validasi env fail-fast via `parseEnv` (Zod 4) tanpa membocorkan nilai ke log/klien; `DEMO_MODE` wajib boolean via `z.stringbool()`.
- D-10: Frontend menggunakan React Router 8 (Data Router) dan Prettier bersama di seluruh codebase.
- D-11: Direktori root Render dikosongkan agar prisma.config.ts dapat merujuk `../database`.
- D-12: Backend Express dikonfigurasi dual-mode: Vercel Serverless Functions via `backend/src/index.ts` (project Vercel ke-2, Hobby plan, region `sin1`) karena Render memerlukan billing/kartu kredit; runner standalone tetap tersedia di `backend/src/standalone.ts` (lihat ADR 0002).

### Pertanyaan terbuka

- OQ-01: Nama tim & anggota (untuk proposal).
- OQ-02 (terjawab): stack = Paket 1.
- OQ-03: Sumber asli artikel Qasir (17 Apr 2026), Mekari (30 Jan 2026), statistik "25% gagal 2 tahun" — belum ditemukan.
- OQ-04 (terjawab via ADR 0002): Backend di-deploy ke Vercel Serverless Functions (Hobby plan, region sin1) dengan fallback VPS/Render berbayar.
- OQ-05: Pembagian tugas FE/BE antar anggota tim.

### Log sesi (tambah baris baru di atas)

| Tanggal    | Agent/Orang | Ringkasan                                                                                                                                                                                                                                                                                                             | Tugas terkait              |
| ---------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-11-04 | Agent       | Selesai T-108: Dokumentasi ERD komprehensif (docs/erd.md), diagram visual skema relasional (docs/erd-diagram.svg), kamus data 15 entitas, siklus hidup batch FEFO & margin alert, standarisasi penomoran subbab docs/api.md, dan indeks dokumentasi teknis di README.md | T-108                      |
| 2026-11-04 | Agent       | Selesai T-107: Grafik tren penjualan 7 hari & ranking 5 menu terlaris pada ringkasan dashboard (FR-DASH-01), agregasi backend salesLast7Days (omzet, porsi, transaksi) & topMenus, dokumentasi di docs/api.md, kartu grafik bar responsif DashboardSalesTrendChart, ranking menu berprogres DashboardTopMenus, integrasi pada /dashboard, dan unit tests | T-107                      |
| 2026-11-04 | Agent       | Selesai T-106: Input uang diterima & kalkulasi kembalian/kurang bayar real-time pada checkout POS, tombol uang pas & pecahan cepat, tombol reset input, pelokalan label pembayaran di struk, nama kasir pada cetakan struk, optimasi print CSS thermal printer (@page tanpa header browser), dan unit tests | T-106                      |
| 2026-11-04 | Agent       | Selesai T-105: Registrasi pemilik bisnis baru atomik (FR-AUTH-04), endpoint POST /api/register, pembuatan workspace Business & akun Better Auth OWNER terotentikasi otomatis, form pendaftaran di /register, wizard 3 langkah terpandu di /onboarding (bahan -> menu/resep -> overhead) dengan live kalkulasi, integrasi link pendaftaran di halaman login & CTA wizard di dashboard | T-105                      |
| 2026-11-04 | Agent       | Selesai T-104: Pembatalan nota pembelian (void purchase) atomik (FR-PUR-02), endpoint POST /api/purchases/:id/void, penolakan jika stok terpakai, pembalikan stok batch (ADJUSTMENT movement) dan pemulihan replacement cost, modal PurchaseVoidModal, serta filter tanggal & badge dibatalkan pada riwayat pembelian | T-104                      |
| 2026-11-04 | Agent       | Selesai T-103: Pencatatan bahan terbuang (WASTE) & nilai kerugian finansial (Rp) atomik (FR-INV-03), endpoints POST/GET /api/stock/waste & /api/inventory/waste, validasi kuantitas batch dan alasan wajib, modal WasteRecordModal, WasteHistoryList view, integrasi tab Bahan Terbuang di halaman stok bahan | T-103                      |
| 2026-11-04 | Agent       | Selesai persiapan demo & submission (T-070 s.d. T-074, T-077): README komprehensif, analisis pasar & kompetitor (docs/market-and-competitor-analysis.md), laporan audit keamanan OWASP defensif (docs/security-audit-report.md), audit responsif & peramban (docs/responsive-and-browser-audit.md), draft proposal GTNIC 2026 (docs/proposal-gtnic-2026.md), dan audit git history tanpa kebocoran secret | T-070, T-071, T-072, T-073, T-074, T-077 |
| 2026-11-03 | Agent       | Selesai T-102: Fitur void transaksi penjualan atomik (FR-POS-03), pemulihan stok batch asal via StockMovement(VOID_RESTORE), endpoint POST /api/sales/:id/void (OWNER only), UI modal konfirmasi void & badge status Dibatalkan pada riwayat penjualan, serta unit/integration tests                                 | T-102                      |
| 2026-11-03 | Agent       | Standardisasi format string finansial DTO API (uang 2 desimal, kuantitas 3 desimal), optimasi batch insertion seed demo createMany 500 baris dengan timeout $transaction, pengamanan endpoint demo (RBAC Demo Owner pada reset, session table rate limiting & reuse pada login demo, purga sesi >24j), pemindahan UI reset ke DemoBanner terotentikasi, serta dokumentasi docs/api.md & README.md | T-060, T-061, T-062        |
| 2026-11-02 | Agent       | Selesai T-101: Matriks Menu Engineering Kasavana & Smith (4 kuadran: Star, Plowhorse, Puzzle, Dog), pure domain logic, query aggregat penjualan, endpoint GET /api/analytics/menu-engineering, scatter plot SVG interaktif, tabel padanan accessible, rekomendasi taktis terhitung otomatis, dan perbaikan CI runner integration test | T-101                      |
| 2026-11-02 | Agent       | Selesai T-100: Endpoint analitik GET /api/analytics/capacity (DTO kasir tanpa biaya Rule 7), kalkulasi bottleneck BR-08, integrasi kapasitas porsi pada menu table, mobile card, recipe preview panel, dan halaman analitik                                                                                       | T-100                      |
| 2026-11-02 | Agent       | Selesai T-060, T-061, T-062: Fixture deterministik PRD Lampiran B (16 bahan, 6 menu, overhead Rp1.200/porsi), generator 1.300 porsi 30 hari PRNG, opening stock (Susu H+2, Croissant expired), endpoint demo (status, reset cooldown 60s, login tanpa password), UI banner & tombol login cepat, dan tests | T-060, T-061, T-062        |
| 2026-11-01 | Agent       | Perbaikan FK cleanupBusinesses (urutan penghapusan SaleItem -> Business) dan demo-scenario.test.ts (OverheadCost & autentikasi via POST /api/auth/sign-in/email); dekomposisi menu.repo.ts, persistSaleTransaction, persistDipAlert, format.ts, menu-table, menu-modal; CI Run 37 diverifikasi 100% HIJAU (Backend test:integration lulus melawan PostgreSQL 17) | T-043, T-046               |
| 2026-10-31 | Agent       | Audit perbaikan bug POS kasir (GET /api/pos/menus), pembuatan test integrasi DB nyata Postgres (sale-atomic & demo scenario Lampiran A), refactor backend & frontend; unit/HTTP tests lokal hijau | T-045, T-047, T-048        |
| 2026-10-31 | Agent       | Selesai T-052: Modal dampak pasca-pembelian (Price Shock Impact Modal) + Halaman Pusat Peringatan (KPI cards, tab filter, card alert, detail modal resep & Opsi B, dialog abaikan dengan catatan, aksi terapkan harga instan) | T-052                      |
| 2026-10-30 | Agent       | Selesai T-051: Evaluasi alert margin pasca-pembelian dan re-evaluasi menu/overhead/target margin dengan auto-resolve, repository & service alert, endpoint GET/POST /api/alerts, serta 28 test files lulus 100% | T-051                      |
| 2026-10-30 | Agent       | Selesai T-050: Domain murni pricing & price shock (BR-05, BR-06) dengan evaluasi pemicu alert, pembulatan step ceil(val/step)*step, Opsi A (naikkan harga) dan Opsi B (tahan harga & efisiensi porsi dengan batas kelayakan 50%), lulus 100% pada Fixture A: Rp20.000 dan 115 ml                                | T-050                      |
| 2026-10-30 | Agent       | Selesai T-044 (Fase 4 lengkap): Halaman riwayat penjualan dengan KPI summary cards, filter tanggal/pembayaran/pencarian, modal rincian transaksi interaktif beserta detail alokasi batch bahan baku FEFO, cetak ulang struk thermal, dan proteksi kerahasiaan kasir (Rule 7)                                        | T-044                      |
| 2026-10-29 | Agent       | Selesai T-043: Integration & HTTP tests untuk atomic POS checkout dan FEFO locking (urutan konsumsi batch kedaluwarsa lebih awal, atomic rollback saat stok kurang, Promise.all 2 concurrent checkout dengan row locking, dan idempotensi transaksi)                                                                | T-043                      |
| 2026-10-29 | Agent       | Selesai T-042: UI POS Kasir (grid menu cari & filter, keranjang belanja useReducer dengan stepper kuantitas, modal pembayaran tunai/QRIS/transfer, kalkulator kembalian, struk cetak print CSS thermal, dan Idempotency-Key per percobaan)                                                                        | T-042                      |
| 2026-10-29 | Agent       | Selesai T-041: API checkout kasir POST /api/sales atomik dengan SELECT ... FOR UPDATE, pemotongan FEFO per bahan, snapshot biaya HPP Aktual & overhead, header Idempotency-Key, sanitasi DTO kasir (Rule 7), dan HTTP tests                                                                                      | T-041                      |
| 2026-10-29 | Agent       | Selesai T-040: Engine murni FEFO allocateFefo (BR-07, BR-02, BR-04) dengan proteksi kedaluwarsa WIB, batch campur, null expiry FIFO fallback, atomik all-or-nothing saat stok kurang, mutasi in-memory untuk checkout berurutan, dan 15 unit tests 100% lulus                                                    | T-040                      |
| 2026-10-29 | Agent       | Selesai T-034 (Fase 3 lengkap): Daftar katalog menu dengan live margin badge (Aman/Waspada/Bahaya), label "Harga bahan belum lengkap", perbandingan HPP Bahan vs HPP Penuh, filter margin, dan tampilan responsif mobile-first                                                                                          | T-034                      |
| 2026-10-29 | Agent       | Selesai T-033: API preview-cost, simpan resep PUT, kalkulasi HPP GET, dan Editor Resep dengan live costing preview debounced 300ms                                                                                                                                                                                  | T-033                      |
| 2026-10-29 | Agent       | Selesai T-032: Domain costing murni (HPP Bahan/Penuh, Aktual/Pengganti, margin status BR-09, unit test 100% lulus fixture A 7.740/8.940)                                                                                                                                                                           | T-032                      |
| 2026-10-28 | Agent       | Selesai T-031: CRUD menu & pelacakan riwayat harga jual (API, validasi, repo, service, HTTP tests, UI manager, hooks TanStack Query, docs/api.md)                                                                                                                                                                    | T-031                      |
| 2026-10-28 | Agent       | Selesai T-030: Pengaturan usaha & beban overhead bulanan (API, validasi, repo, service, HTTP tests, UI manager, hooks TanStack Query, docs/api.md)                                                                                                                                                                   | T-030                      |
| 2026-10-22 | Agent       | Selesai Fase 1 (100%): Frontend Login UI & Better Auth client (T-013), App Shell responsif & code splitting (T-014), Core libs money/date/format HALF_UP (T-015), Seed v0 bisnis & demo user (T-016), Uji cookie sesi via proxy live (T-017), dan Test tenant isolation & RBAC supertest (T-018) | T-013 s.d. T-018           |
| 2026-10-22 | Agent       | Setup Better Auth Express (T-010), skema domain Prisma lengkap + migrasi Neon (T-011), dan core middlewares: auth tenant context, RBAC, Zod validation, same-origin, request ID (T-012) | T-010, T-011, T-012        |
| 2026-10-21 | Agent       | Konfigurasi dual-mode backend untuk Vercel Serverless Functions: entry src/index.ts, rename standalone runner src/standalone.ts, backend/vercel.json (sin1), serverless-friendly pg.Pool (max 5, idle 10s), supertest entry test, ADR 0002, dan pembaruan arsitektur/README                                           | T-008                      |
| 2026-10-21 | Agent       | Hardening repo: Prettier & Vitest frontend/backend, validasi env fail-fast & z.stringbool(), graceful shutdown server, penanganan error body-parser (400/413), modul health route minimalis, ekstraksi not-found & route-error pages, pembersihan tooling root Neon, integrasi CI format/test, ADR 0001 & docs/api.md | T-004, T-007, T-008, T-009 |
| 2026-10-19 | Agent       | Inisialisasi awal: Setup repo (T-002), Frontend Vite+React 19 (T-003), Router+Query+Client (T-004), Backend Express 5 (T-005), Prisma 7+Neon (T-006), CI (T-007), Vercel Deploy (T-008)                                                                                                                               | T-002 s.d. T-008           |
| 2026-10-19 | Planner     | Dokumen disesuaikan ke Paket 1 (React + Express)                                                                                                                                                                                                                                                                      | T-001                      |
