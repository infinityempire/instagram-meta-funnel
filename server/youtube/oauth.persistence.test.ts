import { afterEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  upsertYouTubeConnection: vi.fn(),
}));

vi.mock("../db", () => dbMock);

import { decryptRefreshToken } from "./crypto";
import { persistYouTubeRefreshToken } from "./oauth";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("YouTube OAuth token persistence", () => {
  it("encrypts the refresh token before handing it to the database layer", async () => {
    vi.stubEnv("JWT_SECRET", "server-secret-used-only-for-test");

    await persistYouTubeRefreshToken("owner-123", "google-refresh-token-value");

    expect(dbMock.upsertYouTubeConnection).toHaveBeenCalledTimes(1);
    const [ownerOpenId, ciphertext] = dbMock.upsertYouTubeConnection.mock.calls[0] as [string, string];
    expect(ownerOpenId).toBe("owner-123");
    expect(ciphertext).not.toContain("google-refresh-token-value");
    expect(decryptRefreshToken(ciphertext, "server-secret-used-only-for-test")).toBe("google-refresh-token-value");
  });
});
