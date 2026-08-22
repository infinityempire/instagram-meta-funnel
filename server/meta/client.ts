import { getMetaConfig, type MetaConfig } from "./config";
import { RetryableHttpError, withRetry, type RetryOptions } from "./retry";
import { safeErrorMessage } from "./safeLog";

export class MetaNotConfiguredError extends Error {
  readonly code = "not_configured" as const;
  constructor() {
    super("Meta integration is not configured. Add the required environment variables first.");
    this.name = "MetaNotConfiguredError";
  }
}

export interface MetaRequestOptions extends RetryOptions {
  method?: "GET" | "POST";
  form?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export interface MetaClientDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  config?: MetaConfig | null;
}

async function doRequest(
  config: MetaConfig,
  path: string,
  options: MetaRequestOptions,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const base = `https://graph.instagram.com/${config.graphApiVersion}`;
  const url = new URL(`${base}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", config.accessToken);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const init: RequestInit = { method: options.method ?? "GET", signal: controller.signal };
    if (options.form) {
      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(options.form)) {
        if (value !== undefined) body.set(key, String(value));
      }
      init.body = body;
      init.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    }
    const response = await fetchImpl(url.toString(), init);
    const text = await response.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
    if (!response.ok) {
      const message = parsed && typeof parsed === "object" && "error" in parsed
        ? safeErrorMessage((parsed as { error: unknown }).error)
        : `HTTP ${response.status}`;
      if (response.status === 408 || response.status === 429 || response.status >= 500) {
        throw new RetryableHttpError(response.status, message);
      }
      throw new Error(message);
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error(`Meta request timed out after ${timeoutMs}ms`);
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function metaRequest<T = unknown>(
  path: string,
  options: MetaRequestOptions = {},
  deps: MetaClientDeps = {},
): Promise<T> {
  const config = deps.config !== undefined ? deps.config : getMetaConfig();
  if (!config) throw new MetaNotConfiguredError();
  return withRetry<T>(() => doRequest(config, path, options, deps.fetchImpl ?? fetch) as Promise<T>, {
    sleep: deps.sleep,
    baseDelayMs: options.baseDelayMs,
    maxAttempts: options.maxAttempts,
  });
}
