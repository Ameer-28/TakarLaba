import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export type UserRole = "OWNER" | "CASHIER";

export interface CustomUserFields {
  role: UserRole;
  businessId: string;
  isActive: boolean;
}

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: true,
        },
        businessId: {
          type: "string",
          required: true,
        },
        isActive: {
          type: "boolean",
          required: true,
        },
      },
    }),
  ],
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
