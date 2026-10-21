export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { idempotencyKey, params, headers = {}, ...rest } = options;

  let url = endpoint.startsWith("/") ? endpoint : `/api/${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && rest.body && typeof rest.body === "string") {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (idempotencyKey) {
    requestHeaders.set("Idempotency-Key", idempotencyKey);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "same-origin",
      headers: requestHeaders,
      ...rest,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text || text.trim() === "") {
    return undefined as T;
  }

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiError(response.status, {
      code: "UPSTREAM_ERROR",
      message: `Terjadi gangguan pada server atau proxy (status ${response.status})`,
    });
  }

  if (!json.ok) {
    throw new ApiError(response.status, json.error);
  }

  return json.data;
}
