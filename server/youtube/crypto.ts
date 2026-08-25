import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const STATE_VERSION = 1;
const TOKEN_VERSION = "v1";
const TOKEN_AAD = Buffer.from("small-stories-youtube-refresh-token:v1", "utf8");
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type OAuthStatePayload = {
  version: number;
  nonce: string;
  ownerOpenId: string;
  expiresAt: number;
};

function equal(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createOAuthState(ownerOpenId: string, secret: string, now = Date.now()): string {
  if (!ownerOpenId || !secret) throw new Error("OAuth state requires an owner and a signing secret");
  const payload: OAuthStatePayload = {
    version: STATE_VERSION,
    nonce: randomBytes(32).toString("base64url"),
    ownerOpenId,
    expiresAt: now + OAUTH_STATE_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyOAuthState(state: string, secret: string, now = Date.now()): OAuthStatePayload | null {
  const [encoded, signature, extra] = state.split(".");
  if (!encoded || !signature || extra || !secret || !equal(signature, sign(encoded, secret))) return null;

  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;
    if (
      value.version !== STATE_VERSION ||
      typeof value.nonce !== "string" || value.nonce.length < 32 ||
      typeof value.ownerOpenId !== "string" || value.ownerOpenId.length === 0 ||
      typeof value.expiresAt !== "number" || value.expiresAt < now
    ) return null;
    return value;
  } catch {
    return null;
  }
}

function tokenKey(serverSecret: string): Buffer {
  if (!serverSecret) throw new Error("YouTube token encryption requires a server secret");
  return createHash("sha256")
    .update("small-stories-youtube-token-encryption:v1\0", "utf8")
    .update(serverSecret, "utf8")
    .digest();
}

export function encryptRefreshToken(token: string, serverSecret: string): string {
  if (!token) throw new Error("Refresh token is required");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(serverSecret), iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [TOKEN_VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptRefreshToken(payload: string, serverSecret: string): string {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded, extra] = payload.split(".");
  if (version !== TOKEN_VERSION || !ivEncoded || !tagEncoded || !ciphertextEncoded || extra) {
    throw new Error("Malformed encrypted YouTube token");
  }
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(serverSecret), Buffer.from(ivEncoded, "base64url"));
  decipher.setAAD(TOKEN_AAD);
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
