import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAuthRedirectUrl } from "./supabase";

describe("Flowlence auth redirects", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { origin: "https://flowlence.example" } },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  });

  it("builds redirect URLs from the current application origin", () => {
    expect(getAuthRedirectUrl("/login")).toBe("https://flowlence.example/login");
  });

  it("does not append Supabase paths to the redirect destination", () => {
    const redirect = getAuthRedirectUrl("/login");
    expect(redirect).not.toContain("/rest/v1");
    expect(redirect).not.toContain("/auth/v1");
  });
});
