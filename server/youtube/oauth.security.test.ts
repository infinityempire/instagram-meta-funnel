import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOAuthState,
  decryptRefreshToken,
  encryptRefreshToken,
  verifyOAuthState,
} from "./crypto";
import { getYouTubeConfigurationStatus } from "./config";
import { createOwnerAuthorizationLaunchUrl } from "./oauth";

const originalEnv = { ...process.env };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("YouTube OAuth security primitives", () => {
  it("accepts only the original signed, unexpired OAuth state", () => {
    const now = 1_700_000_000_000;
    const state = createOAuthState("owner-123", "state-secret", now);

    expect(verifyOAuthState(state, "state-secret", now)).toMatchObject({ ownerOpenId: "owner-123" });
    expect(verifyOAuthState(`${state}x`, "state-secret", now)).toBeNull();
    expect(verifyOAuthState(state, "other-secret", now)).toBeNull();
    expect(verifyOAuthState(state, "state-secret", now + 10 * 60 * 1000 + 1)).toBeNull();
  });

  it("encrypts refresh tokens and rejects a different encryption key", () => {
    const key = "server-secret-for-test";
    const wrongKey = "different-server-secret";
    const encrypted = encryptRefreshToken("refresh-token-value", key);

    expect(encrypted).not.toContain("refresh-token-value");
    expect(decryptRefreshToken(encrypted, key)).toBe("refresh-token-value");
    expect(() => decryptRefreshToken(encrypted, wrongKey)).toThrow();
  });

  it("reports only missing secret names and never secret values", () => {
    vi.stubEnv("YOUTUBE_OAUTH_CLIENT_ID", "client-id.apps.googleusercontent.com");
    vi.stubEnv("YOUTUBE_OAUTH_CLIENT_SECRET", "do-not-return-this-value");

    const status = getYouTubeConfigurationStatus();

    expect(status).toMatchObject({ configured: true, missing: [] });
    expect(JSON.stringify(status)).not.toContain("do-not-return-this-value");
  });
});

describe("YouTube owner launch link", () => {
  it("creates a short-lived signed link without embedding OAuth credentials", () => {
    const launchUrl = createOwnerAuthorizationLaunchUrl(
      "https://instafunnel-lphz3bum.manus.space",
      "owner-123",
      "state-secret",
    );
    const url = new URL(launchUrl);
    const ticket = url.searchParams.get("ticket");

    expect(url.pathname).toBe("/api/youtube/oauth/launch");
    expect(verifyOAuthState(ticket!, "state-secret")?.ownerOpenId).toBe("owner-123");
    expect(launchUrl).not.toContain("YOUTUBE_OAUTH_CLIENT_SECRET");
  });
});
