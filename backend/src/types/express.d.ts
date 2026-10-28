export type Role = "OWNER" | "CASHIER";

export interface TenantContext {
  userId: string;
  businessId: string;
  role: Role | string;
  email: string;
  name: string;
}

export interface ValidatedRequest {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      ctx?: TenantContext;
      valid?: ValidatedRequest;
      id?: string;
    }
  }
}

export {};
