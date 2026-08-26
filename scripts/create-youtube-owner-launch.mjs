import { createHmac, randomBytes } from "node:crypto";

const baseUrl = process.env.YOUTUBE_OAUTH_PUBLIC_BASE_URL || "https://instafunnel-lphz3bum.manus.space";
const ownerOpenId = process.env.OWNER_OPEN_ID;
const secret = process.env.JWT_SECRET;

if (!ownerOpenId || !secret) {
  throw new Error("OWNER_OPEN_ID and JWT_SECRET are required to create an authorization launch URL");
}

const payload = {
  version: 1,
  nonce: randomBytes(32).toString("base64url"),
  ownerOpenId,
  expiresAt: Date.now() + 10 * 60 * 1000,
};
const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
const ticket = `${encoded}.${signature}`;

console.log(new URL(`/api/youtube/oauth/launch?ticket=${encodeURIComponent(ticket)}`, baseUrl).toString());
