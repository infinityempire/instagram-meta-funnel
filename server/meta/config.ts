export const META_ENV_KEYS = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_VERIFY_TOKEN",
  "META_ACCESS_TOKEN",
  "META_INSTAGRAM_ACCOUNT_ID",
  "META_GRAPH_API_VERSION",
  "WHATSAPP_FUNNEL_WEBHOOK_URL",
] as const;

export type MetaEnvKey = (typeof META_ENV_KEYS)[number];

export interface MetaConfig {
  appId: string;
  appSecret: string;
  verifyToken: string;
  accessToken: string;
  instagramAccountId: string;
  graphApiVersion: string;
  whatsappFunnelWebhookUrl: string;
}

const read = (key: MetaEnvKey) => (process.env[key] ?? "").trim();

export function getMissingMetaEnv(env: NodeJS.ProcessEnv = process.env): MetaEnvKey[] {
  return META_ENV_KEYS.filter(key => key !== "META_GRAPH_API_VERSION" && !(env[key] ?? "").trim());
}

export function getMetaConfigStatus() {
  const missing = getMissingMetaEnv();
  return {
    configured: missing.length === 0,
    missing,
    graphApiVersion: read("META_GRAPH_API_VERSION") || "v26.0",
    webhookPath: "/api/meta/webhook",
    graphBaseUrl: "https://graph.instagram.com",
  };
}

export function getMetaConfig(): MetaConfig | null {
  if (getMissingMetaEnv().length > 0) return null;
  return {
    appId: read("META_APP_ID"),
    appSecret: read("META_APP_SECRET"),
    verifyToken: read("META_VERIFY_TOKEN"),
    accessToken: read("META_ACCESS_TOKEN"),
    instagramAccountId: read("META_INSTAGRAM_ACCOUNT_ID"),
    graphApiVersion: read("META_GRAPH_API_VERSION") || "v26.0",
    whatsappFunnelWebhookUrl: read("WHATSAPP_FUNNEL_WEBHOOK_URL"),
  };
}
