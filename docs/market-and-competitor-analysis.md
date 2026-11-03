# Analisis Pasar, Verifikasi Statistik & Lanskap Kompetitor

> **Dokumen Verifikasi Pendukung Proposal GTNIC 2026 (Web Development)**  
> Basis acuan: PRD.md §1.2 & §1.3. Terakhir diverifikasi: November 2026.

Dokumen ini disusun untuk memastikan bahwa seluruh data statistik pasar, klaim keunggulan, serta perbandingan fitur kompetitor pada proposal dan materi presentasi TakarLaba berbasis bukti nyata (*fact-based*), terverifikasi secara metodologis, dan mematuhi etika kompetisi tanpa klaim berlebihan (*overclaiming*).

---

## 1. Skala Pasar & Karakteristik UMKM Kuliner Indonesia

### Data Terverifikasi (Dapat Digunakan dalam Proposal)

| Parameter | Angka / Fakta | Sumber Resmi | Catatan Kutipan dalam Dokumen |
|---|---|---|---|
| **Total Populasi UMKM** | 56,68 juta hingga 65+ juta unit | BPS (Sakernas Agustus 2025), Kementerian Koperasi dan UKM, Bank Indonesia | Wajib ditulis: *"56–65 juta unit UMKM di Indonesia (tergantung sumber resmi pemerintah dan Bank Indonesia)"*. |
| **Porsi Usaha Mikro** | 96,8% dari total UMKM | BPS & Kementerian UMKM | Usaha berskala mikro mendominasi struktur ekonomi rakyat, dengan literasi pembukuan finansial yang terbatas. |
| **Sektor Terbesar** | Kuliner / F&B (*Food and Beverage*) | Kemenparekraf / Kemenkop UKM | Sektor kuliner menyerap tenaga kerja terbesar dan memiliki perputaran bahan baku dengan sensitivitas kedaluwarsa paling tinggi. |

### Data yang Dilarang Dikutip (Status Belum Terverifikasi Sumber Primer)

Untuk menjaga integritas proposal kompetisi, tim dilarang mengutip angka-angka berikut karena tidak ditemukan rilis survei primer atau metodologi yang valid:
- ❌ *"25% UMKM kuliner gagal dalam 2 tahun pertama"* (klaim klise internet tanpa survei akademis primer).
- ❌ *"44 juta UMKM non-bankable"* (angka sekunder tanpa sumber referensi terbitan resmi).
- ❌ Artikel blog komersial vendor POS tanpa tanggal rilis primer atau survei independen.

---

## 2. Analisis Pain Points Nyata & Rujukan Studi

| # | Masalah Nyata | Dampak Finansial | Dasar Bukti & Studi Ilmiah | Status Verifikasi |
|---|---|---|---|:---:|
| 1 | **HPP Statis Pasca-Pembukaan** | Harga jual tertinggal saat inflasi bahan baku; margin riil terus tergerus tanpa disadari pengusaha. | Artikel kajian *Fortune IDN* mengenai kesalahan umum UMKM kuliner dalam menghitung HPP; kajian empiris akuntansi biaya UMKM. | ✅ Terverifikasi |
| 2 | **Pengabaian Overhead & Bahan Penolong** | Munculnya *margin semu* (laba di atas kertas terlihat besar, tetapi kas bersih selalu tekor). | Artikel riset Ma'soem University *"5 Kesalahan Fatal Saat Menghitung HPP"*; studi *recipe-based full costing* (Universitas Tanjungpura / Pontianak) mencatat pencatatan konvensional menghasilkan HPP terdistorsi terlalu rendah hingga 20–35%. | ✅ Terverifikasi |
| 3 | **Stok Tanpa Alokasi FEFO** | Bahan baku lama tertimbun di belakang rak gudang dan membusuk (*waste*), modal kerja musnah. | Studi manajemen operasional dapur UMKM; praktik umum restoran independen tanpa sistem ERP terintegrasi. | ✅ Terverifikasi |
| 4 | **Ilusi Menu Laris vs Menguntungkan** | Promosi difokuskan pada menu yang menghabiskan tenaga operasional, padahal margin kontribusinya tipis. | Banyak kajian UMKM di Indonesia mempraktikkan matriks *Menu Engineering* secara manual via Excel (misal jurnal IDEALIS Universitas Budi Luhur). | ✅ Terverifikasi |
| 5 | **Kerumitan & Biaya Solusi yang Ada** | UMKM mikro enggan beralih dari buku tulis karena sistem POS pasar mahal dan terlalu kompleks. | Biaya langganan POS premium pasar rata-rata Rp150.000–Rp500.000/bulan/gerai, memberatkan usaha beromzet mikro. | ✅ Terverifikasi |

---

## 3. Lanskap Kompetitor & Fitur Paritas Pasar

Untuk bersikap objektif dan mematuhi etika akademik GTNIC 2026, fitur operasional standar yang sudah umum tersedia di pasar **tidak diklaim sebagai inovasi unik TakarLaba**:

### Fitur Paritas (Sudah Ada di Solusi Lain)
- **Pemotongan Stok Resep (Recipe Deduction):** Ditemukan pada paket berbayar Qasir (Pro/Pro Plus), Moka POS, dan Majoo.
- **Konversi Satuan Satuan (Multi-Unit):** Ditemukan pada Majoo dan Olsera (misal konversi kg ke g, L ke ml).
- **Pencatatan Batch & Tanggal Kedaluwarsa:** Tersedia pada modul inventori tingkat lanjut Majoo.

### Perbandingan Harga Pasar (Akses Resmi per November 2026)
- **Moka POS:** Paket Pro ~Rp499.000/outlet/bulan.
- **Majoo:** Paket Starter hingga Enterprise Rp149.000 – Rp599.000/bulan.
- **Pawoon:** Paket Basic hingga Pro Rp149.000 – Rp299.000/bulan.
- **Olsera:** Rp128.000 – Rp298.000/bulan.

---

## 4. Keunggulan Pembeda TakarLaba (*The Decision Layer*)

Mayoritas aplikasi di pasar berfokus sebagai *system of record* (mencatat transaksi kasir dan saldo stok). TakarLaba bertindak sebagai ***system of intelligence / decision layer*** di atas data operasional tersebut:

| Dimensi Fitur | Aplikasi Kasir / POS Umum | TakarLaba | Nilai Strategis bagi Pengusaha |
|---|---|---|---|
| **Deteksi Lonjakan Harga (Price Shock)** | Hanya mencatat riwayat harga beli baru di mutasi pembelian. | Menghitung seketika penurunan margin per porsi dan membuka modal simulasi dampak. | Pengusaha tidak terlambat bereaksi saat harga telur, minyak, atau susu melonjak. |
| **Mitigasi Harga & Resep** | Pengusaha harus mengira-ngira sendiri harga jual baru. | Memberikan dua solusi taktis otomatis: **Opsi A** (kenaikan harga dengan *step rounding*) dan **Opsi B** (rekayasa porsi/takaran bahan). | Keputusan cepat dalam 10 detik tanpa perlu kalkulasi spreadsheet manual. |
| **Metode Costing Resep** | Umumnya hanya HPP Bahan rata-rata (*Average Raw Cost*). | **Dual HPP:** HPP Bahan vs **HPP Penuh** (menyerap overhead utilitas, sewa, penyusutan per porsi), serta **HPP Pengganti** vs **HPP Aktual**. | Mencegah margin semu; laba kotor yang dilihat adalah laba riil. |
| **Menu Engineering Kasavana & Smith** | Terbatas pada laporan *"Menu Terlaris"* berdasarkan kuantiti porsi. | Matriks 4 kuadran otomatis (*Star*, *Plowhorse*, *Puzzle*, *Dog*) berbasis **margin kontribusi rupiah** dan ambang batas ilmiah. | Panduan promosi yang tepat: menaikkan harga Plowhorse, mempromosikan Puzzle, dan mengeliminasi Dog. |
| **Pencegahan Limbah FEFO Atomik** | Pemotongan stok FIFO atau agregat global tanpa row-locking. | Alokasi FEFO berbasis tanggal kedaluwarsa dengan *row-level locking* (`SELECT ... FOR UPDATE`) dan mekanisme *Void-Restore* atomik. | Mengurangi bahan kedaluwarsa di gudang dan mencegah race condition stok negatif. |
| **Proteksi Informasi Kasir (Rule 7)** | Sering menampilkan data margin atau modal di rincian produk kasir. | **Sanitasi DTO Otoritatif:** Kasir sama sekali tidak menerima field biaya, harga beli, HPP, maupun persentase margin. | Melindungi rahasia margin laba bisnis dari karyawan atau kompetitor. |

---

## 5. Kaidah Klaim pada Proposal & Presentasi

1. **Gunakan Frasa yang Tepat:**
   - Gunakan: *"Berdasarkan penelusuran dokumentasi publik solusi kasir di Indonesia, fitur simulasi mitigasi Price Shock dan kalkulasi HPP Penuh per porsi belum kami temukan pada platform sekelas."*
   - Jangan gunakan: *"Tidak ada kompetitor yang punya fitur ini."*
2. **Keterbukaan Metodologi:**
   - Semua rumus matematika di TakarLaba (BR-01 s.d. BR-09) merujuk pada standar akuntansi manajemen teruji (*Full Costing* dan *Contribution Margin Analysis*).
