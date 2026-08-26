import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConnection: vi.fn(),
  decrypt: vi.fn(),
  config: vi.fn(),
  encryptionKey: vi.fn(),
}));

vi.mock("../db", () => ({ getYouTubeConnection: mocks.getConnection }));
vi.mock("./crypto", () => ({ decryptRefreshToken: mocks.decrypt }));
vi.mock("./config", () => ({
  getYouTubeOAuthConfig: mocks.config,
  getYouTubeTokenEncryptionKey: mocks.encryptionKey,
}));

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPrivateKidsUploadMetadata } from "./uploadPolicy";
import { getUploadedVideoStatus, logPrivateUploadFailure, logPrivateUploadSuccess, uploadPrivateYouTubeVideo } from "./uploader";

describe("private YouTube uploader policy", () => {
  it("creates immutable private metadata required by the uploader", () => {
    const metadata = createPrivateKidsUploadMetadata({ title: "לולי", description: "סיפור לילדים" });

    expect(metadata.status).toEqual({
      privacyStatus: "private",
      selfDeclaredMadeForKids: true,
      containsSyntheticMedia: true,
      publicStatsViewable: false,
    });
  });
});

describe("private upload safe logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mocks.getConnection.mockReset();
    mocks.decrypt.mockReset();
    mocks.config.mockReset();
    mocks.encryptionKey.mockReset();
  });

  it("never writes a configured OAuth secret to failure logs", () => {
    vi.stubEnv("YOUTUBE_OAUTH_CLIENT_SECRET", "super-secret-client-value");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logPrivateUploadFailure("/safe/path/story.mp4", new Error("refresh_token=super-secret-client-value"));

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("super-secret-client-value");
  });

  it("never writes a configured OAuth secret to success logs", () => {
    vi.stubEnv("YOUTUBE_OAUTH_CLIENT_SECRET", "super-secret-client-value");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logPrivateUploadSuccess("/safe/path/story.mp4", {
      videoId: "video-id-123",
      privacyStatus: "private",
    });

    expect(infoSpy).toHaveBeenCalledOnce();
    const line = infoSpy.mock.calls.flat().join(" ");
    expect(line).toContain("video-id-123");
    expect(line).not.toContain("super-secret-client-value");
  });

  it("logs safely when the full resumable upload path succeeds", async () => {
    const directory = mkdtempSync(join(tmpdir(), "youtube-upload-"));
    const filePath = join(directory, "story.mp4");
    writeFileSync(filePath, "video-bytes");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token-value" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200, headers: { location: "https://upload.example/session" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "private-video-123", status: { privacyStatus: "private" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    mocks.getConnection.mockResolvedValue({ refreshTokenCiphertext: "encrypted" });
    mocks.decrypt.mockReturnValue("refresh-token-value");
    mocks.config.mockReturnValue({ clientId: "client-id", clientSecret: "client-secret", redirectUri: "https://example.test/callback" });
    mocks.encryptionKey.mockReturnValue("encryption-key");

    const result = await uploadPrivateYouTubeVideo({
      ownerOpenId: "owner-123",
      filePath,
      metadata: createPrivateKidsUploadMetadata({ title: "לולי", description: "סיפור" }),
    });
    const log = infoSpy.mock.calls.flat().join(" ");
    rmSync(directory, { recursive: true, force: true });

    expect(result).toEqual({ videoId: "private-video-123", privacyStatus: "private" });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(log).toContain("private-video-123");
    expect(log).not.toContain("access-token-value");
    expect(log).not.toContain("refresh-token-value");
    expect(log).not.toContain("client-secret");
  });

  it("reads back the private Made for Kids status without exposing the access token", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token-value" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: "private-video-123", status: { privacyStatus: "private", madeForKids: true, selfDeclaredMadeForKids: true } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    mocks.getConnection.mockResolvedValue({ refreshTokenCiphertext: "encrypted" });
    mocks.decrypt.mockReturnValue("refresh-token-value");
    mocks.config.mockReturnValue({ clientId: "client-id", clientSecret: "client-secret", redirectUri: "https://example.test/callback" });
    mocks.encryptionKey.mockReturnValue("encryption-key");

    const status = await getUploadedVideoStatus("owner-123", "private-video-123");

    expect(status).toEqual({ videoId: "private-video-123", privacyStatus: "private", madeForKids: true, selfDeclaredMadeForKids: true });
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toContain("refresh-token-value");
  });
});
