import { describe, expect, it } from "vitest";
import { supabase } from "./supabase";

describe("Flowlence Supabase connection", () => {
  it("can reach the Supabase Auth endpoint", async () => {
    const { data, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(data).toBeDefined();
  }, 15_000);
});
