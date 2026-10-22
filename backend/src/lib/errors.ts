export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    code = "INTERNAL_ERROR",
    statusCode = 500,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validasi input gagal", fieldErrors?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400, fieldErrors);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Autentikasi diperlukan") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Akses ditolak") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Terjadi konflik data") {
    super(message, "CONFLICT", 409);
  }
}

export class InsufficientStockError extends AppError {
  readonly ingredientId?: string;
  readonly ingredientName?: string;
  readonly needed?: string;
  readonly available?: string;

  constructor(
    message = "Stok bahan tidak mencukupi",
    details?: {
      ingredientId?: string;
      ingredientName?: string;
      needed?: string;
      available?: string;
    }
  ) {
    super(message, "INSUFFICIENT_STOCK", 409);
    if (details) {
      this.ingredientId = details.ingredientId;
      this.ingredientName = details.ingredientName;
      this.needed = details.needed;
      this.available = details.available;
    }
  }
}
