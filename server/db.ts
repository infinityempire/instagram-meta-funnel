import { desc, eq, sql } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  insightSnapshots,
  keywordRules,
  leads,
  publishedMedia,
  users,
  webhookEvents,
  youtubeConnections,
  type InsertUser,
  type InsightSnapshot,
  type KeywordRule,
  type Lead,
  type PublishedMedia,
  type PublishStatus,
  type WebhookEvent,
  type YouTubeConnection,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let pool: mysql.Pool | null = null;
let database: MySql2Database | null = null;

export function getDb(): MySql2Database {
  if (!database) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    pool = mysql.createPool(url);
    database = drizzle(pool);
  }
  return database;
}

export function setDbForTesting(db: MySql2Database | null): void {
  database = db;
  pool = null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const values: InsertUser = { ...user };
  if (!values.role && user.openId === ENV.ownerOpenId) values.role = "admin";
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  await getDb().insert(users).values(values).onDuplicateKeyUpdate({
    set: {
      name: values.name ?? null,
      email: values.email ?? null,
      loginMethod: values.loginMethod ?? null,
      role: values.role,
      lastSignedIn: values.lastSignedIn,
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const rows = await getDb().select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export async function getYouTubeConnection(ownerOpenId: string): Promise<YouTubeConnection | null> {
  const rows = await getDb().select().from(youtubeConnections)
    .where(eq(youtubeConnections.ownerOpenId, ownerOpenId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertYouTubeConnection(ownerOpenId: string, refreshTokenCiphertext: string): Promise<void> {
  await getDb().insert(youtubeConnections).values({
    ownerOpenId,
    refreshTokenCiphertext,
    connectedAt: new Date(),
    lastAuthorizedAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      refreshTokenCiphertext,
      lastAuthorizedAt: new Date(),
    },
  });
}

export async function deleteYouTubeConnection(ownerOpenId: string): Promise<void> {
  await getDb().delete(youtubeConnections).where(eq(youtubeConnections.ownerOpenId, ownerOpenId));
}

export async function insertWebhookEvent(input: {
  dedupeKey: string; objectType: string; eventType: string; signatureValid: boolean; summary: string;
}): Promise<{ id: number; duplicate: boolean }> {
  const db = getDb();
  const existing = await db.select({ id: webhookEvents.id }).from(webhookEvents)
    .where(eq(webhookEvents.dedupeKey, input.dedupeKey)).limit(1);
  if (existing.length > 0) {
    await db.update(webhookEvents).set({ status: "ignored" }).where(eq(webhookEvents.id, existing[0].id));
    return { id: existing[0].id, duplicate: true };
  }
  const result = await db.insert(webhookEvents).values({
    ...input, objectType: input.objectType.slice(0, 64), eventType: input.eventType.slice(0, 96),
    summary: input.summary.slice(0, 512), status: "received",
  });
  return { id: Number(result[0].insertId), duplicate: false };
}

export async function markWebhookEventProcessed(id: number): Promise<void> {
  await getDb().update(webhookEvents).set({ status: "processed", processedAt: new Date() })
    .where(eq(webhookEvents.id, id));
}

export async function markWebhookEventFailed(id: number, safeError: string): Promise<void> {
  await getDb().update(webhookEvents).set({
    status: "failed", processedAt: new Date(), errorMessage: safeError.slice(0, 512), summary: safeError.slice(0, 512),
  }).where(eq(webhookEvents.id, id));
}

export async function listWebhookEvents(limit: number, offset: number): Promise<WebhookEvent[]> {
  return getDb().select().from(webhookEvents).orderBy(desc(webhookEvents.id)).limit(limit).offset(offset);
}

export async function getLatestWebhookEvent(): Promise<WebhookEvent | null> {
  const rows = await getDb().select().from(webhookEvents).orderBy(desc(webhookEvents.id)).limit(1);
  return rows[0] ?? null;
}

export async function listActiveKeywords(): Promise<KeywordRule[]> {
  return getDb().select().from(keywordRules).where(eq(keywordRules.active, true));
}

export async function listKeywords(): Promise<KeywordRule[]> {
  return getDb().select().from(keywordRules).orderBy(desc(keywordRules.id));
}

export async function createKeyword(keyword: string): Promise<KeywordRule> {
  const normalized = keyword.trim();
  await getDb().insert(keywordRules).values({ keyword: normalized, active: true })
    .onDuplicateKeyUpdate({ set: { active: true } });
  const rows = await getDb().select().from(keywordRules).where(eq(keywordRules.keyword, normalized)).limit(1);
  if (!rows[0]) throw new Error("Keyword rule could not be created");
  return rows[0];
}

export async function setKeywordActive(id: number, active: boolean): Promise<void> {
  await getDb().update(keywordRules).set({ active }).where(eq(keywordRules.id, id));
}

export async function removeKeyword(id: number): Promise<void> {
  await getDb().delete(keywordRules).where(eq(keywordRules.id, id));
}

export async function insertLead(input: {
  webhookEventId: number; instagramScopedUserId: string; keyword: string; occurredAt: Date;
}): Promise<Lead> {
  const result = await getDb().insert(leads).values({ ...input, deliveryStatus: "pending", attempts: 0 });
  const rows = await getDb().select().from(leads).where(eq(leads.id, Number(result[0].insertId))).limit(1);
  if (!rows[0]) throw new Error("Lead could not be created");
  return rows[0];
}

export async function getLeadById(id: number): Promise<Lead | null> {
  const rows = await getDb().select().from(leads).where(eq(leads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateLeadDelivery(
  id: number,
  update: { deliveryStatus: "pending" | "delivered" | "failed"; attempts: number; lastError: string | null; responseStatus?: number | null },
): Promise<void> {
  await getDb().update(leads).set({
    deliveryStatus: update.deliveryStatus,
    attempts: update.attempts,
    lastError: update.lastError,
    responseStatus: update.responseStatus,
    deliveredAt: update.deliveryStatus === "delivered" ? new Date() : null,
  }).where(eq(leads.id, id));
}

export async function listLeads(limit: number, offset: number): Promise<Lead[]> {
  return getDb().select().from(leads).orderBy(desc(leads.id)).limit(limit).offset(offset);
}

export async function insertPublishedMedia(input: {
  clientRequestId: string; sourceUrl: string; caption: string | null; isAiGenerated: boolean; mediaType: "REELS"; status: PublishStatus;
}): Promise<PublishedMedia> {
  const result = await getDb().insert(publishedMedia).values(input);
  const rows = await getDb().select().from(publishedMedia).where(eq(publishedMedia.id, Number(result[0].insertId))).limit(1);
  if (!rows[0]) throw new Error("Media record could not be created");
  return rows[0];
}

export async function getPublishedMediaById(id: number): Promise<PublishedMedia | null> {
  const rows = await getDb().select().from(publishedMedia).where(eq(publishedMedia.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getPublishedMediaByRequestId(clientRequestId: string): Promise<PublishedMedia | null> {
  const rows = await getDb().select().from(publishedMedia)
    .where(eq(publishedMedia.clientRequestId, clientRequestId)).limit(1);
  return rows[0] ?? null;
}

export async function updatePublishedMedia(
  id: number,
  update: Partial<{ containerId: string; metaMediaId: string; status: PublishStatus; lastError: string | null; lastInsightAt: Date; }>,
): Promise<PublishedMedia | null> {
  const clean = { ...update };
  if (clean.lastError) clean.lastError = clean.lastError.slice(0, 512);
  if (clean.status === "published" && !clean.metaMediaId) {
    throw new Error("Published media requires a Meta media ID");
  }
  await getDb().update(publishedMedia).set({ ...clean, publishedAt: clean.status === "published" ? new Date() : undefined })
    .where(eq(publishedMedia.id, id));
  return getPublishedMediaById(id);
}

export async function listPublishedMedia(limit: number, offset: number): Promise<PublishedMedia[]> {
  return getDb().select().from(publishedMedia).orderBy(desc(publishedMedia.id)).limit(limit).offset(offset);
}

export async function insertInsightSnapshot(input: {
  mediaId: number; reach: number | null; impressions: number | null; likes: number | null;
  comments: number | null; saves: number | null; engagement: number | null;
}): Promise<InsightSnapshot> {
  const result = await getDb().insert(insightSnapshots).values(input);
  const rows = await getDb().select().from(insightSnapshots).where(eq(insightSnapshots.id, Number(result[0].insertId))).limit(1);
  if (!rows[0]) throw new Error("Insight snapshot could not be created");
  return rows[0];
}

export async function listInsightSnapshots(mediaId: number, limit = 90): Promise<InsightSnapshot[]> {
  const rows = await getDb().select().from(insightSnapshots).where(eq(insightSnapshots.mediaId, mediaId))
    .orderBy(desc(insightSnapshots.id)).limit(limit);
  return rows.reverse();
}

export async function getDashboardSummary() {
  const db = getDb();
  const [leadStats] = await db.select({
    total: sql<number>`count(*)`, delivered: sql<number>`coalesce(sum(${leads.deliveryStatus} = 'delivered'), 0)`,
    failed: sql<number>`coalesce(sum(${leads.deliveryStatus} = 'failed'), 0)`,
  }).from(leads);
  const [mediaStats] = await db.select({ published: sql<number>`coalesce(sum(${publishedMedia.status} = 'published'), 0)` })
    .from(publishedMedia);
  const latest = await getLatestWebhookEvent();
  return {
    totalLeads: Number(leadStats?.total ?? 0), deliveredLeads: Number(leadStats?.delivered ?? 0),
    failedLeads: Number(leadStats?.failed ?? 0), publishedCount: Number(mediaStats?.published ?? 0),
    latestWebhook: latest ? { status: latest.status, eventType: latest.eventType, receivedAt: latest.receivedAt } : null,
  };
}

export async function getRecentInsightTrend(limit = 30): Promise<InsightSnapshot[]> {
  const rows = await getDb().select().from(insightSnapshots).orderBy(desc(insightSnapshots.id)).limit(limit);
  return rows.reverse();
}
