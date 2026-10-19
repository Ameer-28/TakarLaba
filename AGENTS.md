# AGENTS.md — TakarLaba

> Aturan wajib untuk setiap sesi AI Coding Agent. Terakhir diperbarui: 2026-10-19 (stack: React + Vite · Express 5 · PostgreSQL · Prisma 7).

## 0. Baca Dulu (urutan wajib setiap sesi)
1. `AGENTS.md` (ini) → 2. `WORKFLOW.md` → 3. `TODO.md` (cari `[/]`, lalu `[ ]` berikutnya) → 4. `PRD.md` (aturan bisnis BR-xx & fixture) → 5. `ARCHITECTURE.md` (struktur, model data, kontrak API).
Jika dokumen bertentangan dengan permintaan user, **tanyakan dulu**; jangan menebak.

## 1. Project Identity
- **Nama:** TakarLaba — asisten penjaga margin & anti-waste untuk UMKM kuliner.
- **Tipe:** Dua aplikasi dalam satu repo: `frontend/` (React SPA) dan `backend/` (Express REST API), ditambah `database/` (skema & migrasi) dan `docs/`. Multi-tenant-ready. Untuk kompetisi GTNIC 2026 (Web Development).
- **Stack inti:**
  - Frontend: React 19.2 · Vite · TypeScript strict · React Router v7 · TanStack Query v5 · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod 4 · Recharts · Sonner.
  - Backend: Node.js 22 · Express 5 · TypeScript (ESM) · Zod 4 · Prisma 7 · Better Auth · decimal.js · pino · helmet · express-rate-limit · Vitest + supertest.
  - Data: PostgreSQL 17 (Neon di produksi). Deploy: Vercel (frontend) + Render/VPS (backend).
- **Alur data:** Browser → Vercel (`/api/*` di-*rewrite*) → Express → Prisma → PostgreSQL. **Browser hanya berbicara ke origin frontend** (satu origin, tanpa CORS, cookie sesi first-party).
- **Pembagian tanggung jawab:** Frontend = UI, form, dashboard (validasi UX saja). Backend = business logic, validasi otoritatif, otorisasi, transaksi. Frontend **tidak** menduplikasi rumus bisnis.
- **Inti produk:** costing (HPP Bahan/Penuh, Aktual/Pengganti), stok batch FEFO, POS atomik, Price Shock Impact, Menu Engineering.
- **Karakter UI:** bersih, ramah pemula, **mobile-first** (POS nyaman di 360 px). Bahasa Indonesia sehari-hari tanpa jargon akuntansi. Angka `tabular-nums`. Status = warna **+ ikon + teks** (hijau Aman, kuning Segera/Waspada, merah Kedaluwarsa/Bahaya). Pakai design token semantik (success/warning/danger).

## 2. Tech Stack Notice (versi & sintaks — jangan pakai pola lama)
`package.json` (di `frontend/` dan `backend/`) adalah sumber kebenaran versi. **Jangan upgrade/downgrade** tanpa izin. Jika ragu terhadap API, **baca dokumentasi resmi** sebelum menulis kode; jangan menebak dari ingatan.

**Runtime:** Node.js 22 LTS (minimum 20.19, syarat Prisma 7). Package manager: **npm**, dengan lockfile terpisah di `frontend/` dan `backend/` (tanpa workspaces; jangan campur pnpm/yarn).

### Frontend
- **React 19.2:** `ref` sebagai prop (tanpa `forwardRef`); tanpa `defaultProps` pada function component; `useActionState` bukan `useFormState`.
- **Vite** + `@vitejs/plugin-react`. Alias `@/` → `src/`. Dev server mem-*proxy* `/api` ke backend lokal (`http://localhost:4000`).
- **React Router v7:** impor dari `react-router`; pakai *data router* (`createBrowserRouter` + `RouterProvider`) dan route `lazy`. **Bukan** framework mode.
- **TanStack Query v5:** hanya signature objek `useQuery({ queryKey, queryFn })`; `isPending` (bukan `isLoading` untuk status awal); `gcTime` (bukan `cacheTime`); setelah mutasi panggil `invalidateQueries({ queryKey })`. Query key lewat *key factory* per fitur di `src/api/keys.ts`.
- **Tailwind CSS v4:** plugin `@tailwindcss/vite` (**bukan** PostCSS); CSS-first (`@import "tailwindcss"` dan `@theme` di `src/index.css`); jangan buat `tailwind.config.js`. Browser minimum: Safari 16.4+, Chrome 111+, Firefox 128+ (⚠ cek ulang di docs).
- **shadcn/ui:** tambah komponen lewat CLI (`npx shadcn@latest add …`) ke `src/components/ui`; animasi memakai `tw-animate-css`.
- **Form:** React Hook Form + `@hookform/resolvers` (versi kompatibel Zod 4). Skema Zod di frontend **hanya untuk UX**; backend tetap otoritatif.
- **Zod 4:** `import { z } from "zod"`; pakai `z.email()` (bukan `z.string().email()`); pesan error lewat parameter `error`.
- **Better Auth client:** `createAuthClient` dari `better-auth/react` (⚠ verifikasi opsi `baseURL` di docs); pakai `useSession`.
- **Env Vite:** hanya variabel berawalan `VITE_` yang masuk bundle dan **terlihat publik**. Dilarang menaruh secret di sana. Base URL API selalu **relatif** (`/api`).

### Backend
- **ESM only:** `"type": "module"`, tsconfig `module`/`moduleResolution` = `NodeNext`, impor relatif **memakai ekstensi `.js`** (`import { x } from "./x.js"`). Better Auth tidak mendukung CommonJS.
- **Express 5 (bukan 4):** rejected promise di handler async otomatis diteruskan ke error handler (tanpa `express-async-errors`); wildcard harus bernama (`/api/auth/*splat`); `req.query` read-only (simpan hasil parse di `req.valid`); `req.body` bisa `undefined` bila belum di-parse (⚠ cek migration guide).
- **Better Auth + Express:** pasang `app.all("/api/auth/*splat", toNodeHandler(auth))` **sebelum** `express.json()`; sesi via `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`; `additionalFields` `role` & `businessId` dengan **`input: false`**; `trustedOrigins: [FRONTEND_URL]`; `baseURL` = URL publik **frontend** (karena request datang lewat proxy). Skema tabel auth dibuat oleh CLI Better Auth, bukan ditulis manual.
- **Prisma 7:** generator **`prisma-client`** dengan `output` wajib (`backend/src/generated/prisma`) dan `moduleFormat = "esm"`; bila `tsx` memunculkan `Cannot find module './internal/class.js'`, set `importFileExtension = "ts"` (catatan docs). Impor dari `../generated/prisma/client.js`. Konfigurasi koneksi di `backend/prisma.config.ts` (menunjuk `../database/*`); env dimuat eksplisit (`import "dotenv/config"`). **Driver adapter wajib:** `@prisma/adapter-pg` + `pg`. Runtime memakai `DATABASE_URL` (pooled); CLI/migrasi memakai `DIRECT_URL`.
- **Build:** dev `tsx watch src/server.ts`; produksi `tsc` → `dist/` lalu `node dist/server.js`. Kelayakan build+start dengan client Prisma terbukti di spike T-006; fallback bila gagal: jalankan via `tsx`.
- **Validasi:** Zod 4 di batas sistem (middleware `validate`). **Logging:** pino (tanpa PII/secret). **Keamanan:** helmet, express-rate-limit, pemeriksaan Origin pada request non-GET.
- **Matematika uang/kuantitas:** `decimal.js` (Prisma Decimal dikonversi di repository).

## 3. Coding Conventions & Best Practices

### 3.1 Umum
- **Penamaan:** file & folder `kebab-case`; komponen React `PascalCase` (file tetap kebab-case); variabel/fungsi `camelCase`; konstanta `UPPER_SNAKE_CASE`; tipe/enum `PascalCase`; model Prisma `PascalCase` tunggal. Boolean diawali `is/has/can`.
- **Istilah domain konsisten:** `hppBahan`, `hppPenuh`, `hppAktual`, `hppPengganti`, `marginKontribusi`, `costPerBase`, `qtyBase`, `batch`, `fefo`. Kode & identifier berbahasa Inggris; **teks UI berbahasa Indonesia**.
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. Dilarang `any`, `@ts-ignore`, `@ts-expect-error` tanpa alasan tertulis + izin.
- **Uang & kuantitas = Decimal**; dilarang float. Lintas jaringan **selalu string** di JSON. Frontend boleh memakai `decimal.js` hanya untuk *preview* (mis. total keranjang); angka final berasal dari backend.
- **Komentar:** Inggris singkat, jelaskan *why*. Rumus bisnis diberi referensi `BR-xx`. Fungsi publik di `domain/` & `services/` diberi JSDoc (input, output, edge case).
- **Commit:** Conventional Commits, kecil dan bermakna (detail di `WORKFLOW.md`).

### 3.2 Frontend
- Alur: `pages/` → `components/features/` → `api/hooks` (TanStack Query) → `api/client.ts` → `/api`. Komponen **dilarang** memanggil `fetch` langsung; semua lewat hooks di `src/api/hooks`.
- `api/client.ts` membungkus `fetch` (`credentials: "same-origin"`), mem-parse envelope `{ ok, data | error }`, melempar `ApiError` terstruktur, dan membuat header `Idempotency-Key` untuk checkout.
- Server state **hanya** di TanStack Query. Client state lokal: `useState`/`useReducer` (keranjang POS = reducer). Jangan tambah state library global tanpa izin.
- Guard rute (`ProtectedRoute`, `RoleRoute`) hanya untuk UX; **backend yang menentukan akses**.
- Setiap data async punya state **loading + empty + error**; setiap mutasi menampilkan toast sukses/gagal dan error per field.
- Aksesibilitas: label, `aria-*`, fokus, kontras; komponen ≤ ±200 baris, satu tanggung jawab; route-level code splitting.

### 3.3 Backend
- **Arsitektur berlapis (impor satu arah):** `routes` → `services` → `repositories` → Prisma. `domain/` = **fungsi murni** (tanpa I/O, tanpa Prisma, tanpa Express) yang boleh dipakai semua lapisan.
- **Route tipis:** `validate(schema)` → `requireAuth`/`requireRole` → panggil service → kirim envelope. Logika bisnis **dilarang** di route.
- **Tenant scoping:** `requireAuth` mengisi `req.ctx = { userId, businessId, role }` dari sesi. Repository menerima `businessId` dari ctx, **bukan dari body/query/params**.
- **DTO per peran:** respons untuk `CASHIER` dibentuk lewat mapper di `src/dto/` yang menghapus field biaya (harga beli, HPP, margin).
- **Urutan middleware di `app.ts`:** helmet → `trust proxy` → request id & pino-http → **Better Auth handler** → `express.json({ limit: "100kb" })` → same-origin check → rate limit → routes → notFound → errorHandler.
- **Error:** `AppError` turunan (`ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `InsufficientStockError`) diterjemahkan oleh `errorHandler` ke envelope + status HTTP. Jangan `throw` string; jangan telan error.
- **Database:** multi-langkah memakai `prisma.$transaction`; pemotongan stok memakai `SELECT … FOR UPDATE` lewat `$queryRaw` **tagged template**. Tanggal "hari ini"/kedaluwarsa memakai helper `todayWIB()`.
- Nama file: `ingredient.routes.ts`, `ingredient.service.ts`, `ingredient.repo.ts`, `ingredient.schema.ts`.

### 3.4 Kontrak API (ringkas; rinci di `ARCHITECTURE.md` §6)
- Sukses: `{ "ok": true, "data": … }`. Gagal: `{ "ok": false, "error": { "code", "message", "fieldErrors"? } }`.
- Status: 200/201 · 400 `VALIDATION_ERROR` · 401 `UNAUTHENTICATED` · 403 `FORBIDDEN` · 404 `NOT_FOUND` · 409 `CONFLICT`/`INSUFFICIENT_STOCK` · 429 `RATE_LIMITED`/`DEMO_COOLDOWN` · 500 `INTERNAL`.
- Perubahan kontrak = ubah **backend + `docs/api.md` + tipe/hook frontend** dalam satu rangkaian commit.

## 4. Core Rules — "Never Do This"
1. **Dilarang** `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable` untuk membungkam error tanpa alasan tertulis dan izin user.
2. **Dilarang** hardcode kredensial/secret/token/API key; **dilarang** commit `.env*` (kecuali `.env.example` tanpa nilai nyata). Jika terlanjur ter-commit → hentikan dan laporkan; secret harus dirotasi.
3. **Dilarang** menaruh secret di variabel `VITE_*` (terekspos ke browser).
4. **Dilarang** float untuk uang & kuantitas.
5. **Dilarang** query tanpa scope `businessId`, atau mempercayai `businessId`/`role` dari input klien.
6. **Dilarang** menganggap guard frontend sebagai otorisasi; setiap route backend wajib `requireAuth` (+ `requireRole` bila perlu).
7. **Dilarang** mengembalikan field biaya (harga beli, HPP, margin, alert) ke peran `CASHIER`.
8. **Dilarang** CORS `*` atau konfigurasi kredensial longgar; **dilarang** menyimpan token sesi di `localStorage`/`sessionStorage`.
9. **Dilarang** memasang `express.json()` sebelum handler Better Auth.
10. **Dilarang** memanggil URL API absolut dari frontend; selalu relatif `/api`.
11. **Dilarang** menambah/menghapus/mengubah versi dependency tanpa izin eksplisit.
12. **Dilarang** mengubah skema DB/migrasi yang ada, atau perintah destruktif (`migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`) tanpa izin.
13. **Dilarang** merusak fitur yang berjalan: ubah hanya yang diminta; jalankan test sebelum & sesudah; jangan refactor "sekalian".
14. **Dilarang** SQL mentah dengan string concatenation; `$queryRaw` hanya tagged template.
15. **Dilarang** menaruh logika bisnis di komponen UI atau route; taruh di `domain/` (murni) dan `services/`.
16. **Dilarang** menghapus/melemahkan test agar lulus; **dilarang** menandai tugas selesai bila lint/typecheck/test/build gagal di folder yang disentuh.
17. **Dilarang** `console.log` data sensitif atau menampilkan stack trace/error internal ke pengguna.
18. **Dilarang** menyalin kode dari repositori lain secara utuh (syarat orisinalitas). Library pihak ketiga harus open-source, berlisensi jelas, dan tercatat di proposal.
19. **Dilarang** mengarang API library dari ingatan; verifikasi di dokumentasi resmi.
20. **Dilarang** menyentuh seed/reset di luar bisnis `isDemo=true`.
21. **Dilarang** commit yang menumpuk perubahan tak terkait, `git add .` tanpa meninjau `git status`/`git diff --staged`, atau menulis ulang riwayat (backdate, force-push ke `main`, squash seluruh fitur). **Dilarang** memasukkan label tahapan (phase/fase/tahap/sprint/step), ID tugas (T-xxx), kata klise, atau emoji ke pesan commit dan nama branch; subject harus menyebut hal konkret yang berubah (lihat WORKFLOW.md §6.2). Dilarang `--no-verify`.

## 5. Perintah Standar
**Frontend (`cd frontend`):** `npm run dev` · `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`.
**Backend (`cd backend`):** `npm run dev` · `npm run lint` · `npm run typecheck` · `npm run test` (unit) · `npm run test:integration` · `npm run build` · `npm start` · `npx prisma migrate dev` (lokal, dengan izin) · `npm run db:seed` (hanya lokal/demo).
Sebelum menyatakan tugas selesai: `lint` + `typecheck` + `test` + `build` hijau di **setiap folder yang disentuh**.
