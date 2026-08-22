import { randomUUID } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getMetaConfigStatus } from "./meta/config";
import { refreshInsightsForMedia } from "./meta/insights";
import { MetaNotConfiguredError } from "./meta/client";
import { createReelAndPublish, publishInputSchema, refreshMediaStatus } from "./meta/publishing";
import { safeErrorMessage } from "./meta/safeLog";

const paginationSchema = z.object({ limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().min(0).default(0) });

function toTrpcError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof MetaNotConfiguredError) return new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: safeErrorMessage(error) });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(options => options.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  meta: router({
    getConfigurationStatus: adminProcedure.query(() => getMetaConfigStatus()),
  }),
  dashboard: router({
    getSummary: adminProcedure.query(async () => {
      const [summary, trend] = await Promise.all([db.getDashboardSummary(), db.getRecentInsightTrend(30)]);
      return { ...summary, configuration: getMetaConfigStatus(), insightTrend: trend.map(snapshot => ({
        capturedAt: snapshot.capturedAt, reach: snapshot.reach, engagement: snapshot.engagement,
      })) };
    }),
  }),
  webhooks: router({
    list: adminProcedure.input(paginationSchema).query(async ({ input }) => ({
      items: (await db.listWebhookEvents(input.limit, input.offset)).map(row => ({
        id: Number(row.id), eventType: row.eventType, signatureValid: row.signatureValid, status: row.status,
        summary: row.summary, receivedAt: row.receivedAt, processedAt: row.processedAt,
      })), ...input,
    })),
  }),
  leads: router({
    list: adminProcedure.input(paginationSchema).query(async ({ input }) => ({
      items: (await db.listLeads(input.limit, input.offset)).map(row => ({
        id: Number(row.id), instagramScopedUserId: row.instagramScopedUserId, keyword: row.keyword,
        deliveryStatus: row.deliveryStatus, attempts: row.attempts, lastError: row.lastError, occurredAt: row.occurredAt,
      })), ...input,
    })),
  }),
  keywords: router({
    list: adminProcedure.query(async () => (await db.listKeywords()).map(row => ({ id: Number(row.id), keyword: row.keyword, active: row.active, createdAt: row.createdAt }))),
    create: adminProcedure.input(z.object({ keyword: z.string().trim().min(1).max(128) })).mutation(async ({ input }) => {
      const rule = await db.createKeyword(input.keyword);
      return { id: Number(rule.id), keyword: rule.keyword, active: rule.active };
    }),
    setActive: adminProcedure.input(z.object({ id: z.number().int().positive(), active: z.boolean() })).mutation(async ({ input }) => {
      await db.setKeywordActive(input.id, input.active); return { ok: true };
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await db.removeKeyword(input.id); return { ok: true };
    }),
  }),
  media: router({
    list: adminProcedure.input(paginationSchema).query(async ({ input }) => ({
      items: (await db.listPublishedMedia(input.limit, input.offset)).map(row => ({
        id: Number(row.id), clientRequestId: row.clientRequestId, mediaType: row.mediaType, sourceUrl: row.sourceUrl,
        caption: row.caption, isAiGenerated: row.isAiGenerated, status: row.status, lastError: row.lastError,
        metaMediaId: row.metaMediaId, lastInsightAt: row.lastInsightAt, createdAt: row.createdAt,
      })), ...input,
    })),
    createReelAndPublish: adminProcedure.input(publishInputSchema).mutation(async ({ input }) => {
      try {
        const outcome = await createReelAndPublish(input, randomUUID());
        return { status: outcome.status, message: outcome.message, mediaId: Number(outcome.record.id) };
      } catch (error) { throw toTrpcError(error); }
    }),
    refreshStatus: adminProcedure.input(z.object({ mediaId: z.number().int().positive() })).mutation(async ({ input }) => {
      try { const outcome = await refreshMediaStatus(input.mediaId); return { status: outcome.status, message: outcome.message }; }
      catch (error) { throw toTrpcError(error); }
    }),
    refreshInsights: adminProcedure.input(z.object({ mediaId: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        const { snapshot } = await refreshInsightsForMedia(input.mediaId);
        return { capturedAt: snapshot.capturedAt, reach: snapshot.reach, engagement: snapshot.engagement,
          impressions: snapshot.impressions, likes: snapshot.likes, comments: snapshot.comments, saves: snapshot.saves };
      } catch (error) { throw toTrpcError(error); }
    }),
  }),
  insights: router({
    forMedia: adminProcedure.input(z.object({ mediaId: z.number().int().positive() })).query(async ({ input }) =>
      (await db.listInsightSnapshots(input.mediaId)).map(snapshot => ({ capturedAt: snapshot.capturedAt, reach: snapshot.reach,
        engagement: snapshot.engagement, impressions: snapshot.impressions, likes: snapshot.likes, comments: snapshot.comments, saves: snapshot.saves }))),
  }),
});

export type AppRouter = typeof appRouter;
