# Dokumentasi API TakarLaba

> Sumber kebenaran kontrak API TakarLaba. Terakhir diperbarui: 2026-10-22 (Fase 2: Bahan Baku, Pembelian, & Persediaan FEFO).

## 1. Konvensi Envelope Standar

Semua endpoint REST API TakarLaba menggunakan format envelope JSON standar yang konsisten untuk menjaga integritas komunikasi frontend-backend. Nilai uang dan kuantitas selalu dikirimkan sebagai **string** atau **angka terformat** untuk mencegah floating-point rounding issue (aturan domain TakarLaba).

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
| `201 Created` | — | Entitas baru berhasil dibuat (misal pendaftaran bahan, nota belanja). |
| `204 No Content` | — | Permintaan sukses tanpa body respons. |
| `400 Bad Request` | `BAD_REQUEST` | Sintaks request tidak valid atau malformed JSON payload. |
| `400 Bad Request` | `VALIDATION_ERROR` | Skema validasi Zod gagal pada body, query, atau params. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Pengguna belum terautentikasi atau sesi telah kedaluwarsa. |
| `403 Forbidden` | `FORBIDDEN` | Akses ditolak karena role pengguna tidak mencukupi (mis. kasir mengakses data biaya/pembelian). |
| `404 Not Found` | `NOT_FOUND` | Rute atau entitas yang diminta tidak ditemukan. |
| `409 Conflict` | `CONFLICT` | Konflik integritas data (mis. nama bahan baku duplikat, atau menonaktifkan bahan yang terikat menu aktif). |
| `409 Conflict` | `INSUFFICIENT_STOCK` | Stok bahan batch FEFO tidak mencukupi saat proses checkout POS. |
| `413 Payload Too Large` | `PAYLOAD_TOO_LARGE` | Body permintaan melebihi batas 100kb. |
| `429 Too Many Requests` | `RATE_LIMITED` | Batas laju permintaan tercapai (rate limiter). |
| `500 Internal Server Error` | `INTERNAL_ERROR` | Kesalahan tidak terduga pada server backend (detail disembunyikan dari klien). |
| `503 Service Unavailable` | `DATABASE_UNAVAILABLE` | Database PostgreSQL tidak terjangkau atau gagal merespons query. |

---

## 3. Endpoint Terpasang

### 3.1 Sistem & Diagnostik

#### GET `/api/health`
Memeriksa status operasional server dan konektivitas database PostgreSQL.

- **Metode:** `GET`
- **Autentikasi:** Publik
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

---

### 3.2 Master Bahan Baku (`/api/ingredients`)

#### GET `/api/ingredients`
Mengambil daftar bahan baku milik tenant bisnis yang aktif atau terfilter.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif (`OWNER` atau `CASHIER`)
- **Query Params:**
  - `category` (opsional): `"MAIN"` | `"SUPPORT"` | `"PACKAGING"`
  - `search` (opsional): string kata kunci pencarian nama bahan
  - `isActive` (opsional): boolean (`"true"` | `"false"`)
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "ing_clx123",
        "businessId": "biz_demo_1",
        "name": "Kopi Arabika",
        "nameKey": "kopi arabika",
        "category": "MAIN",
        "baseUnit": "G",
        "yieldPercent": "100.00",
        "minStockBase": "500.000",
        "isPerishable": false,
        "isActive": true,
        "createdAt": "2026-10-22T08:00:00.000Z",
        "updatedAt": "2026-10-22T08:00:00.000Z",
        "units": [
          {
            "id": "unit_kg_1",
            "ingredientId": "ing_clx123",
            "name": "kg",
            "toBaseFactor": "1000.000"
          }
        ]
      }
    ]
  }
  ```

#### GET `/api/ingredients/:id`
Mengambil detail bahan baku spesifik beserta daftar satuan konversinya.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif (`OWNER` atau `CASHIER`)
- **Params:** `id` (string UUID / CUID bahan)
- **Response 200 OK:** Data objek `Ingredient` tunggal.
- **Response 404 NOT_FOUND:**
  ```json
  {
    "ok": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Bahan baku tidak ditemukan"
    }
  }
  ```

#### POST `/api/ingredients`
Mendaftarkan bahan baku kuliner baru, opsional menyertakan konversi satuan beli awal.

- **Metode:** `POST`
- **Autentikasi:** `OWNER` saja (`CASHIER` menerima `403 FORBIDDEN`)
- **Request Body:**
  ```json
  {
    "name": "Ayam Broiler Fillet",
    "category": "MAIN",
    "baseUnit": "G",
    "yieldPercent": 70,
    "minStockBase": 2000,
    "isPerishable": true,
    "purchaseUnits": [
      {
        "name": "kg",
        "toBaseFactor": 1000
      }
    ]
  }
  ```
- **Validasi Zod:**
  - `name`: 2..80 karakter (nama dinormalisasi ke `nameKey` lowercase)
  - `category`: `"MAIN"` | `"SUPPORT"` | `"PACKAGING"`
  - `baseUnit`: `"G"` | `"ML"` | `"PCS"`
  - `yieldPercent`: 1..100 (persentase porsi dapat dipakai setelah trimming/cooking, BR-02)
  - `minStockBase`: >= 0 (ambang batas stok rendah)
  - `isPerishable`: boolean (jika true, setiap batch wajib menyertakan tanggal kedaluwarsa)
- **Response 201 Created:** Data bahan baku yang baru dibuat.
- **Response 409 CONFLICT:** Nama bahan sudah terdaftar pada bisnis yang sama.

#### PATCH `/api/ingredients/:id`
Memperbarui informasi master bahan baku (nama, kategori, yield %, minStock, status mudah rusak).

- **Metode:** `PATCH`
- **Autentikasi:** `OWNER` saja
- **Params:** `id` (string)
- **Request Body:** Field yang ingin diubah (semua opsional).
- **Response 200 OK:** Objek bahan yang telah diperbarui.

#### DELETE `/api/ingredients/:id`
Menonaktifkan bahan baku secara aman (soft-delete). Dicegah jika bahan sedang digunakan pada menu aktif.

- **Metode:** `DELETE`
- **Autentikasi:** `OWNER` saja
- **Params:** `id` (string)
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "id": "ing_clx123",
      "isActive": false
    }
  }
  ```
- **Response 409 CONFLICT:**
  ```json
  {
    "ok": false,
    "error": {
      "code": "CONFLICT",
      "message": "Bahan tidak dapat dinonaktifkan karena masih digunakan pada menu aktif: Kopi Susu Aren"
    }
  }
  ```

#### POST `/api/ingredients/:id/units`
Menambahkan konversi satuan beli baru untuk bahan baku terkait.

- **Metode:** `POST`
- **Autentikasi:** `OWNER` saja
- **Request Body:**
  ```json
  {
    "name": "karton",
    "toBaseFactor": 24000
  }
  ```
- **Response 201 Created:** Objek satuan konversi yang tersimpan.

#### DELETE `/api/ingredients/:id/units/:unitId`
Menghapus satuan konversi beli dari bahan baku.

- **Metode:** `DELETE`
- **Autentikasi:** `OWNER` saja
- **Response 200 OK:** `{ "ok": true, "data": { "success": true } }`

---

### 3.3 Pembelian Bahan Baku Multi-Baris (`/api/purchases`)

#### POST `/api/purchases`
Mencatat nota pembelian multi-baris secara atomik. Otomatis membuat entitas `Purchase`, entitas `StockBatch` untuk setiap baris barang, dan entitas `StockMovement` bertipe `PURCHASE` (FR-PUR-01). Seluruh operasi berjalan di dalam database transaction (`prisma.$transaction`). Jika satu baris gagal, seluruh nota dibatalkan tanpa jejak parsial.

- **Metode:** `POST`
- **Autentikasi:** `OWNER` saja (`CASHIER` dilarang mengakses data biaya sesuai Rule 7)
- **Request Body:**
  ```json
  {
    "supplierName": "Toko Bahan Makmur",
    "note": "Belanja mingguan",
    "purchasedAt": "2026-10-22T08:30:00.000Z",
    "items": [
      {
        "ingredientId": "ing_kopi_123",
        "purchaseQty": "2",
        "purchaseUnit": "kg",
        "purchaseUnitPrice": "120000.00",
        "expiryDate": null
      },
      {
        "ingredientId": "ing_susu_456",
        "purchaseQty": "10",
        "purchaseUnit": "liter",
        "purchaseUnitPrice": "18000.00",
        "expiryDate": "2026-11-05"
      }
    ]
  }
  ```
- **Aturan Bisnis & Validasi:**
  - `purchasedAt`: Maksimal H+1 WIB dari hari ini (mencegah input tanggal masa depan yang keliru).
  - `items`: Minimal 1 baris barang, maksimal 100 baris.
  - `purchaseUnit`: Harus cocok dengan `baseUnit` bahan atau salah satu satuan konversi yang telah didaftarkan.
  - `expiryDate`: Wajib diisi jika bahan berstatus `isPerishable: true`, dan tanggalnya tidak boleh sebelum hari ini (WIB).
  - `costPerBase`: Dihitung otomatis sebagai `purchaseUnitPrice / toBaseFactor` dengan presisi 6 desimal (HALF_UP).
  - `initialQtyBase` & `remainingQtyBase`: Dihitung otomatis sebagai `purchaseQty * toBaseFactor` dengan presisi 3 desimal.
- **Response 201 Created:**
  ```json
  {
    "ok": true,
    "data": {
      "id": "purch_clx789",
      "businessId": "biz_demo_1",
      "supplierName": "Toko Bahan Makmur",
      "note": "Belanja mingguan",
      "purchasedAt": "2026-10-22T08:30:00.000Z",
      "totalAmount": "420000.00",
      "batches": [
        {
          "id": "batch_1",
          "ingredientId": "ing_kopi_123",
          "purchaseQty": "2.000",
          "purchaseUnit": "kg",
          "purchaseUnitPrice": "120000.00",
          "initialQtyBase": "2000.000",
          "remainingQtyBase": "2000.000",
          "costPerBase": "120.000000",
          "expiryDate": null,
          "ingredient": {
            "id": "ing_kopi_123",
            "name": "Kopi Arabika",
            "baseUnit": "G",
            "category": "MAIN"
          }
        }
      ]
    }
  }
  ```

#### GET `/api/purchases`
Mengambil riwayat nota belanja dengan paginasi dan filter tanggal.

- **Metode:** `GET`
- **Autentikasi:** `OWNER` saja
- **Query Params:**
  - `startDate` (opsional): filter tanggal awal (`YYYY-MM-DD`)
  - `endDate` (opsional): filter tanggal akhir (`YYYY-MM-DD`)
  - `supplier` (opsional): nama pemasok
  - `page` (opsional, default: 1)
  - `limit` (opsional, default: 20)
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": [ ... ],
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```

#### GET `/api/purchases/:id`
Mengambil rincian satu nota pembelian lengkap dengan item batch yang dihasilkan.

- **Metode:** `GET`
- **Autentikasi:** `OWNER` saja
- **Params:** `id` (string UUID / CUID pembelian)
- **Response 200 OK:** Objek nota pembelian tunggal.

---

### 3.4 Persediaan & Stok Batch FEFO (`/api/inventory`)

#### GET `/api/inventory/summary`
Mengambil ringkasan persediaan untuk seluruh bahan baku, mengagregasikan stok valid (belum kedaluwarsa), stok kedaluwarsa, status kesegaran FEFO, status batas stok minimum, dan rata-rata biaya per unit dasar.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif (`OWNER` atau `CASHIER`)
- **Query Params:**
  - `warnDays` (opsional, integer 0..30, default: 3): Ambang hari sebelum kedaluwarsa untuk memicu status `SEGERA`. Nilai non-integer atau di luar 0..30 menghasilkan 400 `VALIDATION_ERROR`.
- **Aturan Otorisasi Peran (Rule 7):**
  - Jika pemanggil adalah `CASHIER`, field biaya (`averageCostPerBase`, `latestCostPerBase`) dihapus dari respons JSON untuk mencegah kebocoran margin rahasia dapur.
- **Logika Status Bahan:**
  - `HABIS`: `validStockBase <= 0` dan tidak ada stok kedaluwarsa tersisa.
  - `KEDALUWARSA`: Terdapat batch yang tanggal kedaluwarsanya `< hari ini (WIB)`.
  - `SEGERA`: Batch terdekat akan kedaluwarsa dalam rentang `warnDays` hari (mis. 3 hari).
  - `AMAN`: Seluruh stok masih segar di atas rentang `warnDays`.
  - `isLowStock`: `validStockBase < minStockBase` (peringatan restock segera).
- **Response 200 OK (OWNER):**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "ing_kopi_123",
        "name": "Kopi Arabika",
        "category": "MAIN",
        "baseUnit": "G",
        "yieldPercent": "100.00",
        "minStockBase": "500.000",
        "isPerishable": false,
        "validStockBase": "2000.000",
        "expiredStockBase": "0.000",
        "totalBatchesCount": 1,
        "nearestExpiryDate": null,
        "status": "AMAN",
        "isLowStock": false,
        "averageCostPerBase": "120.000000",
        "latestCostPerBase": "120.000000"
      }
    ]
  }
  ```
- **Response 200 OK (CASHIER):**
  Field `averageCostPerBase` dan `latestCostPerBase` **tidak disertakan** di dalam respons.

#### GET `/api/inventory/batches`
Mengambil daftar batch stok aktif (`remainingQtyBase > 0`), diurutkan secara ketat berdasarkan aturan **FEFO** (First Expired, First Out):
1. Batch dengan `expiryDate` terdekat dialokasikan pertama.
2. Batch dengan `expiryDate = null` (bahan tahan lama) ditempatkan setelah bahan berkedaluwarsa, diurutkan berdasarkan tanggal penerimaan `receivedAt ASC` (FIFO fallback).

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif (`OWNER` atau `CASHIER`)
- **Query Params:**
  - `warnDays` (opsional, integer 0..30, default: 3): Ambang hari sebelum kedaluwarsa untuk status `SEGERA`.
  - `ingredientId` (opsional): filter batch untuk bahan tertentu
  - `hasRemainingOnly` (opsional, boolean string, default: true): hanya ambil batch yang memiliki sisa stok (`remainingQtyBase > 0`).
- **Aturan Otorisasi Peran (Rule 7):**
  - Jika pemanggil adalah `CASHIER`, field `costPerBase` dan `purchaseUnitPrice` dihapus dari respons.
- **Response 200 OK (OWNER):**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "batch_susu_1",
        "ingredientId": "ing_susu_456",
        "ingredientName": "Susu Segar",
        "baseUnit": "ML",
        "category": "MAIN",
        "receivedAt": "2026-10-22T08:00:00.000Z",
        "expiryDate": "2026-10-24",
        "remainingQtyBase": "5000.000",
        "initialQtyBase": "5000.000",
        "purchaseUnit": "liter",
        "purchaseQty": "5.000",
        "purchaseUnitPrice": "18000.00",
        "costPerBase": "18.000000",
        "supplierName": "Peternakan Sejahtera",
        "status": "SEGERA"
      }
    ]
  }
  ```

---

### 3.5 Pengaturan Usaha & Biaya Overhead (`/api/settings` & `/api/overheads`)

#### GET `/api/settings`
Mengambil konfigurasi target margin, rounding step, expected monthly portions, dan overhead per porsi usaha.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif role `OWNER` (role `CASHIER` menerima `403 FORBIDDEN`).
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "id": "set_123",
      "businessId": "biz_123",
      "targetMarginPercent": "60.00",
      "targetMarginMinPercent": "55.00",
      "roundingStep": 500,
      "overheadPerPortion": "1200.00",
      "expectedMonthlyPortions": 1000,
      "warnDays": 3,
      "createdAt": "2026-10-22T08:00:00.000Z",
      "updatedAt": "2026-10-22T08:00:00.000Z"
    }
  }
  ```

#### PATCH `/api/settings`
Memperbarui konfigurasi parameter target margin atau estimasi porsi bulanan.

- **Metode:** `PATCH`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:**
  ```json
  {
    "targetMarginPercent": "65.00",
    "targetMarginMinPercent": "60.00",
    "roundingStep": 500,
    "expectedMonthlyPortions": 1200,
    "warnDays": 5
  }
  ```
- **Response 200 OK:** Mengembalikan data settings terbaru.

#### GET `/api/overheads`
Mengambil daftar beban overhead bulanan beserta ringkasan kalkulasi beban per porsi (`BR-04`).

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Query Params:**
  - `isActive` (opsional, boolean string): memfilter hanya beban aktif atau nonaktif.
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "items": [
        {
          "id": "ovh_123",
          "businessId": "biz_123",
          "name": "Sewa Tempat",
          "type": "RENT",
          "monthlyCost": "1500000.00",
          "isActive": true,
          "notes": "Ruko bulanan",
          "createdAt": "2026-10-22T08:00:00.000Z",
          "updatedAt": "2026-10-22T08:00:00.000Z"
        }
      ],
      "summary": {
        "totalActiveMonthlyCost": "1500000.00",
        "expectedMonthlyPortions": 1000,
        "overheadPerPortion": "1500.00"
      }
    }
  }
  ```

#### POST `/api/overheads`
Mendaftarkan beban overhead bulanan baru.

- **Metode:** `POST`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:**
  ```json
  {
    "name": "Listrik & Air",
    "type": "ELECTRICITY_WATER",
    "monthlyCost": "350000",
    "isActive": true,
    "notes": "Token bulanan rata-rata"
  }
  ```
- **Response 201 Created:** Mengembalikan record overhead yang dibuat.

#### PATCH `/api/overheads/:id`
Memperbarui rincian beban overhead bulanan.

- **Metode:** `PATCH`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:** Parsial dari field `POST /api/overheads`.
- **Response 200 OK:** Mengembalikan record overhead terupdate.

#### DELETE `/api/overheads/:id`
Menghapus beban overhead bulanan.

- **Metode:** `DELETE`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "id": "ovh_123"
    }
  }
  ```

---

### 3.6 Master Menu (`/api/menus`)

#### GET `/api/menus`
Mengambil daftar menu milik tenant bisnis beserta status resep dan indikasi jumlah takaran.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif role `OWNER` (role `CASHIER` menerima `403 FORBIDDEN`; kasir menggunakan endpoint `/api/pos/menus`).
- **Query Params:**
  - `category` (opsional): filter kategori menu (mis. `"Makanan"`, `"Minuman"`)
  - `search` (opsional): kata kunci pencarian nama menu (case-insensitive)
  - `isActive` (opsional, boolean string): `"true"` atau `"false"`
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "menu_clx123",
        "businessId": "biz_123",
        "name": "Kopi Susu Gula Aren",
        "nameKey": "kopi susu gula aren",
        "category": "Minuman",
        "sellingPrice": "18000.00",
        "targetMargin": "60.00",
        "isActive": true,
        "hasRecipe": true,
        "recipeItemsCount": 3,
        "saleItemsCount": 12,
        "createdAt": "2026-10-22T08:00:00.000Z",
        "updatedAt": "2026-10-22T08:00:00.000Z"
      }
    ]
  }
  ```

#### GET `/api/menus/:id`
Mengambil detail menu lengkap beserta daftar takaran resep dan riwayat perubahan harga jual.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "id": "menu_clx123",
      "businessId": "biz_123",
      "name": "Kopi Susu Gula Aren",
      "nameKey": "kopi susu gula aren",
      "category": "Minuman",
      "sellingPrice": "18000.00",
      "targetMargin": "60.00",
      "isActive": true,
      "hasRecipe": true,
      "recipeItemsCount": 3,
      "saleItemsCount": 12,
      "recipeItems": [
        {
          "id": "rcp_1",
          "menuId": "menu_clx123",
          "ingredientId": "ing_kopi_123",
          "ingredientName": "Biji Kopi House Blend",
          "baseUnit": "G",
          "category": "MAIN",
          "yieldPercent": "100.00",
          "isIngredientActive": true,
          "qtyUsableBase": "18.000",
          "createdAt": "2026-10-22T08:00:00.000Z"
        }
      ],
      "priceHistories": [
        {
          "id": "mph_1",
          "oldPrice": "15000.00",
          "newPrice": "18000.00",
          "reason": "MANUAL",
          "alertId": null,
          "changedById": "usr_owner_1",
          "changedByName": "Owner Budi",
          "changedAt": "2026-10-22T09:00:00.000Z"
        }
      ],
      "createdAt": "2026-10-22T08:00:00.000Z",
      "updatedAt": "2026-10-22T09:00:00.000Z"
    }
  }
  ```

#### POST `/api/menus`
Mendaftarkan menu baru dalam katalog usaha.

- **Metode:** `POST`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:**
  ```json
  {
    "name": "Roti Panggang Cokelat",
    "category": "Makanan",
    "sellingPrice": 15000,
    "targetMargin": 50,
    "isActive": true
  }
  ```
- **Validasi (`FR-MENU-01`):**
  - `name`: 2-100 karakter, unik per tenant bisnis (case-insensitive & spasi dinormalisasi).
  - `sellingPrice`: > 0 dan <= 100.000.000.
  - `targetMargin`: opsional (0-95%), jika kosong mengikuti target margin default usaha.
- **Response 201 Created:** Mengembalikan record menu baru.

#### PATCH `/api/menus/:id`
Memperbarui informasi menu atau mengubah harga jual.

- **Metode:** `PATCH`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:** Parsial dari field `POST /api/menus`.
- **Aturan Bisnis:**
  - Jika harga jual (`sellingPrice`) berubah dari harga sebelumnya, sistem secara atomik mencatat riwayat ke tabel `MenuPriceHistory` dengan `reason = "MANUAL"` dan mencatat user ID yang melakukan perubahan.
- **Response 200 OK:** Mengembalikan record menu terupdate.

#### DELETE `/api/menus/:id`
Menghapus menu dari katalog usaha.

- **Metode:** `DELETE`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Aturan Integritas Data:**
  - Jika menu belum pernah memiliki riwayat transaksi penjualan (`saleItemsCount === 0`), menu dihapus secara permanen.
  - Jika menu sudah pernah terjual (`saleItemsCount > 0`), penghapusan ditolak dengan `409 CONFLICT` untuk menjaga integritas data historis; pengguna diarahkan untuk menonaktifkan status menu.
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "id": "menu_clx123"
    }
  }
  ```

#### POST `/api/menus/preview-cost`
Melakukan kalkulasi live costing dan margin dari draf resep secara instan (tanpa menyimpan ke basis data). Mendukung debouncing 300 ms di frontend (ADR-3).

- **Metode:** `POST`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:**
  ```json
  {
    "menuId": "menu_clx123",
    "sellingPrice": 18000,
    "targetMargin": 50,
    "items": [
      {
        "ingredientId": "ing_kopi_123",
        "qtyUsable": 18,
        "unitName": "G"
      },
      {
        "ingredientId": "ing_susu_456",
        "qtyUsable": 150,
        "unitName": "ml"
      }
    ]
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "data": {
      "hppBahan": "5940.00",
      "overheadPerPortion": "1200.00",
      "hppPenuh": "7140.00",
      "sellingPrice": "18000.00",
      "marginKontribusi": "10860.00",
      "marginPercent": "60.33",
      "marginBahanPercent": "67.00",
      "marginStatus": "AMAN",
      "isCostComplete": true,
      "items": [
        {
          "ingredientId": "ing_kopi_123",
          "ingredientName": "Biji Kopi House Blend",
          "baseUnit": "G",
          "inputUnit": "G",
          "toBaseFactor": "1.0000",
          "qtyUsable": "18.000",
          "yieldPercent": "100.00",
          "costPerBase": "180.000000",
          "costPerUsable": "180.000000",
          "subtotal": "3240.00",
          "hasCost": true
        }
      ]
    }
  }
  ```

#### PUT `/api/menus/:id/recipe`
Menyimpan takaran resep untuk menu tertentu.

- **Metode:** `PUT`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Request Body:**
  ```json
  {
    "items": [
      {
        "ingredientId": "ing_kopi_123",
        "qtyUsable": 18,
        "unitName": "G"
      },
      {
        "ingredientId": "ing_susu_456",
        "qtyUsable": 150,
        "unitName": "ML"
      }
    ]
  }
  ```
- **Validasi (`FR-REC-01`):**
  - Minimal 1 bahan, maksimal 30 bahan.
  - Takaran `qtyUsable > 0`.
  - Tidak boleh ada bahan baku duplikat dalam satu menu.
  - Bahan nonaktif ditolak dengan `400 VALIDATION_ERROR`.
- **Response 200 OK:** Mengembalikan detail menu terupdate dengan `recipeItems`.

#### GET `/api/menus/:id/cost`
Mengambil kalkulasi HPP dan status margin berdasarkan takaran resep yang tersimpan saat ini.

- **Metode:** `GET`
- **Autentikasi:** Wajib sesi aktif role `OWNER`.
- **Response 200 OK:** Mengembalikan payload yang sama dengan struktur response `POST /api/menus/preview-cost`.

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
