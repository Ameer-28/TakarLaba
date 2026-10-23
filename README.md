# TakarLaba

> **Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner**  
> Dibuat untuk kompetisi **GTNIC 2026 (Web Development)**.

TakarLaba adalah aplikasi web modern berbasis multi-tenant yang membantu pengusaha UMKM kuliner menghitung HPP (Harga Pokok Penjualan) secara akurat, mengalokasikan stok berbasis FEFO (_First Expired, First Out_), memitigasi lonjakan harga bahan baku (_Price Shock Impact_), dan menganalisis profitabilitas menu (_Menu Engineering_).

---

## 🌐 Tautan Live

- **Frontend:** (diisi setelah diverifikasi)
- **Backend API:** (diisi setelah diverifikasi)

---

## 🛠️ Stack Teknologi

### Dependensi Terpasang

- **Frontend (`frontend/`):**
  - **Framework & Runtime:** React 19 · Vite 6
  - **Routing:** React Router 8 (Data Router)
  - **Server State & Data Fetching:** TanStack Query v5
  - **Autentikasi:** Better Auth client (`better-auth/react`) first-party session
  - **Formulir & Validasi:** React Hook Form + `@hookform/resolvers` Zod 4
  - **Styling & UI:** Tailwind CSS v4 (`@tailwindcss/vite`) · shadcn/ui tokens · `tw-animate-css` · Lucide React · Sonner
  - **Testing & Tooling:** Vitest · Prettier · ESLint 9 · TypeScript strict
- **Backend (`backend/`):**
  - **Framework & Runtime:** Node.js 22 LTS · Express 5 (ESM NodeNext)
  - **Autentikasi & Multi-tenant:** Better Auth (`@better-auth/node`) dengan tenant scoping (`businessId`, `role`)
  - **Matematika Uang & Kuantitas:** decimal.js (presisi desimal mutlak tanpa floating-point)
  - **Validasi:** Zod 4 (`z.stringbool()`, `z.url()`, skema per endpoint)
  - **Database ORM & Driver:** Prisma 7 (`@prisma/adapter-pg` + `pg`)
  - **Logging & Keamanan:** Pino 9 · pino-http · Helmet 8 · express-rate-limit
  - **Testing & Tooling:** Vitest · Supertest · Prettier · ESLint 9 · TypeScript strict

### Dependensi Direncanakan (Roadmap Fitur)

- **Visualisasi & Diagram:** Recharts (untuk Menu Engineering & grafik penjualan)

---

## 📋 Prasyarat Sistem

- **Node.js:** Versi 22 LTS (minimum 20.19)
- **Package Manager:** npm
- **Database:** PostgreSQL 17 (opsi Docker Compose lokal atau Neon PostgreSQL di cloud)

---

## 🚀 Memulai (Quickstart dari Clone Bersih)

### 1. Clone & Konfigurasi Git Hook

```bash
git clone https://github.com/Ameer-28/TakarLaba.git
cd TakarLaba
git config core.hooksPath .githooks
```

### 2. Konfigurasi Variabel Lingkungan

Salin file konfigurasi contoh untuk backend:

```bash
cp backend/.env.example backend/.env
```

Sesuaikan konfigurasi database (`DATABASE_URL` dan `DIRECT_URL`) serta secret dummy pada `backend/.env`.

### 3. Persiapan Database

Pilih salah satu metode:

- **Opsi A (Docker lokal):**
  ```bash
  docker compose -f database/docker-compose.yml up -d
  ```
- **Opsi B (Neon Serverless Postgres):** Gunakan connection string database Neon pada `backend/.env`.

### 4. Menjalankan Backend

```bash
cd backend
npm ci
npm run db:generate
npm run dev
```

Backend akan berjalan di `http://localhost:4000` (uji health check: `GET http://localhost:4000/api/health`).

### 5. Menjalankan Frontend

Di terminal terpisah:

```bash
cd frontend
npm ci
npm run dev
```

Frontend akan berjalan di `http://localhost:5173` dengan proxy `/api` otomatis mengarah ke backend lokal.

---

## 📜 Perintah yang Tersedia (NPM Scripts)

### Backend (`cd backend`)

| Perintah               | Deskripsi                                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run dev`          | Menjalankan server dev dengan tsx watch (otomatis `db:generate` via predev) |
| `npm run build`        | Mengompilasi TypeScript ke `dist/`                                          |
| `npm start`            | Menjalankan build produksi dari `dist/standalone.js`                        |
| `npm run db:generate`  | Menghasilkan client Prisma (`prisma generate`)                              |
| `npm run test`         | Menjalankan pengujian unit & integrasi dengan Vitest                        |
| `npm run lint`         | Memeriksa linting dengan ESLint                                             |
| `npm run typecheck`    | Memeriksa tipe TypeScript (`tsc --noEmit`)                                  |
| `npm run format`       | Memformat kode dengan Prettier                                              |
| `npm run format:check` | Memeriksa kepatuhan format Prettier                                         |

### Frontend (`cd frontend`)

| Perintah               | Deskripsi                                       |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Menjalankan Vite dev server dengan proxy API    |
| `npm run build`        | Menjalankan typecheck dan kompilasi bundle Vite |
| `npm run test`         | Menjalankan pengujian dengan Vitest             |
| `npm run lint`         | Memeriksa linting dengan ESLint                 |
| `npm run typecheck`    | Memeriksa tipe TypeScript (`tsc -b --noEmit`)   |
| `npm run format`       | Memformat kode dengan Prettier                  |
| `npm run format:check` | Memeriksa kepatuhan format Prettier             |

---

## 📂 Struktur Direktori

```text
takarlaba/
├── frontend/             # Single Page Application (React 19 + Vite 6)
│   ├── src/
│   │   ├── api/          # apiClient dan query hooks
│   │   ├── pages/        # Halaman dan rute (NotFound, RouteError)
│   │   └── ...
│   ├── vercel.json       # Konfigurasi rewrite proxy /api ke backend
│   └── package.json
├── backend/              # Authoritative REST API (Express 5 + Prisma 7)
│   ├── src/
│   │   ├── config/       # load-env.ts dan env.ts (validasi Zod 4)
│   │   ├── create-app.ts # createApp() Express factory murni
│   │   ├── index.ts      # Serverless entry Vercel Function (export default createApp())
│   │   ├── standalone.ts # Standalone server runner lokal & graceful shutdown
│   │   ├── lib/          # db, logger, envelope, errors, auth, money, date
│   │   ├── middleware/   # error-handler, auth, rate-limit, same-origin, validate
│   │   ├── routes/       # health, ingredient, purchase, inventory
│   │   ├── services/     # logika bisnis & orkestrasi transaksi
│   │   ├── repositories/ # isolasi Prisma client terscope tenant
│   │   └── seed/         # seeding data demo aman (isDemo: true)
│   ├── tests/            # unit/, integration/ (real DB), http/ (Supertest)
│   ├── vercel.json       # Konfigurasi region sin1 Vercel Function
│   └── package.json
├── database/             # Skema Prisma, migrasi, dan konfigurasi Docker Compose
├── docs/                 # Dokumentasi API, ADR, dan arsitektur
├── .githooks/            # Hook git (validasi subject commit Conventional Commits)
├── AGENTS.md             # Aturan coding & konvensi AI Coding Agent
├── ARCHITECTURE.md       # Spesifikasi teknis arsitektur lengkap
├── PRD.md                # Product Requirement Document & Business Rules
├── SKILL.md              # Pustaka prompt berulang
├── TODO.md               # Pelacak progres tugas & memori proyek
└── WORKFLOW.md           # SOP dan alur kolaborasi tim
```

---

## 🚢 Deployment (Vercel Dual-Project & Neon)

Aplikasi TakarLaba menggunakan arsitektur deployment dua proyek di Vercel:

1. **Frontend Project (Vercel):**
   - Root Directory: `frontend`
   - Framework: Vite (`npm run build`, output: `dist`)
   - Reverse Proxy: `frontend/vercel.json` me-_rewrite_ request `/api/*` ke project backend, menjaga cookie sesi autentikasi tetap _first-party_ (bebas isu CORS dan Safari ITP).
2. **Backend Project (Vercel Functions):**
   - Root Directory: `backend`
   - Runtime: Node.js 22 LTS (Express 5 zero-config serverless function via `src/index.ts`)
   - Region: `sin1` (Singapura) via `backend/vercel.json`
   - Database Pool: Dikonfigurasi ramah serverless (`max: 5`, idle timeout 10 detik).
3. **Database (Neon Serverless PostgreSQL):**
   - Region: `ap-southeast-1` (Singapura)
   - Runtime connection pooling via `DATABASE_URL` dan migrasi via `DIRECT_URL`.

---

## 🤝 Aturan Kolaborasi & Kontribusi

Setiap kontributor dan AI Coding Agent wajib mematuhi panduan pada:

- [AGENTS.md](AGENTS.md) — Aturan arsitektur, larangan keras, dan konvensi kode.
- [WORKFLOW.md](WORKFLOW.md) — Alur kerja git, format Conventional Commits, dan Definition of Done.
- [TODO.md](TODO.md) — Pelacak prioritas tugas (P0/P1/P2) dan status implementasi.

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
