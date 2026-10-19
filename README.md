# TakarLaba

> **Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner**  
> Dibuat untuk kompetisi **GTNIC 2026 (Web Development)**.

TakarLaba adalah aplikasi web modern berbasis multi-tenant yang membantu pengusaha UMKM kuliner menghitung HPP (Harga Pokok Penjualan) secara akurat, mengalokasikan stok berbasis FEFO (*First Expired, First Out*), memitigasi lonjakan harga bahan baku (*Price Shock Impact*), dan menganalisis profitabilitas menu (*Menu Engineering*).

---

## 🛠️ Tech Stack

### Frontend (`frontend/`)
- **Framework:** React 19.2 + Vite
- **Routing:** React Router v7 (Data Router)
- **State Management:** TanStack Query v5 (Server state) & React useReducer (Keranjang POS)
- **Styling & UI:** Tailwind CSS v4, shadcn/ui, Sonner
- **Form & Validasi:** React Hook Form + Zod 4
- **Visualisasi:** Recharts

### Backend (`backend/`)
- **Runtime & Framework:** Node.js 22 LTS + Express 5 (ESM strict)
- **Database ORM:** Prisma 7 + `@prisma/adapter-pg` + `pg` (node-postgres)
- **Database Host:** PostgreSQL 17/18 on Neon (Serverless Postgres with pooling)
- **Autentikasi & Otorisasi:** Better Auth (Session-based, first-party cookie via proxy)
- **Perhitungan Uang & Kuantitas:** `decimal.js` (Bebas float rounding error)
- **Keamanan & Logging:** Helmet, Pino HTTP, Express Rate Limit

---

## 📂 Struktur Direktori

```text
takarlaba/
├── frontend/             # Single Page Application (React + Vite)
├── backend/              # Authoritative REST API (Express 5 + Prisma)
├── database/             # Skema Prisma, migrasi, dan konfigurasi Docker DB
├── docs/                 # Dokumentasi API, ERD, dan ADR
├── AGENTS.md             # Aturan coding & konvensi AI Coding Agent
├── ARCHITECTURE.md       # Spesifikasi teknis arsitektur lengkap
├── PRD.md                # Product Requirement Document & Business Rules
├── SKILL.md              # Pustaka prompt berulang
├── TODO.md               # Pelacak progres tugas & log implementasi
└── WORKFLOW.md           # SOP dan aturan kolaborasi
```

---

## 🚀 Memulai (Quickstart)

### Prasyarat
- Node.js 22 LTS (minimal 20.19)
- npm

### 1. Salin Variabel Lingkungan
Salin file `.env.example` ke file `.env` di masing-masing folder:
```bash
# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Instalasi Dependensi
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Jalankan Aplikasi (Development)
Dari direktori root:
```bash
# Menjalankan backend
npm run dev:backend

# Menjalankan frontend
npm run dev:frontend
```

---

## 📜 Lisensi
Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
