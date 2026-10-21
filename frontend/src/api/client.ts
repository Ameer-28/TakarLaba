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

  const response = await fetch(url, {
    credentials: "same-origin",
    headers: requestHeaders,
    ...rest,
  });

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(response.status, {
      code: "PARSE_ERROR",
      message: `Gagal membaca respons dari server (status ${response.status})`,
    });
  }

  if (!json.ok) {
    throw new ApiError(response.status, json.error);
  }

  return json.data;
}
