const DEFAULT_REDIRECT_URI = "https://instafunnel-lphz3bum.manus.space/api/youtube/oauth/callback";

export const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";

export type YouTubeOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type YouTubeConfigurationStatus = {
  configured: boolean;
  missing: string[];
  redirectUri: string;
};

function value(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getYouTubeConfigurationStatus(): YouTubeConfigurationStatus {
  const missing = [
    ["YOUTUBE_OAUTH_CLIENT_ID", value("YOUTUBE_OAUTH_CLIENT_ID")],
    ["YOUTUBE_OAUTH_CLIENT_SECRET", value("YOUTUBE_OAUTH_CLIENT_SECRET")],
  ].filter(([, configured]) => !configured).map(([name]) => name);

  return {
    configured: missing.length === 0,
    missing,
    redirectUri: value("YOUTUBE_OAUTH_REDIRECT_URI") || DEFAULT_REDIRECT_URI,
  };
}

export function getYouTubeOAuthConfig(): YouTubeOAuthConfig {
  const status = getYouTubeConfigurationStatus();
  if (!status.configured) {
    throw new Error("YouTube OAuth is not configured");
  }

  return {
    clientId: value("YOUTUBE_OAUTH_CLIENT_ID"),
    clientSecret: value("YOUTUBE_OAUTH_CLIENT_SECRET"),
    redirectUri: status.redirectUri,
  };
}

export function getYouTubeTokenEncryptionKey(): string {
  const encryptionKey = value("JWT_SECRET");
  if (!encryptionKey) throw new Error("YouTube token encryption is not configured");
  return encryptionKey;
}
