export interface TenantContext {
  userId: string;
  businessId: string;
  role: "OWNER" | "CASHIER" | string;
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
