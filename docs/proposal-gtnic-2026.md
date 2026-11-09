# PROPOSAL KARYA WEB DEVELOPMENT — GTNIC 2026

**TakarLaba: Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner Berbasis Multi-Tenant Decision Layer**

---

<!-- ============================================================
     HALAMAN SAMPUL (Cover Page)
     Saat dikonversi ke PDF, halaman ini menjadi halaman pertama.
     Logo GTNIC 2026 (dan logo Garda Tech) WAJIB dicantumkan.
     ============================================================ -->

**[HALAMAN SAMPUL — halaman terpisah saat cetak PDF]**

> Logo GTNIC 2026 & Garda Tech *(sisipkan di sini saat ekspor ke Word/PDF)*

**PROPOSAL KARYA — GARDA TECH NATIONAL INNOVATION COMPETITION (GTNIC) 2026**

**Kategori: Web Development**

**Judul Karya:** TakarLaba — Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner

**Nama Tim:** *[Nama Tim]* *(isi sesuai nama tim pendaftar resmi)*

**Anggota Tim:**

1. *[Nama Ketua Tim]* — Ketua / Fullstack Architect
2. *[Nama Anggota 1]* — Frontend Developer / UI/UX
3. *[Nama Anggota 2]* — Backend & Database Engineer

**Institusi / Asal Sekolah:** *[Nama Institusi / Sekolah]*

---

<!-- page break -->

### Identitas Karya & Tautan

| Informasi | Keterangan |
|---|---|
| **Nama Karya** | TakarLaba (*Sistem Penjaga Margin & Anti-Waste UMKM Kuliner*) |
| **Kategori Lomba** | Web Development Competition — GTNIC 2026 |
| **Nama Tim** | *[Nama Tim]* |
| **Institusi** | SMK Telkom Malang |
| **Tautan Live Aplikasi** | [https://takar-laba.vercel.app](https://takar-laba.vercel.app) |
| **Tautan API Serverless** | [https://takar-laba-api.vercel.app](https://takar-laba-api.vercel.app) |
| **Repositori GitHub** | [https://github.com/Ameer-28/TakarLaba](https://github.com/Ameer-28/TakarLaba) |
| **Video Demo** | *[Tautan YouTube / Google Drive — isi saat submit]* |

---

## BAB 1. PENDAHULUAN

### 1.1 Latar Belakang Masalah

Berdasarkan data Kementerian Koperasi dan UKM serta Badan Pusat Statistik (Sakernas), Indonesia memiliki antara 56 hingga 65 juta unit Usaha Mikro, Kecil, dan Menengah (UMKM), di mana 96,8% di antaranya merupakan usaha berskala mikro. Sektor makanan dan minuman (*Food and Beverage* / F&B) merupakan salah satu kontributor terbesar dalam penyerapan tenaga kerja dan perputaran ekonomi rakyat.

Meskipun memiliki perputaran omzet harian yang cepat, mayoritas UMKM kuliner menghadapi tantangan keberlanjutan bisnis yang kritis:

1. **Perhitungan HPP Statis & Munculnya Margin Semu:** Pengusaha kuliner umumnya hanya menghitung Harga Pokok Penjualan (HPP) satu kali saat membuka usaha. Ketika harga bahan mentah (seperti telur, minyak goreng, cabai, atau susu) mengalami inflasi mendadak di pasar tradisional, pengusaha tidak memperbarui HPP mereka. Akibatnya, terjadi fenomena *margin semu*—warung atau kafe terlihat ramai pembeli, namun uang kas di akhir bulan selalu tekor karena harga jual tidak lagi menutup biaya riil.
2. **Pengabaian Beban Overhead & Bahan Penolong:** Perhitungan konvensional hanya menghitung bahan baku utama dan mengabaikan beban utilitas (listrik, gas elpiji, air), penyusutan peralatan masak, serta kemasan penolong. Berbagai studi akuntansi biaya UMKM (misal kajian *recipe-based full costing* Universitas Tanjungpura) mencatat bahwa pencatatan konvensional menghasilkan HPP terdistorsi terlalu rendah antara 20% hingga 35%.
3. **Limbah Stok Tanpa Manajemen FEFO (*First Expired, First Out*):** Bahan baku kuliner memiliki masa simpan yang terbatas (*perishable*). Tanpa sistem alokasi stok berbasis tanggal kedaluwarsa, bahan baku yang dibeli terdahulu sering tertimbun di belakang rak dapur dan membusuk, memicu kerugian *food waste* yang menguapkan modal kerja.
4. **Ilusi Menu Terlaris (*Popularity Trap*):** Banyak pemilik usaha memfokuskan promosi pada menu yang paling banyak terjual, tanpa menyadari bahwa menu tersebut memiliki margin kontribusi rupiah yang sangat tipis. Keputusan menu sering kali diambil berdasarkan perasaan atau intuisi (*gut feeling*), bukan berbasis analitik profitabilitas objektif.
5. **Keterbatasan Solusi POS Konvensional:** Aplikasi kasir (*Point of Sale*) yang beredar di pasaran umumnya hanya berfungsi sebagai mesin pencatat transaksi dan kasir (*system of record*). Fitur perhitungan resep sering kali hanya ada di paket langganan enterprise yang mahal (Rp150.000–Rp500.000/gerai/bulan), tanpa menyediakan lapisan pendukung keputusan (*decision layer*) ketika terjadi lonjakan harga bahan baku.

### 1.2 Rumusan Masalah

1. Bagaimana merancang sistem perhitungan HPP dinamis yang mampu memperhitungkan biaya bahan baku usable (*yield*), kemasan penolong, dan alokasi overhead bulanan per porsi secara otomatis?
2. Bagaimana mendeteksi lonjakan harga bahan baku (*Price Shock Impact*) dan memberikan simulasi rekomendasi taktis (kenaikan harga jual vs rekayasa porsi) dalam hitungan detik?
3. Bagaimana mengotomatisasikan pemotongan stok bahan baku kasir berbasis FEFO secara atomik guna mencegah limbah dan menjaga konsistensi data stok bahan?
4. Bagaimana memetakan performa menu kuliner ke dalam matriks *Menu Engineering* 4 kuadran (*Star*, *Plowhorse*, *Puzzle*, *Dog*) berbasis margin kontribusi riil?

### 1.3 Tujuan & Manfaat Karya

- **Bagi Pemilik Usaha (Owner):** Memperoleh visibilitas margin riil dalam 10 detik, memitigasi risiko lonjakan biaya bahan secara instan, dan memiliki panduan strategis berbasis data untuk promosi menu.
- **Bagi Kasir & Operasional:** Mempercepat operasional kasir dengan tampilan POS *mobile-first* yang intuitif di layar ponsel (360 px), mencegah penjualan menu yang bahannya telah habis melalui indikator kapasitas dan *bottleneck*, serta melindungi rahasia margin laba bisnis dari staf kasir.
- **Bagi Perekonomian & Lingkungan:** Menekan tingkat kegagalan usaha mikro kuliner serta mengurangi limbah makanan (*food waste*) melalui alokasi stok terencana.

### 1.4 Target Pengguna / Pasar Aplikasi

TakarLaba dirancang untuk melayani segmen pasar berikut:

| Segmen Pengguna | Profil | Peran dalam Sistem |
|---|---|---|
| **Pemilik UMKM Kuliner Mikro/Kecil** | Pengusaha warung makan, kedai kopi, gerai bakery, atau catering harian yang mengelola 1–3 outlet dengan 5–30 menu aktif. Omzet bulanan Rp5 juta – Rp50 juta. | **Owner** — akses penuh ke seluruh fitur analitik, costing, manajemen bahan, dan pengaturan bisnis. |
| **Kasir / Staf Operasional** | Karyawan operasional yang bertugas melayani pembayaran pelanggan di *counter*. Tidak memerlukan pemahaman akuntansi. | **Cashier** — akses terbatas ke POS kasir, riwayat penjualan milik sendiri, dan indikator kapasitas porsi (tanpa informasi biaya/margin). |
| **Pengusaha Kuliner Pemula** | Individu yang baru memulai bisnis kuliner rumahan dan membutuhkan panduan *costing* yang mudah dipahami. | **Owner** — menggunakan fitur *onboarding wizard* 3 langkah (bahan → resep → overhead) untuk memulai. |

**Karakteristik Target Pasar:**
- Berlokasi di Indonesia (Bahasa Indonesia sebagai bahasa antarmuka utama).
- Memiliki akses internet dasar melalui ponsel atau laptop.
- Belum atau jarang menggunakan sistem pembukuan digital karena biaya berlangganan tinggi.
- Membutuhkan alat yang bekerja langsung tanpa pelatihan panjang.

---

## BAB 2. TINJAUAN PUSTAKA & METODOLOGI PERHITUNGAN

TakarLaba mengadopsi kaidah akuntansi manajemen teruji yang diimplementasikan ke dalam kode murni (*pure domain logic*):

### 2.1 Formula Margin Kontribusi & HPP Penuh (BR-01, BR-02, BR-04)

- **Konversi Yield Bahan:** Stok disimpan dalam satuan dasar mentah (*raw base unit*: gram, mililiter, atau pcs). Resep menyimpan takaran siap pakai (*usable quantity*):
  $$\text{Raw Qty} = \frac{\text{Recipe Qty} \times 100}{\text{Yield Percent}}$$
  $$\text{Biaya per Usable Unit} = \frac{\text{Cost per Base} \times 100}{\text{Yield Percent}}$$
- **HPP Bahan (*Raw Material Cost*):** Total akumulasi biaya seluruh bahan usable dan kemasan dalam satu resep.
- **Overhead per Porsi (*Full Costing*):** Total estimasi beban utilitas, sewa, tenaga kerja, dan penyusutan bulanan dibagi target porsi bulanan:
  $$\text{Overhead per Porsi} = \frac{\sum \text{Biaya Overhead Bulanan}}{\text{Target Porsi Bulanan}}$$
- **HPP Penuh (*Full Recipe Cost*):** $\text{HPP Penuh} = \text{HPP Bahan} + \text{Overhead per Porsi}$.
- **Margin Kontribusi (Rp & %):**
  $$\text{Margin (Rp)} = \text{Harga Jual} - \text{HPP Penuh}$$
  $$\text{Margin (\%)} = \frac{\text{Harga Jual} - \text{HPP Penuh}}{\text{Harga Jual}} \times 100\%$$

### 2.2 Logika Mitigasi Lonjakan Harga / Price Shock (BR-05, BR-06)

Ketika terjadi pembelian bahan baku baru yang menaikkan HPP Penuh dan menurunkan margin di bawah target bisnis, sistem membangkitkan *Price Shock Alert* dengan dua pilihan rekomendasi:

- **Opsi A (Penyesuaian Harga Jual Baru):**
  $$\text{Harga Baru Mentah} = \frac{\text{HPP Penuh Baru}}{1 - \text{Target Margin}}$$
  Harga kemudian dibulatkan ke atas (*ceiling*) mengikuti langkah pembulatan UMKM (`priceRoundingStep`, misal kelipatan Rp500).
- **Opsi B (Rekayasa Takaran / Efisiensi Bahan):** Menghitung pengurangan takaran gramatur/mililiter bahan yang mengalami kenaikan agar harga jual tetap dipertahankan, dengan batas kelayakan efisiensi maksimal 50% dari resep awal guna menjaga kualitas rasa.

### 2.3 Matriks Menu Engineering Kasavana & Smith (BR-08, BR-10)

Menu dianalisis selama horizon 30 hari berdasarkan dua dimensi:

1. **Ambang Batas Popularitas:** $70\% \times \left(\frac{1}{n}\right) \times \text{Total Porsi Terjual}$.
2. **Ambang Batas Margin Kontribusi:** Rata-rata margin kontribusi tertimbang seluruh menu.

Pengelompokan 4 kuadran:
- ⭐ **Star (Populer Tinggi, Margin Tinggi):** Pertahankan kualitas dan konsistensi resep.
- 🐎 **Plowhorse (Populer Tinggi, Margin Rendah):** Naikkan harga bertahap atau kurangi porsi bahan secara hati-hati.
- 🧩 **Puzzle (Populer Rendah, Margin Tinggi):** Tingkatkan promosi, reposisi di papan menu, atau bundel dengan menu lain.
- 🐕 **Dog (Populer Rendah, Margin Rendah):** Evaluasi resep, naikkan margin secara radikal, atau eliminasi dari katalog.

---

## BAB 3. ARSITEKTUR TEKNIS & KEUNGGULAN DESAIN SISTEM

### 3.1 Stack Teknologi Modern

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| **Frontend SPA** | React 19, Vite 6, TypeScript Strict, Tailwind CSS v4, shadcn/ui, React Router 8 (Data Router), TanStack Query v5, Recharts | Single Page Application responsif (*mobile-first*, nyaman di 360 px) |
| **Backend API** | Node.js 22 LTS, Express 5, TypeScript NodeNext (ESM), Zod 4, Prisma 7, Better Auth, Pino 9, decimal.js | RESTful API dengan validasi otoritatif dan autentikasi cookie sesi |
| **Basis Data** | PostgreSQL 17 (Neon Serverless) | Driver `@prisma/adapter-pg` dengan koneksi pooling; 15 entitas relasional |
| **Deployment** | Vercel (Frontend + Backend Serverless Functions), Neon (Database) | Single-origin reverse proxy, region Singapore (sin1) |

### 3.2 Arsitektur Sistem & Alur Data

```
┌─────────────────────────────────────────────────────────┐
│              Browser Klien (Frontend SPA)                │
└────────────────────────┬────────────────────────────────┘
                         │ Request relatif: /api/*
                         ▼
┌─────────────────────────────────────────────────────────┐
│         Vercel Edge Network (Reverse Proxy)              │
│    Rewrite /api/(.*) → Backend Serverless Function       │
│  (Satu Origin: Bebas CORS, Cookie Sesi First-Party)      │
└────────────────────────┬────────────────────────────────┘
                         │ Forwarding internal
                         ▼
┌─────────────────────────────────────────────────────────┐
│       Backend Express 5 (Vercel Function / VPS)          │
│ Middleware: Helmet → Pino → Better Auth → Rate Limit     │
│  → Same-Origin Guard → Authoritative Zod Validation      │
└──────────┬───────────────────────────────┬──────────────┘
           │ Layered Domain Architecture   │
           ▼                               ▼
┌──────────────────────┐ ┌────────────────────────────────┐
│  Pure Domain Engines │ │    Tenant Repositories         │
│ (Costing, FEFO,      │ │ (Prisma 7 Client + pg Pool,    │
│  Pricing, Capacity,  │ │  Strict businessId Scoping)    │
│  Menu Engineering)   │ │                                │
└──────────────────────┘ └──────────────┬─────────────────┘
                                        │ Query SQL
                                        ▼
┌─────────────────────────────────────────────────────────┐
│        Neon Serverless PostgreSQL 17 Database             │
│  15 Entitas + Tabel Better Auth + FK Integrity           │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Skema Basis Data (Entity-Relationship Diagram)

Sistem TakarLaba menggunakan 15 entitas relasional utama yang dirancang untuk mendukung multi-tenancy, *batch tracking*, FEFO, dan *audit trail* lengkap:

```
┌──────────┐    ┌──────────┐    ┌──────────────┐
│ Business │───▶│   User   │───▶│   Session    │
│          │    │ (Owner/  │    │  (Auth)      │
│          │    │  Cashier)│    └──────────────┘
└─────┬────┘    └──────────┘
      │
      ├──▶ Ingredient ──▶ IngredientUnit (konversi satuan)
      │         │
      │         ├──▶ StockBatch ──▶ StockMovement
      │         │    (batch FEFO)   (PURCHASE/SALE/VOID/WASTE/ADJUST)
      │         │
      │         └──▶ RecipeItem ◀── Menu ──▶ MenuPriceHistory
      │                                │
      ├──▶ OverheadCost                 ├──▶ SaleItem ◀── Sale
      │    (utilitas/bulan)             │
      ├──▶ Purchase ────────────────────┤
      │    (nota pembelian)             │
      └──▶ MarginAlert ◀───────────────┘
           (Price Shock Impact)
```

**Entitas Inti:** Business, User, Ingredient, IngredientUnit, StockBatch, StockMovement, Purchase, Menu, RecipeItem, MenuPriceHistory, OverheadCost, Sale, SaleItem, MarginAlert, serta tabel autentikasi Better Auth (Session, Account, Verification).

Diagram ERD visual lengkap tersedia di repositori: `docs/erd-diagram.svg` dan `docs/erd.md`.

### 3.4 Keunggulan Arsitektur Defensif

1. **Arsitektur Single-Origin Reverse Proxy:** Frontend me-*rewrite* rute `/api/*` secara transparan ke backend serverless melalui konfigurasi Vercel Edge. Browser klien hanya berkomunikasi dengan satu origin yang sama. Hal ini meniadakan kebutuhan CORS terbuka (*zero CORS*) dan memastikan cookie sesi autentikasi berstatus *first-party*, aman dari pemblokiran *Intelligent Tracking Prevention* (ITP) pada Apple Safari dan iOS.
2. **Matematika Finansial Presisi Tanpa Float:** Seluruh penghitungan uang, kuantitas, dan persentase di lapisan domain backend diproses menggunakan pustaka `decimal.js`, mencegah akumulasi eror pembulatan floating-point IEEE 754.
3. **Pemberian Kunci Baris Atomik (Atomic FEFO Locking):** Alokasi pengurangan stok saat transaksi penjualan diproses dalam satu transaksi basis data dengan klausa `SELECT ... FOR UPDATE` tagged template literals. Hal ini menjamin tidak terjadi *race condition* stok minus saat terjadi transaksi simultan.
4. **Cashier Privacy Shield (Rule 7):** Di lapisan backend, DTO untuk peran `CASHIER` disaring ketat melalui allowlist mapper. Data harga beli, biaya per base unit, HPP Bahan, HPP Penuh, dan margin bisnis tidak pernah dikirimkan ke peramban kasir.
5. **Idempotensi Transaksi Kasir:** Header `Idempotency-Key` (UUIDv4) mewajibkan setiap proses checkout memiliki kunci unik, mencegah terjadinya penduplikasian transaksi akibat gangguan koneksi internet kasir.

---

## BAB 4. FITUR UTAMA & KEUNIKAN DIBANDING SISTEM SERUPA

### 4.1 Fitur Utama Aplikasi

| # | Fitur | Deskripsi | Owner | Kasir |
|---|---|---|:---:|:---:|
| 1 | **Dashboard Usaha** | Ringkasan omzet, laba kotor estimasi, grafik tren penjualan 7 hari, ranking menu terlaris, peringatan margin, dan stok kritis | ✅ | ❌ |
| 2 | **Pusat Peringatan (Price Shock)** | Deteksi anjloknya margin pasca-pembelian, simulasi Opsi A (naikkan harga) & Opsi B (rekayasa porsi), aksi terapkan instan | ✅ | ❌ |
| 3 | **Manajemen Bahan & Konversi** | Master bahan baku, satuan konversi otomatis (mis. kg → g, L → ml), faktor *yield* | ✅ | ❌ |
| 4 | **Editor Resep & Live Costing** | Penyusunan BOM resep, live preview HPP Bahan/Penuh, HPP Pengganti vs Aktual | ✅ | ❌ |
| 5 | **Beban Overhead Bulanan** | Pengaturan target porsi dan biaya utilitas/penyusutan per porsi | ✅ | ❌ |
| 6 | **Katalog Menu & Harga** | Daftar menu, riwayat harga jual, margin status badge (Aman / Waspada / Bahaya) | ✅ | ❌ |
| 7 | **POS Kasir Cerdas** | Grid menu cepat, keranjang belanja, kalkulator kembalian, struk cetak thermal CSS, Idempotency-Key | ✅ | ✅ |
| 8 | **Alokasi Stok FEFO Otomatis** | Pemotongan stok dari batch kedaluwarsa paling awal dengan row-level lock | ✅ | ✅ |
| 9 | **Kapasitas & Bottleneck Porsi** | Sisa porsi yang dapat dibuat dan bahan baku yang paling membatasi | ✅ | ✅ |
| 10 | **Riwayat Penjualan & Void** | Log penjualan, filter tanggal/metode bayar, void dengan pengembalian stok atomik | ✅ | ✅ |
| 11 | **Matriks Menu Engineering** | Analisis 4 kuadran Kasavana & Smith (*Star*, *Plowhorse*, *Puzzle*, *Dog*) | ✅ | ❌ |
| 12 | **Waste Radar Anti-Limbah** | Nilai risiko Rp batch mendekati kedaluwarsa, harga lantai promo, batas diskon aman | ✅ | ❌ |
| 13 | **Ekspor CSV** | Unduh data penjualan dan stok dalam format CSV | ✅ | ❌ |
| 14 | **Mode Demo Deterministik** | Reset data simulasi juri (16 bahan, 6 menu, 1.300 porsi) dalam sekali klik | ✅ | ❌ |

### 4.2 Keunikan TakarLaba Dibanding Sistem Serupa

Berdasarkan penelusuran dokumentasi publik solusi kasir di Indonesia, TakarLaba memiliki diferensiasi sebagai ***decision layer*** yang melampaui fungsi *system of record* konvensional:

| Dimensi Fitur | Aplikasi Kasir/POS Umum (Moka, Pawoon, Olsera, Majoo) | TakarLaba |
|---|---|---|
| **Deteksi Lonjakan Harga (Price Shock)** | Hanya mencatat riwayat harga beli baru di mutasi pembelian. | Menghitung seketika penurunan margin per porsi dan membuka modal simulasi dampak. |
| **Mitigasi Harga & Resep Otomatis** | Pengusaha harus mengira-ngira sendiri harga jual baru. | Memberikan dua solusi taktis otomatis: **Opsi A** (kenaikan harga dengan *step rounding*) dan **Opsi B** (rekayasa porsi/takaran). |
| **Metode Costing Resep** | Umumnya hanya HPP Bahan rata-rata (*Average Raw Cost*). | **Dual HPP:** HPP Bahan vs **HPP Penuh** (menyerap overhead per porsi), serta **HPP Pengganti** vs **HPP Aktual**. |
| **Menu Engineering Kasavana & Smith** | Terbatas pada laporan *"Menu Terlaris"* berdasarkan kuantitas. | Matriks 4 kuadran otomatis berbasis **margin kontribusi rupiah** dan ambang batas ilmiah. |
| **Pencegahan Limbah FEFO Atomik** | Pemotongan stok FIFO/agregat tanpa row-locking. | Alokasi FEFO dengan *row-level locking* (`SELECT ... FOR UPDATE`) dan mekanisme *Void-Restore* atomik. |
| **Proteksi Informasi Kasir** | Sering menampilkan data margin/modal di rincian produk kasir. | **Sanitasi DTO Otoritatif:** Kasir tidak pernah menerima field biaya, HPP, maupun margin. |

---

## BAB 5. SKENARIO IMPLEMENTASI & HASIL EVALUASI

### 5.1 Pengujian Terotomatisasi

TakarLaba telah melalui serangkaian pengujian terotomatisasi yang ketat dan menyeluruh:

- **Pengujian Unit & HTTP (Vitest & Supertest):** Sebanyak **74 berkas uji** dengan **504 pengujian** fungsional lulus 100% tanpa catatan eror (328 backend + 176 frontend).
- **Pengujian Integrasi Basis Data Riil (Real DB against PostgreSQL 17):** Menguji transaksi FEFO multi-batch, konkurensi simultan `Promise.all`, idempotensi checkout, isolasi tenant, serta pembatalan transaksi (*void restore*).
- **Uji Keterpakaian Pengguna Awam:** Validasi dengan 3 pengguna non-akuntan menghasilkan skor SUS (*System Usability Scale*) **86,67** (Grade A), rata-rata waktu penyelesaian skenario inti **6 menit 56 detik** (target ≤ 10 menit), dan *completion rate* 100%.

### 5.2 Mode Demo Deterministik untuk Juri

Dilengkapi dengan sistem seed dan reset data instan berbasis skenario Lampiran B PRD (16 bahan, 6 menu, riwayat 1.300 porsi selama 30 hari) yang dapat dijalankan juri dalam sekali klik pada akun Demo Owner dengan jeda pendinginan (*cooldown*) 60 detik. Halaman login menyediakan tombol *"Masuk sebagai Demo Owner"* dan *"Masuk sebagai Demo Kasir"* untuk akses cepat tanpa registrasi.

---

## BAB 6. TANGKAPAN LAYAR ANTARMUKA SISTEM

Berikut adalah tangkapan layar halaman-halaman utama aplikasi TakarLaba yang telah diimplementasikan:

*[Sisipkan screenshot saat ekspor ke PDF]*

1. **Halaman Login** — Tampilan autentikasi dengan akses demo sekali klik.
2. **Dashboard Owner** — Ringkasan KPI, grafik tren penjualan, ranking menu, dan peringatan.
3. **Halaman Bahan Baku & Stok** — Manajemen bahan, ringkasan stok batch, badge kedaluwarsa.
4. **Halaman Pembelian** — Form catat pembelian baru, riwayat pembelian, dan modal Price Shock Impact.
5. **Halaman Menu & Editor Resep** — Katalog menu dengan badge margin, editor BOM dengan live preview HPP.
6. **POS Kasir** — Grid menu, keranjang belanja, kalkulator kembalian, dan struk thermal.
7. **Riwayat Penjualan** — Log transaksi dengan filter dan detail alokasi batch FEFO.
8. **Pusat Peringatan (Alerts)** — KPI cards, daftar alert Price Shock, modal detail Opsi A/B.
9. **Analitik Menu Engineering** — Scatter plot 4 kuadran, tabel padanan, dan rekomendasi taktis.
10. **Pengaturan Bisnis** — Konfigurasi overhead, target margin, dan langkah pembulatan harga.

---

## BAB 7. BATASAN SISTEM APLIKASI

Meskipun TakarLaba menyediakan kemampuan analitik dan operasional yang komprehensif, terdapat beberapa batasan pada versi saat ini:

1. **Bahasa Antarmuka Tunggal:** Antarmuka pengguna hanya tersedia dalam Bahasa Indonesia. Dukungan multi-bahasa (internasionalisasi) belum diimplementasikan.
2. **Satu Outlet per Bisnis (Single-Branch):** Sistem saat ini dirancang untuk satu gerai per akun bisnis. Manajemen multi-outlet (cabang) dengan konsolidasi stok dan laporan antar cabang belum tersedia.
3. **Tanpa Integrasi Hardware Kasir Langsung:** Sistem tidak terhubung langsung ke perangkat keras kasir eksternal seperti *barcode scanner*, laci kas (*cash drawer*), atau printer struk Bluetooth. Pencetakan struk dilakukan melalui fitur cetak CSS peramban (*browser print*).
4. **Tanpa Integrasi Payment Gateway:** Metode pembayaran digital (QRIS, e-wallet) dicatat secara manual oleh kasir; belum ada integrasi langsung ke payment gateway pihak ketiga.
5. **Modul Akuntansi Terbatas:** TakarLaba berfokus pada costing dan margin, bukan modul akuntansi lengkap. Laporan laba-rugi, neraca, dan arus kas tidak tersedia.
6. **Perhitungan Overhead Sederhana:** Alokasi overhead menggunakan metode rata-rata per porsi (*simple averaging*), belum menggunakan *Activity-Based Costing* (ABC).
7. **Koneksi Internet Wajib:** Aplikasi memerlukan koneksi internet aktif; tidak terdapat mode *offline-first*.

---

## BAB 8. RENCANA PENGEMBANGAN LANJUTAN (FUTURE DEVELOPMENT)

Berdasarkan umpan balik dari uji keterpakaian dan analisis kebutuhan pasar, berikut adalah rencana pengembangan fitur TakarLaba ke depan:

### Jangka Pendek (1–3 Bulan)
1. **Multi-Outlet / Multi-Branch:** Dukungan pengelolaan beberapa cabang dalam satu akun bisnis dengan konsolidasi stok dan laporan terpisah per outlet.
2. **Integrasi QRIS & Payment Gateway:** Koneksi langsung ke penyedia pembayaran digital (Midtrans, Xendit) untuk otomatisasi pencatatan transaksi non-tunai.
3. **Progressive Web App (PWA) & Mode Offline:** Mengaktifkan *Service Worker* agar POS kasir tetap berfungsi saat koneksi internet terputus sementara, dengan sinkronisasi otomatis saat kembali online.
4. **Notifikasi Push:** Pemberitahuan otomatis ke pemilik bisnis saat stok bahan mendekati kedaluwarsa atau margin anjlok.

### Jangka Menengah (3–6 Bulan)
5. **Integrasi Printer Bluetooth & Barcode Scanner:** Dukungan pencetakan struk langsung ke printer thermal Bluetooth dan pemindaian barcode bahan baku.
6. **Laporan Analitik Lanjutan:** Grafik tren margin bulanan, analisis *break-even point*, dan proyeksi kebutuhan bahan baku.
7. **Manajemen Tenaga Kerja Sederhana:** Pencatatan jadwal shift kasir dan perhitungan biaya tenaga kerja per porsi yang lebih presisi.
8. **Dukungan Multi-Bahasa:** Internasionalisasi antarmuka untuk bahasa Inggris dan bahasa daerah.

### Jangka Panjang (6–12 Bulan)
9. **Marketplace Resep & Template Bisnis:** Platform berbagi resep standar antar pelaku UMKM kuliner sejenis.
10. **Prediksi Permintaan Berbasis AI:** Menggunakan data historis penjualan untuk memprediksi kebutuhan bahan baku harian dan mengurangi kelebihan stok.
11. **Integrasi Marketplace (Grab, GoFood, Shopee Food):** Sinkronisasi otomatis pesanan dari platform *food delivery* ke dalam sistem POS dan stok.

---

## BAB 9. KESIMPULAN & PENUTUP

TakarLaba berhasil menjawab kebutuhan kritis UMKM kuliner dengan menghadirkan sebuah sistem terpadu yang bukan hanya mencatat penjualan, melainkan secara proaktif menjaga margin keuntungan dan mencegah pemborosan bahan baku (*anti-waste*). Melalui pendekatan *mobile-first*, arsitektur keamanan *defense-in-depth*, dan metode akuntansi manajemen teruji, TakarLaba siap menjadi katalisator digitalisasi yang tangguh dan berdampak nyata bagi jutaan UMKM kuliner di Indonesia.

Dengan fitur unggulan *Price Shock Impact Detection*, *Dual HPP Full Costing*, *FEFO Atomic Stock Allocation*, dan *Menu Engineering Matrix* yang belum ditemukan secara terpadu pada solusi kasir sekelas di pasar Indonesia, TakarLaba membuktikan bahwa inovasi teknologi web dapat memberikan dampak langsung dan terukur bagi keberlanjutan bisnis rakyat.

---

### DAFTAR PUSTAKA & RUJUKAN

1. Badan Pusat Statistik (BPS). (2025). *Keadaan Ketenagakerjaan Indonesia (Sakernas Agustus 2025)*. Jakarta: BPS RI.
2. Bank Indonesia. (2024). *Profil Bisnis dan Akses Pembiayaan Usaha Mikro, Kecil, dan Menengah*. Jakarta: Bank Indonesia.
3. Kasavana, M. L., & Smith, D. E. (1982). *Menu Engineering: A Practical Guide to Menu Analysis*. Hospitality Publications.
4. Universitas Ma'soem. (2024). *5 Kesalahan Fatal Saat Menghitung HPP pada Usaha Kuliner*. Kajian Bisnis & Manajemen.
5. Universitas Tanjungpura. (2024). *Penerapan Recipe-Based Full Costing pada UMKM Kuliner Pontianak*. Jurnal Akuntansi dan Bisnis.
6. Universitas Budi Luhur. (2024). *Penerapan Menu Engineering untuk Peningkatan Laba Usaha F&B*. Jurnal IDEALIS.
