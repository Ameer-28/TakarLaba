import { describe, it, expect } from "vitest";
import { authClient, signIn, signOut, useSession } from "./auth-client";

describe("authClient", () => {
  it("initializes Better Auth client with core methods", () => {
    expect(authClient).toBeDefined();
    expect(typeof signIn).toBe("function");
    expect(typeof signOut).toBe("function");
    expect(typeof useSession).toBe("function");
  });

  it("exports email signIn method", () => {
    expect(typeof signIn.email).toBe("function");
  });
});
