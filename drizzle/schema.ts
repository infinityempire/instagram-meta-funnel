import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  dedupeKey: varchar("dedupeKey", { length: 128 }).notNull().unique(),
  objectType: varchar("objectType", { length: 64 }).notNull(),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  status: mysqlEnum("status", ["received", "processed", "ignored", "failed"]).notNull().default("received"),
  signatureValid: boolean("signatureValid").notNull(),
  summary: text("safeSummary"),
  errorMessage: varchar("errorMessage", { length: 512 }),
  receivedAt: timestamp("receivedAt").notNull().defaultNow(),
  processedAt: timestamp("processedAt"),
}, table => ({
  dedupeKeyIdx: uniqueIndex("webhook_events_dedupe_key_idx").on(table.dedupeKey),
  receivedAtIdx: index("webhook_events_received_at_idx").on(table.receivedAt),
}));

export const keywordRules = mysqlTable("keyword_rules", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 160 }).notNull().unique(),
  active: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
}, table => ({
  keywordIdx: uniqueIndex("keyword_rules_keyword_idx").on(table.keyword),
}));

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  webhookEventId: int("webhookEventId"),
  instagramScopedUserId: varchar("instagramScopedUserId", { length: 128 }).notNull(),
  keyword: varchar("triggerKeyword", { length: 160 }).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "delivered", "failed"]).notNull().default("pending"),
  attempts: int("deliveryAttempts").notNull().default(0),
  responseStatus: int("responseStatus"),
  lastError: varchar("safeErrorMessage", { length: 512 }),
  occurredAt: timestamp("createdAt").notNull().defaultNow(),
  deliveredAt: timestamp("deliveredAt"),
}, table => ({
  deliveryStatusIdx: index("leads_delivery_status_idx").on(table.deliveryStatus),
  createdAtIdx: index("leads_created_at_idx").on(table.occurredAt),
}));

export const PUBLISH_STATUSES = ["draft", "creating_container", "processing", "ready", "published", "failed"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const publishedMedia = mysqlTable("published_media", {
  id: int("id").autoincrement().primaryKey(),
  clientRequestId: varchar("clientRequestId", { length: 64 }).notNull().unique(),
  containerId: varchar("mediaContainerId", { length: 128 }),
  metaMediaId: varchar("metaMediaId", { length: 128 }),
  mediaType: mysqlEnum("mediaType", ["REELS", "IMAGE", "STORIES", "CAROUSEL"]).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  caption: text("caption"),
  isAiGenerated: boolean("isAiGenerated").notNull().default(false),
  status: mysqlEnum("publishStatus", PUBLISH_STATUSES).notNull().default("draft"),
  lastError: varchar("safeErrorMessage", { length: 512 }),
  lastInsightAt: timestamp("lastInsightAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  publishedAt: timestamp("publishedAt"),
}, table => ({
  clientRequestIdx: uniqueIndex("published_media_client_request_idx").on(table.clientRequestId),
  metaMediaIdx: index("published_media_meta_media_idx").on(table.metaMediaId),
  publishStatusIdx: index("published_media_publish_status_idx").on(table.status),
}));

export const insightSnapshots = mysqlTable("insight_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  mediaId: int("publishedMediaId").notNull(),
  reach: int("reach"),
  engagement: int("engagement"),
  impressions: int("impressions"),
  likes: int("likes"),
  comments: int("comments"),
  saves: int("saves"),
  capturedAt: timestamp("recordedAt").notNull().defaultNow(),
}, table => ({
  mediaRecordedIdx: index("insight_snapshots_media_recorded_idx").on(table.mediaId, table.capturedAt),
}));

/** Retained for existing audit data; Meta feature code does not write this table. */
export const operationLogs = mysqlTable("operation_logs", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 64 }).notNull(),
  operationType: varchar("operationType", { length: 96 }).notNull(),
  operationStatus: mysqlEnum("operationStatus", ["started", "succeeded", "failed"]).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: varchar("entityId", { length: 128 }),
  safeDetails: text("safeDetails"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, table => ({
  requestIdx: index("operation_logs_request_idx").on(table.requestId),
  createdAtIdx: index("operation_logs_created_at_idx").on(table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type KeywordRule = typeof keywordRules.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type PublishedMedia = typeof publishedMedia.$inferSelect;
export type InsightSnapshot = typeof insightSnapshots.$inferSelect;
