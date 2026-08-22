import * as db from "../db";
import { getMetaConfig } from "./config";
import { RetryableHttpError, withRetry } from "./retry";
import { logSafe, safeErrorMessage } from "./safeLog";

export interface ForwardDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  funnelUrl?: string | null;
  timeoutMs?: number;
}

export async function forwardLeadToFunnel(leadId: number, deps: ForwardDeps = {}) {
  const funnelUrl = deps.funnelUrl ?? getMetaConfig()?.whatsappFunnelWebhookUrl ?? null;
  if (!funnelUrl) {
    const error = "WhatsApp funnel webhook URL is not configured";
    await db.updateLeadDelivery(leadId, { deliveryStatus: "failed", attempts: 0, lastError: error });
    return { status: "not_configured" as const, attempts: 0, error };
  }
  const lead = await db.getLeadById(leadId);
  if (!lead) return { status: "failed" as const, attempts: 0, error: "Lead not found" };
  if (lead.deliveryStatus === "delivered") return { status: "delivered" as const, attempts: lead.attempts };

  const payload = {
    source: "instagram-dm",
    instagramScopedUserId: lead.instagramScopedUserId,
    triggerKeyword: lead.keyword,
    occurredAt: lead.occurredAt.toISOString(),
  };
  let attempts = 0;
  try {
    await withRetry(async () => {
      attempts += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 10_000);
      try {
        const response = await (deps.fetchImpl ?? fetch)(funnelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!response.ok) {
          const message = `Funnel webhook responded with HTTP ${response.status}`;
          if (response.status === 408 || response.status === 429 || response.status >= 500) {
            throw new RetryableHttpError(response.status, message);
          }
          throw new Error(message);
        }
      } finally {
        clearTimeout(timer);
      }
    }, { maxAttempts: 3, sleep: deps.sleep });
    await db.updateLeadDelivery(leadId, { deliveryStatus: "delivered", attempts, lastError: null });
    return { status: "delivered" as const, attempts };
  } catch (error) {
    const safe = safeErrorMessage(error);
    logSafe("warn", `lead ${leadId} forwarding failed after ${attempts} attempt(s): ${safe}`);
    await db.updateLeadDelivery(leadId, { deliveryStatus: "failed", attempts, lastError: safe });
    return { status: "failed" as const, attempts, error: safe };
  }
}
