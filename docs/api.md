# Dokumentasi API TakarLaba

> Sumber kebenaran kontrak API TakarLaba. Terakhir diperbarui: 2026-10-21.

## 1. Konvensi Envelope Standar

Semua endpoint REST API TakarLaba menggunakan format envelope JSON standar yang konsisten untuk menjaga integritas komunikasi frontend-backend.

### Respons Sukses
```json
{
  "ok": true,
  "data": { ... },
  "meta": { ... }
}
```

### Respons Gagal
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan deskriptif dalam Bahasa Indonesia ramah pengguna",
    "fieldErrors": {
      "fieldName": ["Pesan error validasi spesifik"]
    }
  }
}
```

---

## 2. Tabel Status Code & Error Code

| Status HTTP | Error Code | Deskripsi & Penyebab |
|---|---|---|
| `200 OK` | — | Permintaan sukses dan mengembalikan data payload. |
| `201 Created` | — | Entitas baru berhasil dibuat (misal checkout, registrasi bahan). |
| `204 No Content` | — | Permintaan sukses tanpa body respons (misal hapus entitas). |
| `400 Bad Request` | `BAD_REQUEST` | Sintaks request tidak valid atau malformed JSON payload. |
| `400 Bad Request` | `VALIDATION_ERROR` | Skema validasi Zod gagal pada body, query, atau params. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Pengguna belum terautentikasi atau sesi telah kedaluwarsa. |
| `403 Forbidden` | `FORBIDDEN` | Akses ditolak karena role pengguna tidak mencukupi (mis. kasir mengakses data biaya). |
| `404 Not Found` | `NOT_FOUND` | Rute atau entitas yang diminta tidak ditemukan. |
| `409 Conflict` | `CONFLICT` | Konflik integritas data (mis. SKU atau nama bahan duplikat). |
| `409 Conflict` | `INSUFFICIENT_STOCK` | Stok bahan batch FEFO tidak mencukupi saat proses checkout POS. |
| `413 Payload Too Large` | `PAYLOAD_TOO_LARGE` | Body permintaan melebihi batas 100kb. |
| `429 Too Many Requests` | `RATE_LIMITED` | Batas laju permintaan tercapai (rate limiter). |
| `500 Internal Server Error` | `INTERNAL_ERROR` | Kesalahan tidak terduga pada server backend. |
| `503 Service Unavailable` | `DATABASE_UNAVAILABLE` | Database PostgreSQL tidak terjangkau atau gagal merespons query. |

---

## 3. Endpoint Terpasang

### GET `/api/health`
Memeriksa status operasional server dan konektivitas database PostgreSQL.

- **Metode:** `GET`
- **Autentikasi:** Publik (tanpa autentikasi)
- **Header:** Tidak ada
- **Request Body:** Tidak ada
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "status": "ok",
      "db": "ok"
    }
  }
  ```
- **Response 503 Service Unavailable:**
  ```json
  {
    "ok": false,
    "error": {
      "code": "DATABASE_UNAVAILABLE",
      "message": "Layanan database tidak tersedia"
    }
  }
  ```
- **Contoh Permintaan:**
  ```bash
  curl -s -X GET https://<frontend-domain>/api/health
  ```

---

## 4. Kontrak Direncanakan (Roadmap Fitur)

### POST `/api/sales` (Checkout POS)
Memproses transaksi kasir atomik dengan pemotongan stok batch FEFO, verifikasi margin, dan snapshot biaya.

- **Metode:** `POST`
- **Autentikasi:** Wajib sesi aktif (`OWNER` atau `CASHIER`)
- **Header Khusus:**
  - `Idempotency-Key: <uuid>` (wajib): Mencegah double deduction stok bila terjadi network retry.
- **Request Body:**
  ```json
  {
    "items": [
      {
        "menuId": "menu_clx1234567890",
        "quantity": 2
      }
    ],
    "paymentMethod": "CASH",
    "amountPaid": "50000"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "ok": true,
    "data": {
      "saleId": "sale_clx0987654321",
      "totalAmount": "36000",
      "change": "14000",
      "createdAt": "2026-10-21T13:00:00.000Z"
    }
  }
  ```
- **Aturan Bisnis (BR):**
  - Pemotongan stok batch FEFO (`BR-FEFO-01`): Batch dengan kedaluwarsa terdekat dipotong lebih dulu menggunakan lock `SELECT ... FOR UPDATE`.
  - Jika stok kurang: Rollback transaksi atomik dan kembalikan `409 INSUFFICIENT_STOCK`.
  - DTO untuk `CASHIER` tidak boleh memuat field HPP atau margin keuntungan.
