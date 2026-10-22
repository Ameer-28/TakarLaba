export type Role = "OWNER" | "CASHIER";

export interface TenantContext {
  userId: string;
  businessId: string;
  role: Role | string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      ctx?: TenantContext;
      valid?: Record<string, unknown> | unknown;
      id?: string;
    }
  }
}

export {};
