# PRD — TakarLaba

> Asisten penjaga margin & anti-waste untuk UMKM kuliner.
> Versi 1.0 · 2026-10-19 · Status: siap dikerjakan

| Item | Isi |
|---|---|
| Kompetisi | Garda Tech National Innovation Competition (GTNIC) 2026 — Web Development |
| Subtema | Accelerating Digital Transformation for Business and SMEs (fokus: Business, UMKM & Digital Economy) |
| Masa pengerjaan | 19 Okt – 10 Nov 2026. Batas submit 10 Nov 23:59 WIB; **target internal submit 9 Nov** |
| Grand Final | 14 Nov 2026 (live pitching via Zoom). Website & repo wajib publik dan hidup sampai kompetisi selesai |
| Dokumen terkait | AGENTS.md · ARCHITECTURE.md · TODO.md · WORKFLOW.md · SKILL.md |

**One-liner:** POS mencatat *apa yang terjadi*. TakarLaba memberi tahu *menu mana yang mulai rugi, kenapa, dan harus berbuat apa*.

---

## 1. Problem Statement

### 1.1 Masalah inti
Pemilik UMKM kuliner (kafe, bakery, katering, frozen food) menetapkan harga jual dari HPP yang dihitung sekali di awal dan jarang diperbarui. Perhitungannya biasanya hanya bahan langsung. Akibatnya:
1. Harga bahan naik, HPP tidak ikut naik, margin menipis tanpa disadari.
2. Biaya "tak terlihat" (bahan penolong, utilitas, penyusutan alat, produk gagal/susut) tidak masuk HPP, sehingga margin tampak sehat padahal bocor.
3. Stok bahan mentah terpisah dari penjualan: selisih stok, bahan kedaluwarsa, dan pemilik tidak tahu nilai rupiah yang terancam terbuang.
4. Menu yang laris dianggap menguntungkan, padahal margin per porsinya tipis. Keputusan menu berdasarkan perasaan, bukan data.

### 1.2 Pain points & bukti

| # | Pain point | Dampak | Bukti | Status |
|---|---|---|---|---|
| 1 | HPP dipakai terus sejak buka usaha, tidak diperbarui saat harga bahan naik | Harga jual tertinggal dari biaya | Fortune IDN — kesalahan umum menghitung HPP | ✅ ada |
| 2 | HPP mengabaikan bahan penolong, utilitas, penyusutan alat, produk gagal | Margin semu | Artikel Ma'soem University "5 Kesalahan Fatal Saat Menghitung HPP…" (lima kesalahan di atas); studi recipe-based full costing (Pontianak) menyebut pencatatan konvensional menghasilkan HPP terlalu rendah | ✅ ada |
| 3 | Stok bahan tidak terpotong otomatis per resep & tidak ada FEFO | Waste, selisih stok | Praktik umum; butuh sumber kutipan tambahan | ⚠ cari sumber |
| 4 | Menu laris ≠ menu untung | Keputusan menu salah | Banyak kajian Indonesia mengerjakan menu engineering manual (Excel) di kafe/restoran | ✅ ada |
| 5 | Alat yang ada mahal/rumit untuk UMKM mikro | Adopsi rendah | Belum diverifikasi | ⚠ **jangan ditulis sebagai fakta** |

**Skala pasar:** UMKM Indonesia sekitar 56,68 juta unit (Kementerian UMKM, Sakernas Agustus 2025), 96,8% di antaranya usaha mikro; BI menyebut lebih dari 65 juta. Tulis **"56–65 juta tergantung sumber"**.

**Tidak boleh dipakai di proposal sebelum diverifikasi sumber aslinya:** "25% UMKM gagal di 2 tahun pertama", "44 juta UMKM non-bankable", artikel Qasir (17 Apr 2026) dan Mekari (30 Jan 2026).

**Sumber (diakses 2026-10-19, cek ulang sebelum dikutip):**
- https://masoemuniversity.ac.id/?p=128294
- https://www.fortuneidn.com/business/cara-menghitung-hpp-d7w02-00-fykp7-dptpxz
- https://jom.fti.budiluhur.ac.id/IDEALIS/article/download/3771/1474/19001
- https://www.cnbcindonesia.com/news/20260811124140-4-758237/pemerintah-minta-umkm-ri-belajar-dari-india

### 1.3 Landscape kompetitor (fakta terverifikasi)
- **Sudah ada di pasar (parity, jangan diklaim unik):** pemotongan stok bahan via resep (Qasir paket Pro/Pro Plus, Moka, Majoo), konversi satuan resep dan HPP rata-rata otomatis (Majoo), batch + tanggal kedaluwarsa (Majoo).
- **Harga referensi:** Moka Pro ± Rp499.000/outlet/bulan; Majoo Rp149.000–599.000; Pawoon Rp149.000–299.000; Olsera Rp128.000–298.000. ⚠ Cek halaman harga resmi dan catat tanggal akses.
- **Pembeda TakarLaba:** *decision layer* di atas data operasional: (a) Price Shock Impact, (b) HPP Penuh vs HPP Bahan, (c) Menu Engineering otomatis, (d) Waste Radar.
- **Aturan klaim:** tulis "tidak kami temukan di dokumentasi publik pesaing", bukan "tidak ada". ⚠ Verifikasi lewat trial (mis. Moka 14 hari) sebelum submit.

### 1.3 Dampak jika tidak diselesaikan
Margin bocor tanpa disadari, bahan terbuang, harga jual terlambat disesuaikan, dan menu tidak menguntungkan terus dipertahankan.

---

## 2. Goals & Objectives

| ID | Goal | Metrik keberhasilan | Target terukur |
|---|---|---|---|
| G1 | Pemilik cepat sadar saat margin menu terancam | Waktu dari simpan nota belanja → alert tampil | p95 ≤ 3 dtk; 100% menu terdampak terdeteksi pada fixture A |
| G2 | HPP akurat dan konsisten | Hasil kalkulasi vs fixture | Selisih 0 (Decimal) pada 6 menu fixture; 100% unit test costing lulus |
| G3 | Stok bahan akurat & FEFO benar | Urutan potong batch, stok negatif, race condition | 100% urutan FEFO benar; 0 stok negatif; 2 checkout paralel tidak oversell |
| G4 | Keputusan menu berbasis data | Klasifikasi menu engineering vs fixture B | 6/6 menu terklasifikasi benar sebelum & sesudah price shock |
| G5 | Visibilitas waste | Nilai Rp bahan kedaluwarsa ≤ N hari tampil di dashboard | Tampil & akurat di fixture |
| G6 | Siap dinilai juri | Alur demo end-to-end, deploy, repo | Demo ≤ 5 menit tanpa error; URL live publik; ≥ 30 commit bermakna; README lengkap |
| G7 | Mudah dipakai non-akuntan | Uji coba 3 orang awam: input bahan → resep → penjualan pertama | ≤ 10 menit tanpa bantuan (target P1) |
| G8 | Kualitas teknis | Typecheck, lint, test, Lighthouse | 0 error; coverage `domain/` ≥ 85%; Lighthouse mobile perf ≥ 80, a11y ≥ 90 |

---

## 3. Target Users

### Persona 1 — Bu Rina, Owner kedai kopi (primary)
- **Peran:** Pemilik kedai kopi, 1 outlet, 2 karyawan, 8–15 menu.
- **Kebutuhan:** Tahu menu mana yang untung, kapan harus naikkan harga, bahan mana yang harus dihabiskan.
- **Pain points:** Belanja ke pasar/supplier tiap minggu dengan harga berubah-ubah; hitung HPP di buku/Excel sekali; sering "ramai tapi uang tidak ada".
- **Skenario:** Selesai belanja, ia input nota. TakarLaba memberi tahu Es Kopi Susu margin penuhnya turun ke 45,3% (target 50%) dan menyarankan harga Rp20.000.

### Persona 2 — Dimas, Kasir/Barista (primary)
- **Peran:** Staf yang melayani pesanan dan input transaksi.
- **Kebutuhan:** Kasir cepat, tahu menu apa yang masih bisa dibuat, tidak perlu mengerti akuntansi.
- **Pain points:** Pelanggan sudah bayar tapi bahan habis; salah hitung; harus tanya pemilik soal stok.
- **Skenario:** Di layar POS, menu "Matcha Latte" tampil "sisa 12 porsi (dibatasi: Bubuk Matcha)". Ia checkout, stok terpotong otomatis.

### Persona 3 — Pak Hendra, Owner bakery/katering rumahan (secondary)
- **Peran:** Produksi di rumah, jual via pesanan & titip toko.
- **Kebutuhan:** HPP realistis (termasuk gas, listrik, penyusutan oven, bahan susut), kontrol bahan kedaluwarsa.
- **Pain points:** Harga terigu/mentega naik; tidak tahu menu mana yang beban.
- **Skenario:** Membuka Menu Engineering, menemukan "Croissant" berstatus Dog dan memutuskan evaluasi resep.

### Persona 4 — Juri GTNIC (evaluator, bukan target bisnis)
- **Kebutuhan:** Menguji alur utama cepat tanpa registrasi panjang, melihat fitur pintar bekerja, UI responsif.
- **Skenario:** Klik "Masuk sebagai Demo Owner" → data contoh siap → ikuti skrip demo di Lampiran A. Wajib berjalan tanpa error.

---

## 4. User Stories

| ID | Prio | Story | FR |
|---|---|---|---|
| US-01 | P0 | Sebagai pemilik, saya ingin login dengan peran berbeda untuk kasir dan pemilik, supaya kasir tidak melihat harga beli dan margin | FR-AUTH-01/03 |
| US-02 | P0 | Sebagai juri, saya ingin masuk ke akun demo dan mengisi data contoh dengan satu klik, supaya bisa menguji tanpa setup | FR-DEMO-01 |
| US-03 | P0 | Sebagai pemilik, saya ingin mencatat bahan baku dengan satuan beli dan satuan pakai, supaya resep dalam gram/ml tetap akurat | FR-ING-01 |
| US-04 | P0 | Sebagai pemilik, saya ingin mengisi nota belanja beserta tanggal kedaluwarsa, supaya stok dan harga terbaru tercatat per batch | FR-PUR-01 |
| US-05 | P0 | Sebagai pemilik, saya ingin melihat status stok (Aman/Segera/Kedaluwarsa), supaya tahu bahan yang harus dipakai dulu | FR-ING-02 |
| US-06 | P0 | Sebagai pemilik, saya ingin membuat resep per menu dan melihat HPP langsung, supaya harga jual tidak asal tebak | FR-MENU-01, FR-REC-01 |
| US-07 | P0 | Sebagai pemilik, saya ingin memasukkan biaya listrik, gas, penyusutan, dan lainnya, supaya HPP mencerminkan biaya sebenarnya | FR-OVH-01 |
| US-08 | P0 | Sebagai pemilik, saya ingin melihat HPP Bahan dan HPP Penuh berdampingan, supaya tahu selisih biaya tersembunyi | FR-COST-01 |
| US-09 | P0 | Sebagai kasir, saya ingin mencatat penjualan beberapa menu sekaligus, supaya layanan cepat | FR-POS-01 |
| US-10 | P0 | Sebagai pemilik, saya ingin stok terpotong otomatis dari batch yang paling cepat kedaluwarsa, supaya bahan tidak terbuang | FR-POS-02 |
| US-11 | P0 | Sebagai kasir, saya ingin transaksi ditolak dengan pesan jelas jika bahan kurang, supaya tidak menjual yang tidak bisa dibuat | FR-POS-01/02 |
| US-12 | P0 | Sebagai pemilik, saya ingin langsung diperingatkan saat harga belanja naik dan margin menu turun di bawah target, supaya segera bertindak | FR-PSI-01 |
| US-13 | P0 | Sebagai pemilik, saya ingin diberi opsi (naikkan harga atau kurangi takaran) lengkap dengan angkanya, supaya keputusan cepat | FR-PSI-01 |
| US-14 | P0 | Sebagai pemilik, saya ingin dashboard ringkas (penjualan, laba, alert, stok hampir kedaluwarsa), supaya tahu kondisi usaha dalam 10 detik | FR-DASH-01 |
| US-15 | P1 | Sebagai kasir, saya ingin tahu sisa porsi tiap menu dan bahan penghambatnya, supaya tidak janji berlebihan | FR-CAP-01 |
| US-16 | P1 | Sebagai pemilik, saya ingin menu dikelompokkan otomatis menjadi Star/Plowhorse/Puzzle/Dog, supaya tahu menu mana dipertahankan, dinaikkan harganya, dipromosikan, atau dievaluasi | FR-MEG-01 |
| US-17 | P1 | Sebagai pemilik, saya ingin membatalkan transaksi salah dan stok kembali ke batch asal, supaya data tetap benar | FR-POS-03 |
| US-18 | P1 | Sebagai pemilik, saya ingin mencatat bahan yang dibuang, supaya kerugian waste tercatat | FR-INV-03 |
| US-19 | P1 | Sebagai pemilik baru, saya ingin mendaftar dan dipandu mengisi data awal, supaya cepat mulai | FR-AUTH-04 |
| US-20 | P1 | Sebagai pemilik, saya ingin riwayat penjualan dan pembelian dapat difilter, supaya bisa menelusuri angka | FR-POS-04, FR-PUR-02 |
| US-21 | P2 | Sebagai pemilik, saya ingin tahu nilai rupiah bahan yang hampir kedaluwarsa beserta menu yang bisa dipromosikan dan batas diskon aman, supaya waste jadi uang | FR-WST-01 |
| US-22 | P2 | Sebagai pemilik, saya ingin mengekspor data penjualan/stok ke CSV, supaya bisa diolah di tempat lain | FR-RPT-01 |

---

## 5. Functional Requirements

Konvensi: **P0** = kritis/MVP, **P1** = penting, **P2** = nice to have. Semua uang/kuantitas memakai Decimal. Semua UI berbahasa Indonesia.

### 5.1 Business Rules (sumber kebenaran logika)

- **BR-01 Margin.** `Margin Kontribusi (Rp) = Harga − Biaya`. `Margin % = (Harga − Biaya) / Harga`.
- **BR-02 Satuan & yield.** Stok disimpan dalam *raw base unit* (g/ml/pcs). Resep menyimpan *qty usable* (bersih siap pakai). `rawQty = recipeQty × 100 / yieldPercent`. `Biaya per usable unit = costPerBase × 100 / yieldPercent`.
- **BR-03 Replacement cost.** Harga pengganti suatu bahan = `costPerBase` dari batch dengan `purchasedAt` terbaru (tie-breaker `createdAt`). Nota backdate tidak mengubah replacement cost jika bukan yang terbaru.
- **BR-04 HPP.** `HPP Bahan = Σ (recipeQty × biaya per usable unit)`. `Overhead/porsi = Σ biaya bulanan aktif ÷ expectedMonthlyPortions`. `HPP Penuh = HPP Bahan + Overhead/porsi`. `HPP Pengganti` memakai replacement cost (untuk alert & analitik). `HPP Aktual` memakai biaya batch yang benar-benar terpotong saat penjualan (snapshot di SaleItem).
- **BR-05 Alert trigger.** Setelah pembelian mengubah replacement cost suatu bahan, untuk tiap menu aktif yang memakainya: bila `Margin % Penuh (setelah) < targetMargin` → buat/perbarui **satu** alert OPEN per menu (upsert). Bila sebelumnya OPEN dan margin kembali ≥ target → auto-resolve (`AUTO_RESOLVED`).
- **BR-06 Rekomendasi.** *Opsi A (harga):* `harga = ceil( HPP Penuh / (1 − target) / step ) × step` (step default Rp500). *Opsi B (tahan harga):* `maxCost = harga × (1 − target)`; `penghematan = HPP Penuh − maxCost`; takaran bahan pemicu dikurangi `ceil(penghematan / biaya per usable unit baru)`; jika melebihi 50% takaran → tandai "tidak cukup, pilih opsi A".
- **BR-07 FEFO.** Urutan batch: `expiryDate ASC NULLS LAST, receivedAt ASC, id ASC`. Batch dengan `expiryDate < hari ini (WIB)` tidak boleh dijual, tetapi tetap tampil sampai dibuang.
- **BR-08 Kapasitas.** `kapasitas = floor( min_i( stokRawValid_i / rawPerPorsi_i ) )`; bottleneck = bahan dengan rasio terkecil.
- **BR-09 Status margin menu.** Aman: `≥ target`. Waspada: `target−5 pp s.d. < target`. Bahaya: `< target−5 pp`.
- **BR-10 Menu Engineering** (Kasavana & Smith). Biaya = HPP Pengganti Penuh. Profit = *margin kontribusi Rp* (bukan %). Popularitas = total porsi terjual periode. `ambangPopuler = 0,7 × (1/n) × totalPorsi` (n = jumlah menu terklasifikasi). `ambangMargin = Σ(CM_i × porsi_i) / Σ porsi_i`. Kuadran: populer & margin ≥ ambang = **STAR**; populer & margin < ambang = **PLOWHORSE**; tidak populer & margin ≥ ambang = **PUZZLE**; tidak populer & margin < ambang = **DOG**.
- **BR-11 Pembulatan.** Perhitungan antara memakai Decimal presisi penuh. Tampilan: Rupiah bulat (`Rp18.000`), persen 1 desimal. Mode pembulatan `ROUND_HALF_UP`.
- **BR-12 Zona waktu.** Semua logika "hari ini" dan kedaluwarsa memakai `Asia/Jakarta` (WIB). Timestamp disimpan UTC; `expiryDate` bertipe DATE.

### 5.2 Autentikasi, Otorisasi & Demo

**FR-AUTH-01 [P0] Login/logout.** Email + kata sandi; sesi cookie httpOnly.
- Validasi: email valid, kata sandi wajib.
- Error: pesan generik "Email atau kata sandi salah" (anti user enumeration); lockout sementara setelah 5 gagal/10 menit.
- Edge: sesi kedaluwarsa → redirect ke login dengan `returnTo`; user nonaktif ditolak.
- AC: login sukses redirect ke dashboard (OWNER) atau POS (CASHIER).

**FR-AUTH-02 [P0] Tenant isolation.** Setiap query wajib terscope `businessId` dari sesi, bukan dari input klien. Akses id milik bisnis lain → 404.
- AC: test integrasi — user bisnis A mengakses resource bisnis B di semua entity → selalu NOT_FOUND.

**FR-AUTH-03 [P0] Otorisasi peran.** Lihat matriks di ARCHITECTURE §6. Kasir tidak melihat harga beli, HPP, margin, alert, analitik.

- AC: kasir yang membuka URL halaman pemilik langsung → diarahkan ke POS; endpoint pemilik dipanggil kasir → HTTP 403 FORBIDDEN.
- AC: respons API untuk kasir tidak pernah memuat field biaya (harga beli, HPP, margin).

**FR-AUTH-04 [P1] Registrasi pemilik + onboarding.** Membuat Business + User OWNER; wizard 3 langkah (bahan → menu/resep → overhead).

**FR-DEMO-01 [P0] Demo mode.** Tombol "Masuk sebagai Demo Owner/Kasir" dan "Isi Data Contoh" di halaman login.
- Seed deterministik sesuai Lampiran B; hanya menyentuh bisnis `isDemo=true`; aktif hanya jika `DEMO_MODE=true`; cooldown 60 dtk (`demoResetAt`).
- Error: cooldown → "Data contoh baru saja direset, coba lagi dalam N detik."
- AC: setelah reset, skrip demo Lampiran A menghasilkan angka persis seperti tertulis.

**FR-DEMO-02 [P0]** Banner "Mode Demo — data fiktif" di semua halaman bisnis demo.

### 5.3 Bahan Baku & Stok

**FR-ING-01 [P0] CRUD bahan.** Field: nama, kategori (MAIN/SUPPORT/PACKAGING), baseUnit (G/ML/PCS), yieldPercent, minStock, isPerishable, daftar konversi satuan (mis. 1 liter = 1000 ml).
- Validasi: nama 2–80 karakter, unik per bisnis (case-insensitive); yield 1–100 (desimal ≤ 2 digit); minStock ≥ 0; faktor konversi > 0 dan nama satuan unik per bahan.
- Error: nama duplikat → "Nama bahan sudah ada".
- Edge: `baseUnit` tidak bisa diubah setelah ada batch/resep; bahan yang dipakai resep aktif tidak bisa dinonaktifkan (pesan menyebut nama menu); penghapusan = soft delete.

**FR-ING-02 [P0] Ringkasan stok.** Per bahan: total stok valid, stok kedaluwarsa, kedaluwarsa terdekat, status Aman / Segera (≤ `expiryWarnDays`, default 3) / Kedaluwarsa, badge stok rendah. Detail batch. Cari, urut, paginasi.
- Edge: bahan tanpa batch → "Belum ada stok"; batch `expiryDate` null → "Tanpa kedaluwarsa".

**FR-PUR-01 [P0] Input pembelian (nota belanja).** Header: tanggal, supplier (opsional), catatan. Baris (1–30): bahan, jumlah, satuan, harga (per satuan atau total), tanggal kedaluwarsa. Satu baris = satu batch.
- Validasi: jumlah > 0 dan ≤ 1.000.000; harga > 0; tanggal pembelian tidak lebih dari H+1; kedaluwarsa wajib untuk bahan perishable dan tidak boleh sebelum hari ini; satuan harus ada di konversi bahan.
- Error handling: transaksi atomik; gagal sebagian → rollback total dengan pesan per baris.
- Efek: membuat StockBatch + StockMovement(PURCHASE); memicu evaluasi Price Shock (FR-PSI-01); toast + modal ringkasan dampak.
- Edge: pembelian pertama suatu bahan (belum ada harga sebelumnya) tidak memicu alert, tetapi bisa mengubah status "harga belum ada" → "lengkap" pada menu.

**FR-PUR-02 [P1] Riwayat pembelian.** Filter tanggal/supplier. Pembatalan pembelian hanya jika semua batch belum terpakai (`remaining = initial`).

**FR-INV-03 [P1] Catat bahan terbuang.** Pilih batch, jumlah ≤ sisa, alasan wajib; membuat StockMovement(WASTE); tampil nilai Rp yang terbuang. Owner only.

### 5.4 Menu, Resep, Overhead & Costing

**FR-MENU-01 [P0] CRUD menu.** Nama (unik per bisnis), kategori, harga jual, targetMargin (opsional; default bisnis 50%), aktif.
- Validasi: harga > 0 dan ≤ 100.000.000; targetMargin 0–95%.
- Edge: menu tanpa resep tidak bisa dijual dan dikecualikan dari analitik; harga diubah → tercatat di MenuPriceHistory dan memicu re-evaluasi alert.

**FR-REC-01 [P0] Editor resep.** Baris bahan + jumlah usable (bisa dalam satuan konversi), 1–30 baris, tanpa duplikat bahan. **Live preview** HPP Bahan, Overhead, HPP Penuh, Margin (diperbarui saat mengetik).
- Error: bahan nonaktif tidak bisa ditambahkan; jumlah ≤ 0 ditolak.

**FR-OVH-01 [P0] Overhead.** Daftar biaya bulanan (nama, tipe UTILITY/LABOR/DEPRECIATION/OTHER, nominal ≥ 0) + `expectedMonthlyPortions` (integer ≥ 1). Tampilkan overhead/porsi. Perubahan memicu re-evaluasi alert semua menu.

**FR-COST-01 [P0] Costing engine.** Sesuai BR-02 s.d. BR-04. Tampilan: HPP Bahan vs HPP Penuh; HPP Pengganti vs Aktual; badge margin (BR-09).
- Edge: bahan belum pernah dibeli → menu berlabel "Harga bahan belum lengkap", dikecualikan dari alert & analitik; pembagian nol dilindungi (harga ≥ 1).

### 5.5 POS

**FR-POS-01 [P0] Layar kasir.** Grid menu (cari + filter kategori), keranjang dengan stepper qty, pilihan pembayaran (Tunai / QRIS manual / Transfer manual — hanya dicatat, tanpa gateway), tombol Bayar, struk (dialog + print CSS).
- Validasi: keranjang tidak kosong, qty integer 1–999, maksimal 50 baris, menu aktif dan beresep.
- Error: stok kurang → pesan menyebut bahan, kebutuhan, dan tersedia, tanpa pemotongan sebagian; double-click/retry aman via idempotency key; kegagalan jaringan → keranjang dipertahankan.
- Edge: menu berkapasitas 0 ditampilkan nonaktif dengan alasan; harga menu berubah saat keranjang terbuka → pakai harga terbaru saat submit dan beri tahu.

**FR-POS-02 [P0] Pemotongan FEFO atomik.** Dalam satu transaksi DB: kunci batch (`FOR UPDATE`), alokasi FEFO per bahan (BR-07, BR-02), update sisa batch, tulis StockMovement(SALE), simpan Sale + SaleItem beserta `ingredientCostActual` dan `overheadAllocated`.
- AC: (1) urutan batch benar; (2) stok tidak pernah negatif; (3) dua checkout paralel pada stok terbatas → tepat satu berhasil; (4) kegagalan di tengah → tidak ada perubahan data.

**FR-POS-03 [P1] Void transaksi (Owner).** Alasan wajib; stok dikembalikan ke batch asal lewat StockMovement(VOID_RESTORE) dalam satu transaksi; status VOIDED; tidak bisa di-void dua kali; dikecualikan dari laporan & analitik.

**FR-POS-04 [P1] Riwayat penjualan.** Filter tanggal; detail menampilkan alokasi batch per item.

### 5.6 Price Shock Impact (fitur pembeda utama)

**FR-PSI-01 [P0] Deteksi & keputusan.** Sesuai BR-05 dan BR-06.
- Setelah pembelian: modal "Dampak Kenaikan Harga" berisi daftar menu terdampak (biaya sebelum→sesudah, margin Bahan vs Penuh, target, status).
- Halaman **Pusat Peringatan** (daftar alert OPEN/ACKNOWLEDGED/RESOLVED).
- Aksi (Owner): *Terapkan harga rekomendasi* (mengubah harga + MenuPriceHistory + resolve `PRICE_RAISED`), *Ubah harga manual*, *Abaikan dengan catatan* (`DISMISSED`).
- Edge: harga bahan turun → alert OPEN yang pulih otomatis ter-resolve; margin sudah di bawah target sebelum pembelian → alert tetap di-upsert, bukan duplikat; satu menu paling banyak satu alert OPEN.
- AC: fixture A (Lampiran B) menghasilkan alert dengan angka persis seperti tertulis.

**FR-PSI-02 [P0] Re-evaluasi.** Dipicu oleh: pembelian baru, perubahan resep, perubahan harga jual, perubahan overhead, perubahan target margin.

### 5.7 Dashboard & Analitik

**FR-DASH-01 [P0] Dashboard Owner.** Kartu: omzet hari ini, jumlah transaksi, estimasi laba hari ini (`omzet − ingredientCostActual − overheadAllocated`), alert OPEN, nilai Rp bahan kedaluwarsa ≤ N hari, jumlah stok rendah. Daftar 5 alert teratas dan 5 menu berkapasitas terendah. Empty state untuk bisnis baru.

**FR-CAP-01 [P1] Kapasitas porsi & bottleneck** (BR-08) di kartu menu POS, detail menu, dan dashboard.

**FR-MEG-01 [P1] Menu Engineering** (BR-10): scatter chart 4 kuadran + tabel padanan (aksesibilitas) + rekomendasi per menu.
- Periode 7/30/90 hari (default 30).
- Rekomendasi **dihitung, bukan teks tetap**:
  - STAR → pertahankan kualitas.
  - PLOWHORSE → evaluasi harga/biaya; tampilkan "naik Rp1.000 tetap untung selama penjualan tidak turun lebih dari X%" dengan `X = 1 − CM / (CM + kenaikan)`.
  - PUZZLE → tampilkan prompt rekomendasi di POS; diskon maksimum aman = `CM − ambangMargin`.
  - DOG → evaluasi: tampilkan bahan yang hanya dipakai menu ini beserta nilai stoknya; jangan langsung menyarankan hapus.
- Guard: butuh ≥ 4 menu terklasifikasi dan ≥ 30 transaksi (jika tidak: pesan "Data belum cukup"); menu < 14 hari berlabel "Baru" dan tidak diklasifikasi; menu tanpa penjualan = "Tanpa penjualan".
- AC: fixture B terklasifikasi persis seperti tabel Lampiran B, sebelum dan sesudah price shock.

**FR-WST-01 [P2] Waste Radar.** Daftar batch ≤ N hari kedaluwarsa dengan nilai risiko Rp, menu terkait, harga lantai promo `ceil(HPP Penuh / (1 − wastePromoMinMargin) / step) × step`, dan batas diskon `max(0, harga − hargaLantai)`. Informasional (tanpa mesin promo).

**FR-RPT-01 [P2] Ekspor CSV** penjualan dan stok.

### 5.8 Kualitas UX (lintas fitur)

**FR-UX-01 [P0] Feedback sistem.** Setiap aksi async punya loading state; setiap mutasi punya toast sukses/gagal; error validasi muncul inline per field; aksi destruktif memakai dialog konfirmasi; ada empty state, halaman 404/500, dan error boundary. Status tidak boleh hanya dibedakan warna (sertakan ikon + teks).

**FR-I18N-01 [P0] Lokalisasi.** UI Bahasa Indonesia sehari-hari tanpa jargon akuntansi; format `id-ID` (Rp, tanggal), zona WIB.

---

## 6. Non-Functional Requirements

| Kategori | Requirement | Target | Verifikasi |
|---|---|---|---|
| Performa API | Respons endpoint baca (backend) | p95 ≤ 500 ms (warm, di luar latensi jaringan) | Log/Vercel analytics, uji manual dengan data seed |
| Performa transaksi | Mutasi umum / checkout (≤ 10 item) | ≤ 1 dtk / ≤ 1,5 dtk | Integration test + pengukuran |
| Performa dashboard | Dengan ±1.300 SaleItem | ≤ 2 dtk | Uji manual |
| Cold start | Request pertama setelah idle (backend + DB) | ≤ 2 dtk dengan instance backend selalu hidup; fallback free tier: tidur 15 menit, bangun ±1 menit → wajib monitor uptime + warm-up sebelum sesi juri | Uji manual |
| Frontend | Lighthouse Mobile (login & dashboard) | Performance ≥ 80, Accessibility ≥ 90, bundle JS awal ≤ 250 KB gzip (route-level code splitting) | Lighthouse CI/manual |
| Konkurensi | Pengguna simultan | ≥ 20 tanpa error; 2 checkout paralel aman | Integration test `Promise.all` |
| Ketersediaan | Uptime selama 19 Okt–14 Nov | ≥ 99%; `/api/health` dipantau tiap 5 menit | Uptime monitor |
| Responsivitas | Lebar 360 / 768 / 1024 / 1440 px | Tanpa scroll horizontal; POS usable di 360 px | Uji manual |
| Browser | Chrome, Firefox, Edge, Safari | Versi stabil terbaru & −1 (batas Tailwind v4: Safari 16.4+, Chrome 111+, Firefox 128+); **login dan sesi wajib lulus di Safari** (cookie lewat proxy origin yang sama) | Matriks uji manual |
| Keamanan | OWASP Top 10 (terbaru), tenant isolation, RBAC, validasi server-side (Zod), hash password oleh library auth, cookie httpOnly+secure, rate limit login, security headers pemeriksaan Origin untuk request non-GET, DTO per peran, tanpa secret di variabel VITE_*, tanpa secret di repo | 0 temuan kritis pada checklist SKILL.md | Security review + test |
| Integritas data | Decimal untuk uang/kuantitas, transaksi ACID, CHECK constraint DB | 0 float untuk uang; 0 stok negatif | Code review + test |
| Maintainability | TypeScript strict, 0 `any`, lint bersih | Coverage `domain/` ≥ 85%, `services/` ≥ 70% | CI |
| Observability | Log server terstruktur tanpa PII/secret, error boundary UI | Ada | Review |
| Privasi | Data demo fiktif | Tanpa data pribadi nyata | Review seed |

---

## 7. Scope

### In-Scope (dikerjakan sekarang)
- **MVP (P0):** Auth + RBAC + tenant isolation, demo mode & seed, bahan + satuan + yield, pembelian/batch + kedaluwarsa, menu + resep + overhead + costing (Bahan/Penuh, Aktual/Pengganti), POS + FEFO atomik, Price Shock Impact + Pusat Peringatan, dashboard dasar, feedback UX, deploy live, README.
- **Target (P1):** kapasitas & bottleneck, Menu Engineering, void transaksi, catat bahan terbuang, riwayat, registrasi + onboarding.
- **Stretch (P2):** Waste Radar, ekspor CSV, E2E smoke test.

### Out-of-Scope (ditunda, masuk *Future Development* proposal)
Integrasi marketplace/e-commerce, WhatsApp API, payment gateway & mutasi bank, multi-outlet & multi-gudang, akuntansi penuh/SAK EMKM & laporan keuangan, HR & payroll, aplikasi mobile native, mode offline/PWA, manajemen supplier & purchase order, perencana belanja otomatis, forecasting/ML, scan barcode, integrasi printer thermal, multi-bahasa, mesin promo otomatis.

**Batasan sistem (untuk proposal):** satu outlet per bisnis; overhead per porsi adalah estimasi pemilik (alokasi rata); pembayaran hanya dicatat; klasifikasi menu bersifat relatif terhadap menu lain.

---

## Lampiran A — Skrip Demo (±4 menit)

Angka berikut adalah data ilustrasi untuk seed, bukan data pasar.

1. Login "Demo Owner" → dashboard menampilkan stok Susu UHT segera kedaluwarsa (batch A, 10 L @ Rp18.000/L, kedaluwarsa H+2).
2. Buka menu **Es Kopi Susu Aren**: HPP Bahan Rp7.740, HPP Penuh Rp8.940, harga Rp18.000. Margin Bahan 57,0%, margin Penuh 50,3% (target 50%, Aman).
3. Input pembelian: Susu UHT 10 L @ Rp24.000/L (kedaluwarsa H+14). Modal dampak muncul: HPP Bahan Rp8.640 (margin 52,0% — tampak aman), HPP Penuh Rp9.840 (**margin 45,3% < 50%** → alert). Opsi A: harga Rp20.000 (margin 50,8%). Opsi B: tahan Rp18.000, HPP harus ≤ Rp9.000, hemat Rp840 = susu 150 → 115 ml. Klik "Terapkan harga rekomendasi".
4. POS: checkout 5 Es Kopi Susu → stok terpotong dari batch A (FEFO) → riwayat menampilkan alokasi batch; laba memakai HPP Aktual.
5. Buka **Menu Engineering**: setelah kenaikan, Es Kopi Susu turun dari STAR ke PLOWHORSE (jika harga belum dinaikkan); setelah harga diterapkan kembali ke STAR.
6. (P2) Waste Radar: batch A sisa stok + saran menu + batas diskon aman.

## Lampiran B — Fixture Deterministik (acuan test & seed)

**Overhead bulanan:** Listrik, gas & air Rp900.000 · Penyusutan alat Rp300.000 · Biaya lain Rp360.000 = Rp1.560.000. `expectedMonthlyPortions = 1300` → **Rp1.200/porsi**. Target margin bisnis 50%, `priceRoundingStep` 500, `expiryWarnDays` 3.

**Bahan (harga per base unit sebelum price shock):** Biji Kopi g 180 · Susu UHT ml 18 · Susu Oat ml 20 · Gula Aren Cair ml 40 · Gula Pasir g 16 · Teh Celup pcs 400 · Bubuk Matcha g 700 · Roti Tawar pcs 1.500 · Mentega g 100 · Meses Coklat g 80 · Croissant Beku pcs 10.500 · Es Batu g 6 · Air Minum ml 0,5 · Cup Set pcs 700 · Kertas Pembungkus pcs 300 · Kotak Kemasan Roti pcs 800.

**Resep Es Kopi Susu Aren (hero):** Biji Kopi 18 g (3.240) + Susu UHT 150 ml (2.700) + Gula Aren 20 ml (800) + Cup Set 1 (700) + Es Batu 50 g (300) = **7.740**; + overhead 1.200 = **8.940**.

**Resep lain (harus menghasilkan HPP Bahan persis, diuji):**
Americano 3.600 (Kopi 14 g + Air 160 ml + Cup 1 + Es 50 g) · Es Teh Manis 2.000 (Teh Celup 2 + Gula Pasir 20 g + Cup 1 + Es 30 g) · Roti Bakar 7.300 (Roti 2 + Mentega 20 g + Meses 25 g + Kertas 1) · Matcha Latte 9.300 (Matcha 8 g + **Susu Oat** 150 ml + Cup 1) · Croissant 11.300 (Croissant Beku 1 + Kotak 1).
> **Susu UHT hanya dipakai Es Kopi Susu Aren** (Matcha memakai Susu Oat) agar fixture konsisten saat price shock.

**Fixture B — Menu Engineering (30 hari, 1.300 porsi):**

| Menu | Harga | HPP Penuh | Margin Kontribusi | Terjual | Kuadran |
|---|---|---|---|---|---|
| Es Kopi Susu Aren | 18.000 | 8.940 | 9.060 | 400 | STAR |
| Americano | 15.000 | 4.800 | 10.200 | 400 | STAR |
| Es Teh Manis | 8.000 | 3.200 | 4.800 | 200 | PLOWHORSE |
| Roti Bakar | 16.000 | 8.500 | 7.500 | 170 | PLOWHORSE |
| Matcha Latte | 22.000 | 10.500 | 11.500 | 80 | PUZZLE |
| Croissant | 20.000 | 12.500 | 7.500 | 50 | DOG |

Ambang populer = 0,7 × (1/6) × 1.300 = **151,67 porsi**. Ambang margin tertimbang = 11.234.000 / 1.300 = **Rp8.641,5**.
Setelah price shock (Susu UHT Rp24/ml): CM Es Kopi Susu = **8.160**, ambang margin = 10.874.000 / 1.300 = **Rp8.364,6** → Es Kopi Susu menjadi **PLOWHORSE**; menu lain tidak berubah. Diskon aman Matcha = 11.500 − 8.642 ≈ **Rp2.800**. Breakeven kenaikan Es Teh Rp1.000 = 1 − 4.800/5.800 ≈ **17,2%**.

**Stok awal & edge case seed:** Susu UHT batch A 10.000 ml @ Rp18/ml kedaluwarsa H+2; Croissant Beku dengan satu batch **sudah kedaluwarsa** (4 pcs) dan satu batch valid; Gula Aren Cair dengan stok di bawah `minStock`. Riwayat 1.300 porsi disebar 30 hari (bobot hari kerja/akhir pekan, RNG ber-seed tetap) **tanpa** StockMovement; stok awal di-seed setelah histori (opening balance).

## Lampiran C — Glosarium
**HPP** harga pokok produksi per porsi · **FEFO** First Expired, First Out · **BOM** Bill of Materials (resep) · **Yield** persentase bahan bersih siap pakai dari bahan beli · **HPP Pengganti** biaya jika bahan dibeli ulang pada harga terbaru · **HPP Aktual** biaya batch yang benar-benar terpakai · **Margin Kontribusi** harga − biaya per porsi (Rp).