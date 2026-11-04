# TakarLaba

> **Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner**  
> Dibuat untuk kompetisi **GTNIC 2026 (Web Development)**.

TakarLaba adalah aplikasi web modern berbasis *multi-tenant* yang dirancang khusus untuk pengusaha UMKM kuliner. TakarLaba bukan sekadar aplikasi kasir (POS), melainkan sebuah ***decision layer*** cerdas yang membantu pengusaha menghitung HPP (*Harga Pokok Penjualan*) secara akurat dan dinamis, melindungi bisnis dari lonjakan harga bahan baku (*Price Shock Impact*), mengalokasikan stok berbasis FEFO (*First Expired, First Out*), memitigasi risiko limbah bahan (*anti-waste*), dan memetakan profitabilitas menu melalui matriks *Menu Engineering*.

---

## 🌐 Tautan Live & Pratinjau

- **Aplikasi Web (Frontend):** [https://takar-laba.vercel.app](https://takar-laba.vercel.app) *(Deployment Vercel)*
- **API Serverless (Backend):** [https://takar-laba-api.vercel.app](https://takar-laba-api.vercel.app) *(Vercel Serverless Function, Region sin1)*
- **Database:** Serverless PostgreSQL 17 via **Neon** *(Region ap-southeast-1, Singapura)*

---

## 🎯 Masalah Nyata & Solusi yang Ditawarkan

### Masalah yang Dihadapi UMKM Kuliner
Berdasarkan data Kementerian UMKM dan BPS (Sakernas), Indonesia memiliki 56 hingga 65 juta unit UMKM, dengan mayoritas bergerak di sektor kuliner mikro dan kecil. Sayangnya, banyak pelaku usaha kuliner mengalami kesulitan bertahan karena kendala struktural:
1. **Perhitungan HPP Statis & Margin Semu:** Pengusaha hanya menghitung HPP sekali saat pertama kali membuka gerai. Ketika harga bahan baku naik di pasar, HPP tidak pernah diperbarui sehingga harga jual tertinggal dan bisnis mengalami kerugian terselubung.
2. **Pengabaian Beban Overhead & Bahan Penolong:** Biaya utilitas (listrik, gas, air), penyusutan alat dapur, dan kemasan penolong sering diabaikan dalam costing manual, menyebabkan HPP aktual jauh lebih tinggi daripada perkiraan.
3. **Limbah Stok Tanpa Alokasi FEFO:** Tanpa manajemen stok berbasis tanggal kedaluwarsa, bahan baku yang masuk lebih awal tertimbun di gudang dan membusuk (*waste*), menggerus modal kerja.
4. **Ilusi Menu Laris vs Menu Menguntungkan:** Menu yang terjual paling banyak sering dianggap paling menguntungkan, padahal kontribusi margin rupiahnya sangat tipis. Keputusan bisnis kerap diambil atas dasar intuisi tanpa data.
5. **Kebocoran Informasi Finansial ke Staf:** Sistem kasir konvensional sering mengekspos margin keuntungan dan harga beli bahan baku kepada kasir atau staf operasional.

### Solusi Cerdas TakarLaba
TakarLaba hadir sebagai *decision-support system* dengan pilar utama:
- **Dual HPP Real-Time (Bahan vs Penuh, Aktual vs Pengganti):** Memperhitungkan bahan baku usable (dengan faktor *yield*), kemasan, serta alokasi overhead bulanan per porsi secara otomatis.
- **Price Shock Impact & Warning Center:** Ketika ada kenaikan harga beli bahan pada transaksi pembelian baru, sistem mendeteksi penurunan margin dan seketika menyajikan simulasi dua solusi taktis:
  - **Opsi A (Naikkan Harga):** Rekomendasi harga jual baru dengan pembulatan step psikologis UMKM (misal kelipatan Rp500).
  - **Opsi B (Rekayasa Takaran):** Menjaga harga jual tetap kompetitif dengan mengurangi gramatur takaran bahan secara proporsional dan terukur.
- **Kasir Atomik Mobile-First Berbasis FEFO:** Pemotongan stok otomatis mengambil batch bahan yang kedaluwarsa paling awal (*row-level locking* untuk mencegah *race condition* stok minus), serta fitur *Void* transaksi yang memulihkan kembali stok ke batch asal secara atomik.
- **Matriks Menu Engineering 4 Kuadran:** Mengklasifikasikan menu secara ilmiah ke dalam *Star*, *Plowhorse*, *Puzzle*, dan *Dog* menggunakan margin kontribusi rupiah dan ambang popularitas Kasavana & Smith.
- **Kapasitas Porsi & Deteksi Bottleneck:** Menghitung sisa kapasitas porsi yang dapat dibuat secara instan dan menunjukkan bahan baku mana yang menjadi penghambat utama.
- **Cashier Privacy Shield (Rule 7):** Pembatasan DTO ketat di lapisan backend; kasir tidak pernah menerima data harga beli, HPP, maupun persentase margin laba.

---

## 🛠️ Stack Teknologi & Arsitektur

### Frontend (`frontend/`)
- **Framework & Runtime:** React 19 · Vite 6 · TypeScript (Strict Mode)
- **Routing:** React Router 8 (Data Router dengan *lazy loading* per rute)
- **Manajemen State Server:** TanStack Query v5 (dengan *query key factory* terstruktur dan cache invalidation otomatis)
- **Autentikasi Klien:** Better Auth React Client (`better-auth/react`) berbasis cookie sesi *first-party*
- **Formulir & Validasi:** React Hook Form + Resolver Zod 4
- **Komponen & Desain UI:** Tailwind CSS v4 (`@tailwindcss/vite`) · Desain token shadcn/ui · Lucide React Icons · Sonner Toasts · Angka `tabular-nums`
- **Visualisasi Data:** Recharts & SVG murni untuk matriks Menu Engineering
- **Testing:** Vitest · Testing Library

### Backend (`backend/`)
- **Runtime:** Node.js 22 LTS (ESM NodeNext murni)
- **Framework:** Express 5 (dukungan native async rejection, parameter wildcard)
- **Validasi Otoritatif:** Zod 4 di batas sistem (middleware `validate` untuk body, params, dan query dengan `z.stringbool()`)
- **Autentikasi & Multi-Tenant:** Better Auth (`@better-auth/node`) dengan *tenant scoping* wajib (`businessId`, `role` pada `req.ctx`)
- **Presisi Finansial:** `decimal.js` (semua perhitungan uang dan kuantitas bebas dari pembulatan pecahan IEEE 754 float)
- **Database & Driver:** Prisma 7 (`@prisma/adapter-pg` + `pg` connection pool)
- **Keamanan & Logging:** Helmet 8 · express-rate-limit · Pino 9 & pino-http · Same-Origin validation middleware
- **Pengujian:** Vitest · Supertest (pengujian unit, HTTP, dan integrasi PostgreSQL nyata)

### Diagram Alur Data Single-Origin

```text
┌─────────────────────────────────────────────────────────────┐
│                 Browser Klien (Frontend SPA)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Request relatif: /api/*
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Vercel Edge Network (Reverse Proxy)              │
│       Rewrite /api/(.*) -> Backend Serverless Function      │
│  (Satu Origin: Bebas CORS, Cookie Sesi HttpOnly First-Party)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Forwarding request internal
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Backend Express 5 (Vercel Function / VPS)          │
│   Middleware: Helmet -> Pino -> Better Auth -> Rate Limit   │
│   -> Same-Origin Guard -> Authoritative Zod Validation      │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Layered Domain Architecture  │
               ▼                              ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     Pure Domain Engines     │ │    Tenant Repositories      │
│  (Costing, FEFO, Pricing,   │ │ (Prisma 7 Client + pg Pool, │
│ Capacity, Menu Engineering) │ │  Strict businessId Scoping) │
└─────────────────────────────┘ └─────────────┬───────────────┘
                                              │ Query SQL Parameterized
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Neon Serverless PostgreSQL 17 Database            │
│   Tabel Bisnis + Tabel Better Auth + Integritas Relasi FK   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Fitur Utama & Matriks Hak Akses

| Fitur | Deskripsi | Owner | Kasir |
|---|---|:---:|:---:|
| **Dashboard Usaha** | Ringkasan omzet, laba kotor estimasi, grafik transaksi, peringatan margin, dan stok kritis | ✅ | ❌ |
| **Pusat Peringatan (Price Shock)** | Deteksi anjloknya margin pasca-pembelian, simulasi Opsi A (naikkan harga) & Opsi B (rekayasa porsi), aksi terapkan instan | ✅ | ❌ |
| **Manajemen Bahan & Konversi** | Master bahan baku, satuan konversi otomatis (mis. kg $\rightarrow$ g, L $\rightarrow$ ml), faktor *yield* | ✅ | ❌ |
| **Editor Resep & Live Costing** | Penyusunan Bill of Materials (BOM), live preview HPP Bahan/Penuh, HPP Pengganti vs Aktual | ✅ | ❌ |
| **Beban Overhead Bulanan** | Pengaturan target porsi bulanan dan biaya utilitas/penyusutan/tenaga kerja per porsi | ✅ | ❌ |
| **Katalog Menu & Harga** | Daftar menu, riwayat penyesuaian harga jual, margin status badge (Aman / Waspada / Bahaya) | ✅ | ❌ |
| **POS Kasir Cerdas** | Grid menu cepat, keranjang belanja, kalkulator kembalian, struk cetak thermal CSS, Idempotency-Key | ✅ | ✅ |
| **Alokasi Stok FEFO Otomatis** | Pemotongan stok otomatis dari batch kedaluwarsa paling awal dengan row-level lock | ✅ | ✅ *(Sistem)* |
| **Kapasitas & Bottleneck Porsi** | Informasi sisa porsi yang dapat dibuat beserta bahan baku yang paling membatasi | ✅ | ✅ *(Tanpa Biaya)* |
| **Riwayat Penjualan** | Log penjualan, filter metode bayar/tanggal, modal rincian transaksi | ✅ *(Lengkap)* | ✅ *(Milik Sendiri)* |
| **Void Transaksi Penjualan** | Pembatalan transaksi salah dengan pengembalian stok atomik ke batch asal (`VOID_RESTORE`) | ✅ | ❌ |
| **Matriks Menu Engineering** | Analisis 4 kuadran Kasavana & Smith (*Star*, *Plowhorse*, *Puzzle*, *Dog*) beserta rekomendasi taktis | ✅ | ❌ |
| **Mode Demo Deterministik** | Reset instan data simulasi juri sesuai PRD Lampiran B dengan cooldown 60 detik | ✅ | ❌ |

---

## 📋 Prasyarat Sistem

- **Node.js:** Versi 22 LTS (minimum v20.19 untuk Prisma 7)
- **Package Manager:** npm (v10+)
- **Database:** PostgreSQL 17 (dapat menggunakan Docker Compose lokal atau Neon PostgreSQL cloud)

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Clone Repositori & Pasang Git Hook

```bash
git clone https://github.com/Ameer-28/TakarLaba.git
cd TakarLaba

# Pasang git hooks lokal untuk memastikan konvensi commit terstandar
git config core.hooksPath .githooks
```

### 2. Siapkan Basis Data Lokal

Gunakan Docker Compose untuk menyalakan instans PostgreSQL 17 lokal:

```bash
docker compose -f database/docker-compose.yml up -d
```

### 3. Konfigurasi Backend

Masuk ke folder `backend/` dan siapkan file konfigurasi environment:

```bash
cd backend
cp .env.example .env
```

Sesuaikan isi `backend/.env` untuk lingkungan pengembangan lokal:
```ini
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/takarlaba?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/takarlaba?schema=public"
BETTER_AUTH_SECRET="abcdefghijklmnopqrstuvwxyz123456"
BETTER_AUTH_URL="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"
LOG_LEVEL=info
DEMO_MODE=true
DEMO_PASSWORD="DemoPassword123!"
```

Jalankan instalasi dependensi, migrasi skema, dan server backend:

```bash
npm ci
npm run db:generate
npx prisma migrate dev
npm run dev
```

Backend akan aktif di `http://localhost:4000` (uji status via `GET http://localhost:4000/api/health`).

### 4. Konfigurasi Frontend

Buka terminal baru, masuk ke direktori `frontend/`:

```bash
cd frontend
cp .env.example .env
```

Isi `frontend/.env` sederhana:
```ini
VITE_API_BASE_URL=/api
```

Jalankan server pengembangan Vite:

```bash
npm ci
npm run dev
```

Buka peramban di `http://localhost:5173`. Request `/api/*` akan di-*proxy* otomatis oleh Vite dev server ke backend di port `4000`.

---

## ⚙️ Variabel Lingkungan (Environment Variables)

### Backend (`backend/.env`)

| Variabel | Wajib | Tipe Data | Deskripsi |
|---|:---:|:---:|---|
| `NODE_ENV` | Ya | `development` \| `production` \| `test` | Mode runtime aplikasi |
| `PORT` | Tidak | Integer (default: `4000`) | Port lokal runner Express standalone |
| `DATABASE_URL` | Ya | String URL PostgreSQL | Connection string database runtime (pooled) |
| `DIRECT_URL` | Ya | String URL PostgreSQL | Connection string migrasi langsung (unpooled) |
| `BETTER_AUTH_SECRET` | Ya | String ($\ge 32$ karakter) | Secret signing token dan enkripsi sesi |
| `BETTER_AUTH_URL` | Ya | String URL | URL asal klien publik (`http://localhost:5173` atau domain vercel) |
| `FRONTEND_URL` | Ya | String URL | URL origin frontend yang diizinkan (*Trusted Origins*) |
| `LOG_LEVEL` | Tidak | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` \| `silent` | Level logging Pino (default: `info`) |
| `DEMO_MODE` | Tidak | Boolean (`true` / `false` via `z.stringbool()`) | Mengaktifkan rute dan banner demo untuk evaluasi |
| `DEMO_PASSWORD` | Tidak | String | Kata sandi default akun bawaan demo jika diaktifkan |
| `TEST_DATABASE_URL` | Tidak | String URL | Basis data pengujian nyata untuk suite Vitest integration test |

### Frontend (`frontend/.env`)

| Variabel | Wajib | Tipe Data | Deskripsi |
|---|:---:|:---:|---|
| `VITE_API_BASE_URL` | Ya | String (default: `/api`) | Base URL rute API (selalu relatif `/api` pada single-origin) |

---

## 🧪 Panduan Skenario Demo Juri (PRD Lampiran A & B)

TakarLaba menyediakan sistem demonstrasi deterministik instan yang dirancang khusus untuk mempermudah evaluasi juri kompetisi **GTNIC 2026**:

### 1. Akun Demo Bawaan & Login Sekali Klik
Pada halaman `/login`, tersedia tombol pintas:
- **Masuk sebagai Demo Owner:** Mengakses akun `owner@takarlaba.demo` dengan hak akses penuh ke seluruh analitik dan costing.
- **Masuk sebagai Demo Kasir:** Mengakses akun `kasir@takarlaba.demo` dengan hak akses terbatas operasional kasir (tanpa biaya).
Endpoint `POST /api/demo/login` dilengkapi proteksi laju *rate limiting* dan *session reuse* agar tidak membebani database.

### 2. Reset Data Bersih Deterministik
- Masuk sebagai **Demo Owner**.
- Pada bagian atas layar muncul **Demo Banner**. Klik tombol **"Reset Data Contoh"** dan konfirmasi.
- Basis data akan secara instan diisi kembali sesuai **Fixture PRD Lampiran B**:
  - **16 Bahan Baku:** Lengkap dengan rasio konversi satuan dasar (g, ml, pcs) dan harga pokok awal.
  - **Overhead:** Rp1.560.000/bulan (Listrik gas air Rp900k, penyusutan alat Rp300k, biaya lain Rp360k) dengan target 1.300 porsi $\rightarrow$ **Rp1.200/porsi**.
  - **6 Menu & Resep:** Es Kopi Susu Aren, Americano, Es Teh Manis, Roti Bakar, Matcha Latte, Croissant Beku.
  - **Riwayat Penjualan 30 Hari:** Tepat 1.300 porsi yang membentuk kuadran awal Kasavana & Smith:
    - *Star:* Es Kopi Susu Aren & Americano
    - *Plowhorse:* Es Teh Manis & Roti Bakar
    - *Puzzle:* Matcha Latte
    - *Dog:* Croissant Beku
  - **Stok Awal:** Susu UHT Batch A kedaluwarsa H+2, Croissant Beku terdapat batch yang kedaluwarsa kemarin (H-1), dan Gula Aren di bawah stok minimum.
- Dilengkapi jeda pendinginan (*cooldown*) 60 detik untuk mencegah spam reset.

### 3. Langkah Pembuktian Fitur Kunci: Simulasi Price Shock
1. Masuk ke halaman **Menu** $\rightarrow$ perhatikan menu **Es Kopi Susu Aren** (HPP Bahan Rp7.740, HPP Penuh Rp8.940, Harga Jual Rp18.000, status margin **Aman (50,33%)**).
2. Masuk ke halaman **Pembelian** $\rightarrow$ klik **"Catat Pembelian Baru"**:
   - Pilih bahan: **Susu UHT**
   - Masukkan jumlah: **10** Satuan: **L** (10.000 ml)
   - Masukkan total harga: **Rp240.000** (harga naik dari Rp18/ml menjadi **Rp24/ml**).
   - Klik **Simpan Pembelian**.
3. Seketika modal **Price Shock Impact** akan muncul:
   - Terdeteksi HPP Penuh Es Kopi Susu Aren melonjak ke **Rp9.840**.
   - Margin tergerus menjadi **45,33%** (di bawah target aman 50%).
4. Sistem menyajikan dua rekomendasi:
   - **Opsi A (Naikkan Harga):** Rekomendasi harga baru **Rp20.000** (margin pulih ke 50,8%).
   - **Opsi B (Rekayasa Takaran):** Pertahankan harga Rp18.000 dengan memangkas takaran susu dari **150 ml $\rightarrow$ 115 ml** (hemat Rp840/porsi).
5. Klik **"Terapkan Harga Baru"** $\rightarrow$ harga menu otomatis terbarui dan status peringatan di Pusat Peringatan otomatis terselesaikan (*RESOLVED*).

### 4. Langkah Pembuktian Kasir FEFO & Void
1. Buka halaman **POS (Kasir)**:
   - Pilih menu Es Kopi Susu Aren (perhatikan badge indikator kapasitas porsi dan bahan bottleneck).
   - Masukkan ke keranjang $\rightarrow$ proses pembayaran Tunai $\rightarrow$ cetak struk CSS thermal.
2. Buka halaman **Riwayat Penjualan**:
   - Klik transaksi yang baru saja dibuat $\rightarrow$ tampil alokasi batch stok bahan yang terpotong secara FEFO.
   - Klik tombol **"Batalkan (Void)"** $\rightarrow$ masukkan alasan pembatalan $\rightarrow$ konfirmasi.
   - Transaksi berubah status menjadi **Dibatalkan (Void)** dan stok batch dipulihkan secara otomatis (`StockMovement: VOID_RESTORE`).

---

## 📜 Perintah Pengujian & Kualitas Kode

Sebelum dilakukan commit dan merge ke branch kerja, kode wajib lulus seluruh *checks*:

```bash
# Pengujian dan Validasi Backend
cd backend
npm run format:check   # Verifikasi kepatuhan format Prettier
npm run lint           # Static code analysis dengan ESLint 9
npm run typecheck      # Type safety check dengan tsc --noEmit
npm run test           # Menjalankan 285+ unit and HTTP tests (Vitest)
npm run build          # Kompilasi TypeScript ke dist/

# Pengujian dan Validasi Frontend
cd frontend
npm run format:check   # Verifikasi format Prettier
npm run lint           # Pemeriksaan lint ESLint
npm run typecheck      # Type safety check dengan tsc -b --noEmit
npm run test           # Menjalankan unit tests komponen & hooks (Vitest)
npm run build          # Produksi bundle Vite
```

---

## 🔒 Keamanan & Prinsip Desain Defensif

1. **Strict Multi-Tenant Scoping:** Tidak ada query database yang mempercayai `businessId` dari input klien. Seluruh query di repository diikat pada `businessId` yang diekstrak dari sesi pengguna terotentikasi.
2. **DTO Sanitization (Rule 7):** Pengguna dengan peran `CASHIER` tidak pernah menerima data biaya melalui filter mapper DTO di lapisan backend.
3. **Pemberian Kunci Baris Atomik (Atomic Row-Locking):** Pemotongan stok saat checkout POS menggunakan transaksi terisolasi dengan klausa SQL `SELECT ... FOR UPDATE` tagged template untuk mencegah *race condition* atau stok minus akibat konkurensi request.
4. **Proteksi Idempotensi:** Checkout POS mewajibkan pengiriman header `Idempotency-Key` unik untuk mencegah terjadinya transaksi ganda akibat gangguan jaringan atau klik berulang.
5. **No Secret in Client Bundle:** Variabel lingkungan secret database dan auth tidak pernah menggunakan prefix `VITE_`, memastikan kredensial tidak bocor ke bundle peramban.

---

## 📄 Lisensi & Orisinalitas

Proyek TakarLaba dikembangkan secara orisinal oleh tim pengembang untuk kompetisi **GTNIC 2026 (Web Development)** di bawah lisensi [MIT](LICENSE). Seluruh pustaka pihak ketiga yang digunakan bersifat *open-source* dengan lisensi permisif.
