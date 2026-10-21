# ADR 0001: Arsitektur Single-Origin dengan Reverse Proxy API

- **Status:** Diterima
- **Tanggal:** 2026-10-21
- **Pembuat:** Tim Pengembang TakarLaba
- **Konteks Terkait:** `AGENTS.md` §1, `ARCHITECTURE.md` §1 & §7

---

## Konteks & Permasalahan

Aplikasi TakarLaba menggunakan arsitektur decoupled: antarmuka pengguna berbasis React Single Page Application (SPA) yang dihosting di Vercel, dan backend REST API berbasis Node.js Express yang dihosting di Render/VPS.

Dalam browser modern (khususnya Safari di iOS dan macOS dengan Intelligent Tracking Prevention / ITP):
1. Cookie sesi lintas domain (*cross-site / third-party cookies*) diblokir secara ketat secara default.
2. Mekanisme CORS dengan kredensial lintas origin rentan terhadap pemblokiran cookie saat navigasi dan refresh.
3. Mengharuskan pengguna menyimpan token di `localStorage` melanggar aturan keamanan dan standar kompetisi GTNIC karena rentan terhadap serangan Cross-Site Scripting (XSS).

## Keputusan

Kami memutuskan untuk mengadopsi **arsitektur single-origin** menggunakan fitur rewrite pada CDN Vercel:
- Frontend Vercel mengonfigurasi `frontend/vercel.json` dengan aturan rewrite:
  ```json
  {
    "rewrites": [
      { "source": "/api/:path*", "destination": "https://<backend-host>/api/:path*" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- Browser pengguna hanya berinteraksi langsung dengan domain frontend (misal `https://takarlaba.vercel.app`).
- Semua request API dikirimkan ke path relatif `/api/*` pada origin yang sama.
- Cookie sesi autentikasi (Better Auth) diterbitkan sebagai cookie **first-party** dengan atribut `HttpOnly`, `Secure`, dan `SameSite=Lax`.

## Konsekuensi

### Positif
- **Kompatibilitas Penuh:** Cookie sesi first-party berfungsi tanpa hambatan di Safari (iOS & macOS), Chrome, Edge, dan Firefox.
- **Bebas Masalah CORS:** Karena browser hanya berinteraksi dengan satu origin, kerumitan preflight OPTIONS CORS dapat dieliminasi pada browser klien.
- **Keamanan Lebih Tinggi:** Token sesi tidak pernah terekspos ke JavaScript klien (`localStorage` / `sessionStorage`).

### Negatif / Tantangan
- **Hop Tambahan:** Terdapat latensi tambahan (estimasi 5–15 ms) karena request melewati Vercel Edge proxy sebelum menuju host backend.
- **Konfigurasi Trust Proxy:** Host backend Express wajib mengonfigurasi `app.set("trust proxy", ...)` untuk mengenali header `x-forwarded-for` dan `x-forwarded-proto` yang diteruskan Vercel.

## Rencana Cadangan (Plan B)

Jika rewrite proxy Vercel mengalami kendala teknis atau latensi berlebih di kemudian hari:
1. **Opsi 1 (Domain Kustom Bersama):** Menggunakan domain kustom yang sama (misalnya `app.takarlaba.com` untuk frontend dan `api.takarlaba.com` untuk backend) dengan cookie scoped ke `.takarlaba.com`.
2. **Opsi 2 (Bearer Token Fallback):** Menggunakan otentikasi header `Authorization: Bearer <token>` yang disimpan di memori runtime klien (bukan di storage persisten browser).
