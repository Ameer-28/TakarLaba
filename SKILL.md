# SKILL.md — Pustaka Prompt Berulang (Prompt Library)

> Template prompt untuk menjaga konsistensi kualitas. Ganti `[PLACEHOLDER]`. Selalu sertakan konteks: *"Ikuti AGENTS.md, WORKFLOW.md, dan aturan bisnis di PRD.md."*
> Catatan: ini pustaka prompt manual, bukan skill yang dimuat otomatis.

---

## 1. Testing

### T-1 · Unit test fungsi domain (Vitest)
```text
Tulis unit test Vitest untuk `[src/domain/xxx.ts → namaFungsi]`.
Konteks: aturan bisnis [BR-xx dari PRD.md]. Gunakan Decimal (bukan float) dan fixture [A/B] dari PRD Lampiran B.
Wajib mencakup:
- Happy path dengan angka fixture (assert nilai persis, bukan toBeCloseTo).
- Edge cases: input kosong, qty 0/negatif, yield < 100, batch kedaluwarsa, expiry null, pembagian nol, pembulatan HALF_UP.
- Satu test regresi untuk bug: [deskripsi bug, jika ada].
Aturan: tanpa DB/mock Prisma; satu `describe` per fungsi; nama test menjelaskan perilaku ("mengembalikan INSUFFICIENT_DATA bila menu < 4").
Output: file `tests/unit/[nama].test.ts` + hasil `npm run test`.
```

### T-2 · Integration test service (DB nyata)
```text
Tulis integration test untuk `[services/xxx.ts → fungsi]` memakai Postgres test (TEST_DATABASE_URL).
Setup: seed minimal via helper `tests/fixtures`, bersihkan data per test (transaksi/truncate tabel test saja).
Skenario wajib:
1. Happy path end-to-end (cek efek ke tabel terkait: StockBatch, StockMovement, Sale, SaleItem).
2. Rollback: paksa gagal di tengah → verifikasi TIDAK ada perubahan data.
3. Konkurensi: `Promise.all` dua panggilan pada stok terbatas → tepat satu sukses, tidak ada stok negatif.
4. Idempotensi: panggilan kedua dengan idempotencyKey sama → hasil sama, tanpa efek ganda.
5. Tenant isolation: user bisnis lain → NOT_FOUND/FORBIDDEN.
Jangan menyentuh database produksi. Output: file test + ringkasan hasil.
Tambahkan test HTTP (supertest atas createApp()) untuk endpoint terkait: status code, envelope { ok, data | error }.
```

### T-3 · Checklist pengujian per fitur (happy path & edge)
```text
Buat checklist pengujian untuk fitur `[nama fitur / FR-xxx]`. Format tabel: ID | Skenario | Langkah | Hasil diharapkan | Tipe (unit/integration/e2e/manual).
Minimal mencakup:
- Happy path sesuai Acceptance Criteria di PRD.
- Validasi input (kosong, batas min/max, format salah, desimal, string aneh).
- Edge domain khusus proyek:
  FEFO (batch kedaluwarsa hari ini/kemarin, expiry null, batch campur),
  Price shock (harga turun → auto-resolve, pembelian pertama tanpa harga sebelumnya, alert sudah OPEN),
  Menu engineering (data < minimum, menu baru < 14 hari, menu tanpa penjualan, tie di ambang),
  Zona waktu (transaksi 23:30 WIB vs UTC).
- Otorisasi: OWNER vs CASHIER; akses lintas tenant.
- UX: loading, toast sukses/gagal, pesan error per field, empty state, 360 px.
Tandai mana yang sudah ada test otomatisnya.
```

### T-4 · E2E smoke (Playwright, P2)
```text
Tulis test Playwright untuk skrip demo PRD Lampiran A (login Demo Owner → lihat HPP → input pembelian harga naik → verifikasi alert 45,3% & rekomendasi Rp20.000 → checkout 5 Es Kopi Susu → cek stok terpotong → buka Menu Engineering).
Gunakan data seed fixture, selector berbasis role/label (bukan CSS rapuh). Jalankan di viewport 360 dan 1280.
```

---

## 2. Security Review

### S-1 · Prompt audit kode
```text
Lakukan security review untuk `[file/folder/PR]` sebagai penguji penetrasi defensif.
Periksa dan laporkan per temuan: severity (Kritis/Tinggi/Sedang/Rendah), lokasi (file:baris), skenario serangan, perbaikan konkret (diff).
Fokus proyek ini: multi-tenant (businessId), RBAC OWNER/CASHIER, Express routes & middleware, DTO per peran, $queryRaw, same-origin/cookie lewat proxy, demo reset, Better Auth.
Jangan mengubah kode — hanya laporan, kecuali diminta. Gunakan checklist S-2.
```

### S-2 · Checklist audit (kategori OWASP Top 10 — cek versi terbaru)
- **Access control:** semua query terscope `businessId` dari sesi? ID asing → 404? Setiap route memakai requireAuth + requireRole + validate(schema)? Kasir yang memanggil endpoint pemilik → 403? Guard frontend (ProtectedRoute) tidak dianggap otorisasi? Mass assignment: `role`/`businessId` tidak bisa diisi klien?
- **Cryptographic failures & data sensitif:** tidak ada secret di repo/log/respons? Tidak ada secret di variabel `VITE_*`? `BETTER_AUTH_SECRET` kuat? Cookie httpOnly+Secure+SameSite, first-party lewat proxy? Hash password oleh library auth? Data harga beli/HPP tidak bocor ke peran kasir (cek respons API (DTO per peran))?
- **Injection:** `$queryRaw` hanya tagged template? Tidak ada konkatenasi SQL? Output ter-escape (tidak ada `dangerouslySetInnerHTML` dari input user)?
- **Insecure design:** idempotency pada checkout? Batas ukuran (50 item, 30 baris)? Endpoint seed/reset: hanya `DEMO_MODE` + `isDemo` + cooldown? Race condition stok sudah dikunci `FOR UPDATE`?
- **Misconfiguration:** helmet aktif? CORS mati/ketat (tanpa *)? same-origin check untuk non-GET? trust proxy benar? Express.json tidak dipasang sebelum Better Auth? Env produksi ≠ env dev?
- **Vulnerable/outdated components & supply chain:** lockfile ter-commit, npm audit di frontend/ dan backend/; versi Express/Node terbaru, tidak ada dependency tak dikenal.
- **Authentication failures:** rate limit login, pesan error generik (anti enumeration), sesi kedaluwarsa, user nonaktif ditolak.
- **Integrity:** CI wajib hijau sebelum merge; tidak ada skrip build yang mengambil kode eksternal.
- **Logging & monitoring:** log tidak berisi PII/secret; error penting tercatat.
- **Penanganan error:** tidak ada stack trace ke pengguna; error tak terduga → pesan generik + log.
- **SSRF:** tidak ada fetch ke URL yang dikendalikan user.
Output: tabel temuan + daftar "lulus".

---

## 3. Refactoring & Performance

### R-1 · Rapikan duplikasi
```text
Analisis `[folder/file]` untuk kode duplikat/hampir duplikat. Usulkan ekstraksi ke `[domain|lib|components/shared]` tanpa mengubah perilaku.
Aturan: jalankan test sebelum & sesudah; satu commit refactor terpisah dari commit fitur; jangan ubah API publik tanpa izin; pertahankan layering (UI → actions → services → repositories; domain murni).
Output: daftar duplikasi (file:baris), rencana, diff, hasil test.
```

### R-2 · Optimasi query & N+1
```text
Audit performa query untuk `[halaman/service]` (target p95 ≤ 800 ms, dashboard ≤ 2 dtk dengan ±1.300 SaleItem).
Cari: N+1 (loop memanggil Prisma), select berlebih, agregasi di JS yang bisa di SQL, index belum ada.
Berikan: query sebelum/sesudah, `EXPLAIN ANALYZE` bila perlu, usulan index (butuh izin karena ubah skema), dan pengukuran sebelum/sesudah.
```

### R-3 · Performa rendering
```text
Audit [halaman/komponen] React: TanStack Query (staleTime, invalidation tepat, tanpa refetch berlebih), code splitting per route (lazy), re-render berat (daftar menu POS, tabel besar → paginasi/virtualisasi), useMemo/useCallback hanya jika terukur, ukuran bundle (analyzer), font/gambar. Berikan metrik sebelum/sesudah (Lighthouse/React Profiler) dan diff minimal.
```

### R-4 · Hot path domain
```text
Tinjau `[domain/…]` untuk kompleksitas dan alokasi Decimal berlebih. Jaga keluaran identik (test fixture harus tetap lulus). Jangan memakai float demi kecepatan.
```

---

## 4. Documentation

### D-1 · Dokumentasi endpoint di docs/api.md
```text
Dokumentasi endpoint di docs/api.md: Method + Path · Peran · Header (mis. Idempotency-Key) · Request (skema Zod → tabel) · Response envelope · Status & error code · Efek samping (tabel berubah) · BR terkait · contoh curl. Sumber kebenaran = kode.
```

### D-2 · Dokumentasi komponen
```text
Dokumentasikan komponen `[components/features/…]` dengan JSDoc + bagian di docs: tujuan, props (tipe, wajib/opsional, default), state & event, kondisi loading/empty/error, catatan aksesibilitas, contoh pemakaian.
```

### D-3 · ADR (Architecture Decision Record)
```text
Tulis ADR `docs/adr/NNNN-[judul].md`: Konteks · Keputusan · Alternatif yang dipertimbangkan · Konsekuensi · Status · Tanggal. Maksimal 1 halaman.
```

### D-4 · Bagian README
```text
Perbarui README bagian `[Fitur|Instalasi|Env Vars|Arsitektur|Demo]`: ringkas, akurat terhadap kode saat ini, sertakan perintah yang bisa dicopy, daftar env var (tanpa nilai), tautan live, screenshot. Jangan mencantumkan secret.
```

---

## 5. Bonus

### B-1 · Implementasi tugas dari TODO
```text
Kerjakan tugas **[T-xxx]** dari TODO.md.
1) Baca PRD (FR/BR terkait) dan ARCHITECTURE (layer & model). 2) Tulis rencana singkat (file yang disentuh, risiko) dan tunggu persetujuan bila menyentuh area "Ask Permission" di WORKFLOW.md. 3) Implementasikan sesuai layering; domain + test → service → route + validasi → docs/api.md → hook frontend → UI. 4) Pastikan DoD terpenuhi. 5) Update TODO.md dan lapor sesuai template.
```

### B-2 · Perbaikan bug
```text
Bug: [deskripsi + langkah reproduksi + hasil diharapkan vs aktual]. 
Langkah: tulis test yang gagal dulu → temukan akar masalah (bukan tambal gejala) → perbaiki minimal → test hijau → cek efek ke fitur lain → commit `fix(...)` dengan penjelasan akar masalah.
```