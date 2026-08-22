import { describe, expect, it } from "vitest";
import { publishInputSchema } from "./publishing";

describe("manual Reel publish input", () => {
  it("accepts only public HTTPS media URLs", () => {
    expect(publishInputSchema.safeParse({ sourceUrl: "https://cdn.example.test/reel.mp4", isAiGenerated: true }).success).toBe(true);
    expect(publishInputSchema.safeParse({ sourceUrl: "http://cdn.example.test/reel.mp4" }).success).toBe(false);
  });

  it("rejects captions longer than Meta's configured limit", () => {
    expect(publishInputSchema.safeParse({ sourceUrl: "https://cdn.example.test/reel.mp4", caption: "x".repeat(2201) }).success).toBe(false);
  });
});
