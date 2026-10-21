# ADR 0002: Hosting Backend Express di Vercel Functions (Serverless Dual-Mode)

- **Status:** Diterima
- **Tanggal:** 2026-10-21
- **Pembuat:** Tim Pengembang TakarLaba
- **Konteks Terkait:** `AGENTS.md` §1, `ARCHITECTURE.md` §1 & §7, ADR 0001

---

## Konteks & Permasalahan

Awalnya backend REST API TakarLaba direncanakan untuk di-deploy ke Render (free tier atau Starter tier kecil). Namun:

1. Layanan web service Render saat ini memerlukan informasi penagihan (kartu kredit) bahkan untuk memulai instance.
2. Free tier Render memiliki perilaku _spin-down_ saat idle setelah 15 menit, menyebabkan _cold start_ 50+ detik yang mengganggu evaluasi juri kompetisi GTNIC 2026.
3. Tim membutuhkan lingkungan deployment produksi yang andal, tanpa biaya awal kartu kredit, dan terintegrasi langsung dengan repository GitHub.

Vercel mendukung deployment zero-config untuk framework backend Express melalui Vercel Serverless Functions pada project terpisah (Root Directory = `backend`, Hobby plan).

## Keputusan

Kami memutuskan untuk mengadopsi arsitektur **Dual-Mode Backend**:

1. **Mode Vercel Serverless Function (Produksi Vercel):**
   - Entry point di `backend/src/index.ts` mengekspor instance Express secara default (`export default createApp()`).
   - Tanpa pemanggilan `app.listen()` atau listener sinyal proses (`process.on`).
   - Vercel mendeteksi `backend/src/index.ts` secara otomatis sebagai serverless handler.
   - Konfigurasi region di `backend/vercel.json` disetel ke `["sin1"]` (Singapura), berdekatan dengan database Neon (`ap-southeast-1`).
2. **Mode Standalone Long-Lived Process (Lokal & VPS Fallback):**
   - Runner di `backend/src/standalone.ts` mengimpor `createApp()`, memanggil `app.listen(PORT)`, dan menangani _graceful shutdown_ (`SIGINT`/`SIGTERM`) untuk koneksi HTTP, Prisma, dan PostgreSQL pool.
   - Script `npm run dev` (`tsx watch src/standalone.ts`) dan `npm start` (`node dist/standalone.js`).
3. **Koneksi Database Ramah Serverless:**
   - Menggunakan `@prisma/adapter-pg` dengan `pg.Pool` terkonfigurasi: `max: 5`, `idleTimeoutMillis: 10_000`, dan `connectionTimeoutMillis: 5_000`.
   - Menghindari background timers/interval agar proses function dapat idle dan terminate secara bersih.

## Konsekuensi

### Positif

- **Zero Cost & No Billing Blocker:** Dapat di-deploy di Vercel Hobby plan tanpa hambatan kartu kredit.
- **Latensi Rendah:** Backend di region `sin1` (Singapura) berada di region yang sama dengan database Neon (`ap-southeast-1`).
- **Portabilitas Tinggi:** Dual-mode memastikan aplikasi tetap dapat dijalankan sebagai proses server tradisional di VPS, Docker, atau Render bila diperlukan di masa mendatang tanpa perubahan kode.

### Negatif / Mitigasi

- **In-Memory State Bersifat Instance-Scoped:** Stateful logic berbasis memori lokal (seperti `MemoryStore` pada `express-rate-limit`) hanya berlaku per container function dan di-reset saat cold start.
  - _Mitigasi:_ Sesi pengguna dikelola oleh Better Auth dan disimpan secara persisten di database PostgreSQL (tabel `session`). Untuk pembatasan laju ketat terdistribusi di kemudian hari, dapat dihubungkan ke Upstash/Redis atau edge firewall Vercel.
- **Eksekusi Dibatasi Timeout:** Vercel Hobby plan membatasi eksekusi function hingga 10–15 detik per request.
  - _Mitigasi:_ Seluruh transaksi OLTP TakarLaba (checkout POS atomik, costing) ditargetkan selesai dalam sub-detik (< 500 ms).
- **Kerapuhan Bundle & Outside-Root Files:** Prisma engine dan file skema di luar direktori root backend (`../database`) memerlukan perhatian saat bundling.
  - _Mitigasi:_ Generator Prisma disetel ke output ESM lokal (`backend/src/generated/prisma`).

## Rencana Cadangan (Plan B)

Jika batasan serverless Vercel (ukuran bundle Prisma, koneksi pooler, atau durasi eksekusi) menjadi kendala tak terduga:

1. **Plan B1 (VPS / Container):** Deploy `dist/standalone.js` ke VPS mandiri (misal Fly.io, Railway, atau VPS pribadi) menggunakan Docker Compose.
2. **Plan B2 (Render Berbayar):** Jika akun Render dengan metode pembayaran tersedia, deploy ke Render menggunakan script `standalone.ts` tanpa mengubah kode aplikasi.
