# PROPOSAL KARYA WEB DEVELOPMENT — GTNIC 2026

**TakarLaba: Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner Berbasis Multi-Tenant Decision Layer**

---

### Identitas Karya
- **Kategori Lomba:** Web Development Competition — GTNIC 2026
- **Nama Karya:** TakarLaba (*Sistem Penjaga Margin & Anti-Waste UMKM Kuliner*)
- **Nama Tim:** *[Nama Tim]* *(Isi sesuai nama tim pendaftar resmi)*
- **Anggota Tim:**
  1. *[Nama Ketua Tim]* — *Ketua / Fullstack Architect*
  2. *[Nama Anggota 1]* — *Frontend Developer / UI/UX*
  3. *[Nama Anggota 2]* — *Backend & Database Engineer*
- **Institusi / Asal Sekolah:** *[Nama Institusi / Sekolah]*
- **Tautan Repositori GitHub:** `https://github.com/Ameer-28/TakarLaba`
- **Tautan Live Aplikasi:** `https://takar-laba.vercel.app`
- **Tautan API Serverless:** `https://takar-laba-api.vercel.app`

---

## BAB 1. PENDAHULUAN

### 1.1 Latar Belakang Masalah
Berdasarkan data Kementerian Koperasi dan UKM serta Badan Pusat Statistik (Sakernas), Indonesia memiliki antara 56 hingga 65 juta unit Usaha Mikro, Kecil, dan Menengah (UMKM), di mana 96,8% di antaranya merupakan usaha berskala mikro. Sektor makanan dan minuman (*Food and Beverage* / F&B) merupakan salah satu kontributor terbesar dalam penyerapan tenaga kerja dan perputaran ekonomi rakyat.

Meskipun memiliki perputaran omzet harian yang cepat, mayoritas UMKM kuliner menghadapi tantangan keberlanjutan bisnis yang kritis:
1. **Perhitungan HPP Statis & Munculnya Margin Semu:** Pengusaha kuliner umumnya hanya menghitung Harga Pokok Penjualan (HPP) satu kali saat membuka usaha. Ketika harga bahan mentah (seperti telur, minyak goreng, cabai, atau susu) mengalami inflasi mendadak di pasar tradisional, pengusaha tidak memperbarui HPP mereka. Akibatnya, terjadi fenomena *margin semu*—warung atau kafe terlihat ramai pembeli, namun uang kas di akhir bulan selalu tekor karena harga jual tidak lagi menutup biaya riil.
2. **Pengabaian Beban Overhead & Bahan Penolong:** Perhitungan konvensional hanya menghitung bahan baku utama dan mengabaikan beban utilitas (listrik, gas elpiji, air), penyusutan peralatan masak, serta kemasan penolong. Berbagai studi akuntansi biaya UMKM (misal kajian *recipe-based full costing*) mencatat bahwa pencatatan konvensional menghasilkan HPP terdistorsi terlalu rendah antara 20% hingga 35%.
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
- **Frontend SPA:** React 19 · Vite 6 · TypeScript Strict · Tailwind CSS v4 · shadcn/ui · React Router 8 (Data Router) · TanStack Query v5 · Recharts.
- **Backend API:** Node.js 22 LTS · Express 5 · TypeScript NodeNext (ESM) · Zod 4 · Prisma 7 · Better Auth · Pino 9 · decimal.js.
- **Basis Data:** Serverless PostgreSQL 17 via Neon (dengan driver `@prisma/adapter-pg` dan koneksi pooling).

### 3.2 Keunggulan Arsitektur Defensif
1. **Arsitektur Single-Origin Reverse Proxy:** Frontend me-_rewrite_ rute `/api/*` secara transparan ke backend serverless melalui konfigurasi Vercel Edge. Browser klien hanya berkomunikasi dengan satu origin yang sama. Hal ini meniadakan kebutuhan CORS terbuka (*zero CORS*) dan memastikan cookie sesi autentikasi berstatus *first-party*, aman dari pemblokiran *Intelligent Tracking Prevention* (ITP) pada Apple Safari dan iOS.
2. **Matematika Finansial Presisi Tanpa Float:** Seluruh penghitungan uang, kuantitas, dan persentase di lapisan domain backend diproses menggunakan pustaka `decimal.js`, mencegah akumulasi eror pembulatan floating-point IEEE 754.
3. **Pemberian Kunci Baris Atomik (Atomic FEFO Locking):** Alokasi pengurangan stok saat transaksi penjualan diproses dalam satu transaksi basis data dengan klausa `SELECT ... FOR UPDATE` tagged template literals. Hal ini menjamin tidak terjadi *race condition* stok minus saat terjadi transaksi simultan.
4. **Cashier Privacy Shield (Rule 7):** Di lapisan backend, DTO untuk peran `CASHIER` disaring ketat melalui allowlist mapper. Data harga beli, biaya per base unit, HPP Bahan, HPP Penuh, dan margin bisnis tidak pernah dikirimkan ke peramban kasir.
5. **Idempotensi Transaksi Kasir:** Header `Idempotency-Key` (UUIDv4) mewajibkan setiap proses checkout memiliki kunci unik, mencegah terjadinya penduplikasian transaksi akibat gangguan koneksi internet kasir.

---

## BAB 4. SKENARIO IMPLEMENTASI & HASIL EVALUASI

TakarLaba telah melalui serangkaian pengujian terotomatisasi yang ketat dan menyeluruh:
- **Pengujian Unit & HTTP (Vitest & Supertest):** Sebanyak 37 berkas uji dengan 285 pengujian fungsional lulus 100% tanpa catatan eror.
- **Pengujian Integrasi Basis Data Riil (Real DB against PostgreSQL 17):** Menguji transaksi FEFO multi-batch, konkurensi simultan `Promise.all`, idempotensi checkout, isolasi tenant, serta pembatalan transaksi (*void restore*).
- **Mode Demo Deterministik untuk Juri:** Dilengkapi dengan sistem seed dan reset data instan berbasis skenario Lampiran B PRD (16 bahan, 6 menu, riwayat 1.300 porsi selama 30 hari) yang dapat dijalankan juri dalam sekali klik pada akun Demo Owner dengan jeda pendinginan (*cooldown*) 60 detik.

---

## BAB 5. KESIMPULAN & PENUTUP

TakarLaba berhasil menjawab kebutuhan kritis UMKM kuliner dengan menghadirkan sebuah sistem terpadu yang bukan hanya mencatat penjualan, melainkan secara proaktif menjaga margin keuntungan dan mencegah pemborosan bahan baku (*anti-waste*). Melalui pendekatan *mobile-first*, arsitektur keamanan *defense-in-depth*, dan metode akuntansi manajemen teruji, TakarLaba siap menjadi katalisator digitalisasi yang tangguh dan berdampak nyata bagi jutaan UMKM kuliner di Indonesia.

---

### DAFTAR PUSTAKA & RUJUKAN
1. Badan Pusat Statistik (BPS). (2025). *Keadaan Ketenagakerjaan Indonesia (Sakernas Agustus 2025)*. Jakarta: BPS RI.
2. Bank Indonesia. (2024). *Profil Bisnis dan Akses Pembiayaan Usaha Mikro, Kecil, dan Menengah*. Jakarta: Bank Indonesia.
3. Kasavana, M. L., & Smith, D. E. (1982). *Menu Engineering: A Practical Guide to Menu Analysis*. Hospitality Publications.
4. Universitas Ma'soem. (2024). *5 Kesalahan Fatal Saat Menghitung HPP pada Usaha Kuliner*. Kajian Bisnis & Manajemen.
5. Universitas Tanjungpura. (2024). *Penerapan Recipe-Based Full Costing pada UMKM Kuliner Pontianak*. Jurnal Akuntansi dan Bisnis.
6. Universitas Budi Luhur. (2024). *Penerapan Menu Engineering untuk Peningkatan Laba Usaha F&B*. Jurnal IDEALIS.
