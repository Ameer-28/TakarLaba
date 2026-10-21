# TakarLaba

> **Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner**  
> Dibuat untuk kompetisi **GTNIC 2026 (Web Development)**.

TakarLaba adalah aplikasi web modern berbasis multi-tenant yang membantu pengusaha UMKM kuliner menghitung HPP (Harga Pokok Penjualan) secara akurat, mengalokasikan stok berbasis FEFO (*First Expired, First Out*), memitigasi lonjakan harga bahan baku (*Price Shock Impact*), dan menganalisis profitabilitas menu (*Menu Engineering*).

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
  - **Server State:** TanStack Query v5
  - **Styling & UI:** Tailwind CSS v4 (`@tailwindcss/vite`) · shadcn/ui tokens · `tw-animate-css` · Lucide React · Sonner
  - **Testing & Tooling:** Vitest · Prettier · ESLint 9 · TypeScript strict
- **Backend (`backend/`):**
  - **Framework & Runtime:** Node.js 22 LTS · Express 5 (ESM NodeNext)
  - **Validasi:** Zod 4 (`z.stringbool()`, `z.url()`)
  - **Database ORM:** Prisma 7 (`@prisma/adapter-pg` + `pg`)
  - **Logging & Keamanan:** Pino 9 · pino-http · Helmet 8
  - **Testing & Tooling:** Vitest · Supertest · Prettier · ESLint 9 · TypeScript strict

### Dependensi Direncanakan (Roadmap Fitur)
- **Autentikasi & Multi-tenant:** Better Auth (sesi first-party via proxy)
- **Keamanan Lanjutan:** express-rate-limit
- **Perhitungan Desimal Finansial:** decimal.js
- **Formulir Frontend:** React Hook Form + resolver Zod 4
- **Visualisasi & Diagram:** Recharts

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
| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server dev dengan tsx watch (otomatis `db:generate` via predev) |
| `npm run build` | Mengompilasi TypeScript ke `dist/` |
| `npm start` | Menjalankan build produksi dari `dist/server.js` |
| `npm run db:generate` | Menghasilkan client Prisma (`prisma generate`) |
| `npm run test` | Menjalankan pengujian unit & integrasi dengan Vitest |
| `npm run lint` | Memeriksa linting dengan ESLint |
| `npm run typecheck` | Memeriksa tipe TypeScript (`tsc --noEmit`) |
| `npm run format` | Memformat kode dengan Prettier |
| `npm run format:check` | Memeriksa kepatuhan format Prettier |

### Frontend (`cd frontend`)
| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite dev server dengan proxy API |
| `npm run build` | Menjalankan typecheck dan kompilasi bundle Vite |
| `npm run test` | Menjalankan pengujian dengan Vitest |
| `npm run lint` | Memeriksa linting dengan ESLint |
| `npm run typecheck` | Memeriksa tipe TypeScript (`tsc -b --noEmit`) |
| `npm run format` | Memformat kode dengan Prettier |
| `npm run format:check` | Memeriksa kepatuhan format Prettier |

---

## 📂 Struktur Direktori

```text
takarlaba/
├── frontend/             # Single Page Application (React 19 + Vite 6)
│   ├── src/
│   │   ├── api/          # apiClient dan query hooks
│   │   ├── pages/        # Halaman dan rute (NotFound, RouteError)
│   │   └── ...
│   └── package.json
├── backend/              # Authoritative REST API (Express 5 + Prisma 7)
│   ├── src/
│   │   ├── config/       # load-env.ts dan env.ts (validasi Zod 4)
│   │   ├── lib/          # db, logger, envelope, errors
│   │   ├── middleware/   # error-handler, auth
│   │   ├── routes/       # health.routes.ts, dsb.
│   │   └── server.ts     # Inisialisasi HTTP server & graceful shutdown
│   ├── tests/            # Pengujian unit & integrasi Vitest + Supertest
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

## 🤝 Aturan Kolaborasi & Kontribusi

Setiap kontributor dan AI Coding Agent wajib mematuhi panduan pada:
- [AGENTS.md](AGENTS.md) — Aturan arsitektur, larangan keras, dan konvensi kode.
- [WORKFLOW.md](WORKFLOW.md) — Alur kerja git, format Conventional Commits, dan Definition of Done.
- [TODO.md](TODO.md) — Pelacak prioritas tugas (P0/P1/P2) dan status implementasi.

---

## 📜 Lisensi
Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
