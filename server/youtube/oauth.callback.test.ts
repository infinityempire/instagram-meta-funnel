import { afterEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  upsertYouTubeConnection: vi.fn(),
}));

vi.mock("../db", () => dbMock);

import { createOAuthState, decryptRefreshToken } from "./crypto";
import { persistYouTubeRefreshToken, processYouTubeOAuthCallback } from "./oauth";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("YouTube OAuth callback flow", () => {
  it("validates state, exchanges a code, stores only ciphertext, and returns no token", async () => {
    const stateSecret = "signed-state-secret";
    const encryptionSecret = "storage-encryption-secret";
    const state = createOAuthState("owner-123", stateSecret);
    vi.stubEnv("JWT_SECRET", encryptionSecret);
    const exchangeCode = vi.fn().mockResolvedValue("google-refresh-token-value");

    const result = await processYouTubeOAuthCallback({
      state,
      expectedState: state,
      code: "one-time-google-code",
    }, {
      stateSecret,
      exchangeCode,
      persistRefreshToken: persistYouTubeRefreshToken,
    });

    expect(result).toBe("connected");
    expect(JSON.stringify(result)).not.toContain("google-refresh-token-value");
    expect(exchangeCode).toHaveBeenCalledWith("one-time-google-code");
    const [ownerOpenId, ciphertext] = dbMock.upsertYouTubeConnection.mock.calls[0] as [string, string];
    expect(ownerOpenId).toBe("owner-123");
    expect(ciphertext).not.toContain("google-refresh-token-value");
    expect(decryptRefreshToken(ciphertext, encryptionSecret)).toBe("google-refresh-token-value");
  });

  it("rejects a callback when state does not match its one-time cookie", async () => {
    const state = createOAuthState("owner-123", "state-secret");
    const exchangeCode = vi.fn();

    const result = await processYouTubeOAuthCallback({ state, expectedState: "different", code: "code" }, {
      stateSecret: "state-secret",
      exchangeCode,
      persistRefreshToken: vi.fn(),
    });

    expect(result).toBe("invalid_state");
    expect(exchangeCode).not.toHaveBeenCalled();
  });
});
