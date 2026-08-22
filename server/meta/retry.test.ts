import { describe, expect, it } from "vitest";
import { RetryableHttpError, withRetry } from "./retry";

describe("bounded Meta retry", () => {
  it("retries transient failures with bounded exponential delays", async () => {
    let attempts = 0;
    const delays: number[] = [];
    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new RetryableHttpError(503, "temporary");
      return "ok";
    }, { baseDelayMs: 10, sleep: async ms => { delays.push(ms); } });
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
    expect(delays).toEqual([10, 20]);
  });

  it("does not retry a permanent request failure", async () => {
    let attempts = 0;
    await expect(withRetry(async () => { attempts += 1; throw new Error("bad request"); }))
      .rejects.toThrow("bad request");
    expect(attempts).toBe(1);
  });
});
