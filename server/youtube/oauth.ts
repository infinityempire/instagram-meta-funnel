import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { createContext } from "../_core/context";
import { ENV } from "../_core/env";
import * as db from "../db";
import { logSafe, safeErrorMessage } from "../meta/safeLog";
import { createOAuthState, decryptRefreshToken, encryptRefreshToken, verifyOAuthState } from "./crypto";
import { getYouTubeConfigurationStatus, getYouTubeOAuthConfig, getYouTubeTokenEncryptionKey, YOUTUBE_UPLOAD_SCOPE } from "./config";

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOCATION_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const STATE_COOKIE = "youtube_oauth_state";
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

function query(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: "lax" as const,
    path: "/api/youtube/oauth",
    maxAge: STATE_COOKIE_MAX_AGE_MS,
  };
}

function redirect(res: Response, outcome: "connected" | "denied" | "error"): void {
  res.redirect(302, `/?youtube=${outcome}`);
}

async function requireAdmin(req: Request, res: Response) {
  const context = await createContext({ req, res } as unknown as Parameters<typeof createContext>[0]);
  if (!context.user || context.user.role !== "admin") return null;
  return context.user;
}

async function exchangeAuthorizationCode(code: string) {
  const config = getYouTubeOAuthConfig();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed with HTTP ${response.status}`);
  const body = await response.json() as { refresh_token?: string };
  if (!body.refresh_token) throw new Error("Google did not return a refresh token");
  return body.refresh_token;
}

export async function disconnectYouTubeConnection(ownerOpenId: string): Promise<{ disconnected: boolean }> {
  const connection = await db.getYouTubeConnection(ownerOpenId);
  if (!connection) return { disconnected: false };

  const refreshToken = decryptRefreshToken(connection.refreshTokenCiphertext, getYouTubeTokenEncryptionKey());
  const response = await fetch(GOOGLE_REVOCATION_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken }),
  });
  if (!response.ok && response.status !== 400) {
    throw new Error(`Google token revocation failed with HTTP ${response.status}`);
  }
  await db.deleteYouTubeConnection(ownerOpenId);
  logSafe("info", "YouTube OAuth connection was revoked and removed");
  return { disconnected: true };
}

export function registerYouTubeOAuthRoutes(app: Express) {
  app.get("/api/youtube/oauth/start", async (req, res) => {
    const user = await requireAdmin(req, res);
    if (!user) {
      res.status(403).json({ error: "Administrator sign-in is required" });
      return;
    }
    const status = getYouTubeConfigurationStatus();
    if (!status.configured) {
      res.status(503).json({ error: "YouTube OAuth is not configured" });
      return;
    }
    const config = getYouTubeOAuthConfig();
    const state = createOAuthState(user.openId, ENV.cookieSecret);
    res.cookie(STATE_COOKIE, state, stateCookieOptions());

    const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
    authorizationUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: YOUTUBE_UPLOAD_SCOPE,
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
      state,
    }).toString();
    res.redirect(302, authorizationUrl.toString());
  });

  app.get("/api/youtube/oauth/callback", async (req, res) => {
    const state = query(req, "state");
    const code = query(req, "code");
    const googleError = query(req, "error");
    const expectedState = parseCookieHeader(req.headers.cookie ?? "")[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, stateCookieOptions());

    if (googleError) {
      logSafe("warn", "Google OAuth consent was declined", { error: googleError });
      redirect(res, "denied");
      return;
    }
    if (!state || !code || !expectedState || state !== expectedState) {
      logSafe("warn", "YouTube OAuth callback rejected because state did not match");
      res.status(403).json({ error: "Invalid OAuth state" });
      return;
    }
    const payload = verifyOAuthState(state, ENV.cookieSecret);
    if (!payload) {
      logSafe("warn", "YouTube OAuth callback rejected because state was invalid or expired");
      res.status(403).json({ error: "Invalid OAuth state" });
      return;
    }

    try {
      const refreshToken = await exchangeAuthorizationCode(code);
      const ciphertext = encryptRefreshToken(refreshToken, getYouTubeTokenEncryptionKey());
      await db.upsertYouTubeConnection(payload.ownerOpenId, ciphertext);
      logSafe("info", "YouTube OAuth connection stored for administrator");
      redirect(res, "connected");
    } catch (error) {
      logSafe("error", "YouTube OAuth callback failed", safeErrorMessage(error));
      redirect(res, "error");
    }
  });

  app.post("/api/youtube/oauth/disconnect", async (req, res) => {
    const user = await requireAdmin(req, res);
    if (!user) {
      res.status(403).json({ error: "Administrator sign-in is required" });
      return;
    }
    try {
      const result = await disconnectYouTubeConnection(user.openId);
      res.status(200).json(result);
    } catch (error) {
      logSafe("error", "YouTube OAuth disconnect failed", safeErrorMessage(error));
      res.status(502).json({ error: "Could not disconnect YouTube safely" });
    }
  });
}
