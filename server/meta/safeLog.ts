const REDACTED = "[REDACTED]";

const PATTERNS: RegExp[] = [
  /(\b(?:access_token|appsecret_proof|app_secret|verify_token|code|refresh_token|client_secret|id_token)=)[^&\s"',}]+/gi,
  /(authorization["'\s:=]+bearer\s+)[^"'\s,}]+/gi,
  /\bBearer\s+[A-Za-z0-9._\-~+/=]+/g,
  /("(?:access_token|app_secret|appsecret_proof|refresh_token|verify_token|client_secret|id_token|code)"\s*:\s*")[^"]+/gi,
  /\bEAA[A-Za-z0-9_\-]{10,}\b/g,
  /\bIGA{1,2}[A-Za-z0-9_\-]{10,}\b/g,
];

function configuredSecrets(): string[] {
  const keys = [
    "META_APP_SECRET",
    "META_ACCESS_TOKEN",
    "META_VERIFY_TOKEN",
    "WHATSAPP_FUNNEL_WEBHOOK_URL",
    "JWT_SECRET",
    "YOUTUBE_OAUTH_CLIENT_SECRET",
  ];
  return keys.map(key => (process.env[key] ?? "").trim()).filter(value => value.length >= 4);
}

export function redactSensitive(input: string): string {
  let output = input;
  for (const pattern of PATTERNS) {
    output = output.replace(pattern, (_match, prefix) => (prefix ? `${prefix}${REDACTED}` : REDACTED));
  }
  for (const secret of configuredSecrets()) output = output.split(secret).join(REDACTED);
  return output;
}

export function safeErrorMessage(error: unknown): string {
  let raw: string;
  if (error instanceof Error) raw = error.message;
  else if (typeof error === "string") raw = error;
  else {
    try {
      raw = JSON.stringify(error) ?? "Unknown error";
    } catch {
      raw = "Unknown error";
    }
  }
  const clean = redactSensitive(raw).replace(/\s+/g, " ").trim();
  return clean.length > 240 ? `${clean.slice(0, 240)}…` : clean;
}

export function logSafe(level: "info" | "warn" | "error", message: string, meta?: unknown): void {
  const metaText = meta === undefined ? "" : ` ${safeErrorMessage(meta)}`;
  console[level](`[meta] ${redactSensitive(message)}${metaText}`);
}
