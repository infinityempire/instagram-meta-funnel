import { createHash, createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import * as db from "../db";
import { forwardLeadToFunnel } from "./leadForwarding";
import { logSafe, safeErrorMessage } from "./safeLog";

export function computeSignature(rawBody: Buffer | string, appSecret: string): string {
  return `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
}

export function verifyWebhookSignature(rawBody: Buffer | string, header: string | undefined, appSecret: string): boolean {
  if (!header || !appSecret || !header.startsWith("sha256=")) return false;
  const actual = Buffer.from(header);
  const expected = Buffer.from(computeSignature(rawBody, appSecret));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function handleWebhookVerify(
  query: { mode?: string; token?: string; challenge?: string }, expectedVerifyToken: string | undefined,
): { status: number; body: string } {
  if (!expectedVerifyToken || query.mode !== "subscribe" || !query.token || !query.challenge) {
    return { status: 403, body: "Forbidden" };
  }
  const actual = Buffer.from(query.token);
  const expected = Buffer.from(expectedVerifyToken);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return { status: 403, body: "Forbidden" };
  return { status: 200, body: query.challenge };
}

const messageSchema = z.object({
  sender: z.object({ id: z.union([z.string(), z.number()]) }).passthrough(),
  message: z.object({ text: z.string() }).passthrough().optional(),
  timestamp: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export function extractMessagingEvents(payload: unknown) {
  const entries = payload && typeof payload === "object" ? (payload as { entry?: unknown }).entry : undefined;
  if (!Array.isArray(entries)) return [];
  const events: Array<{ senderId: string; text: string; occurredAt: Date }> = [];
  for (const entry of entries) {
    const messaging = entry && typeof entry === "object" ? (entry as { messaging?: unknown }).messaging : undefined;
    if (!Array.isArray(messaging)) continue;
    for (const raw of messaging) {
      const parsed = messageSchema.safeParse(raw);
      if (!parsed.success) continue;
      const data = parsed.data;
      const text = data.message?.text?.trim();
      if (!text) continue;
      const timestamp = Number(data.timestamp);
      events.push({ senderId: String(data.sender.id), text, occurredAt: Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp) : new Date() });
    }
  }
  return events;
}

export function matchKeyword(text: string, keywords: string[]): string | null {
  const haystack = text.toLocaleLowerCase();
  return keywords.find(keyword => keyword.trim() && haystack.includes(keyword.trim().toLocaleLowerCase())) ?? null;
}

function objectTypeOf(payload: unknown): string {
  const value = payload && typeof payload === "object" ? (payload as { object?: unknown }).object : undefined;
  return typeof value === "string" ? value.slice(0, 64) : "unknown";
}

function eventTypeOf(payload: unknown): string {
  const objectType = objectTypeOf(payload);
  return objectType === "instagram" ? (extractMessagingEvents(payload).length ? "instagram.messaging" : "instagram.other") : objectType;
}

function summarizePayload(payload: unknown): string {
  const entries = payload && typeof payload === "object" && Array.isArray((payload as { entry?: unknown }).entry)
    ? (payload as { entry: unknown[] }).entry.length : 0;
  return `object=${objectTypeOf(payload)} entries=${entries} messaging_events=${extractMessagingEvents(payload).length}`;
}

export async function processWebhookPayload(rawBody: Buffer, payload: unknown) {
  const insertion = await db.insertWebhookEvent({
    dedupeKey: createHash("sha256").update(rawBody).digest("hex"),
    objectType: objectTypeOf(payload), eventType: eventTypeOf(payload), signatureValid: true, summary: summarizePayload(payload),
  });
  if (insertion.duplicate) return { duplicate: true, leadsCreated: 0 };
  let leadsCreated = 0;
  try {
    const keywords = (await db.listActiveKeywords()).map(rule => rule.keyword);
    for (const message of extractMessagingEvents(payload)) {
      const keyword = matchKeyword(message.text, keywords);
      if (!keyword) continue;
      const lead = await db.insertLead({ webhookEventId: insertion.id, instagramScopedUserId: message.senderId, keyword, occurredAt: message.occurredAt });
      leadsCreated += 1;
      await forwardLeadToFunnel(lead.id);
    }
    await db.markWebhookEventProcessed(insertion.id);
  } catch (error) {
    const safe = safeErrorMessage(error);
    logSafe("error", "Webhook processing failed", safe);
    await db.markWebhookEventFailed(insertion.id, safe);
  }
  return { duplicate: false, leadsCreated };
}
