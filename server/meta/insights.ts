import * as db from "../db";
import type { InsightSnapshot } from "../../drizzle/schema";
import { metaRequest, MetaNotConfiguredError, type MetaClientDeps } from "./client";
import { safeErrorMessage } from "./safeLog";

type InsightsApiResponse = { data?: Array<{ name?: string; values?: Array<{ value?: number }> }> };
const METRICS = ["reach", "impressions", "likes", "comments", "saved", "shares"] as const;

function metricValue(data: InsightsApiResponse["data"], name: string): number | null {
  const value = data?.find(metric => metric.name === name)?.values?.[0]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function refreshInsightsForMedia(mediaId: number, deps: MetaClientDeps = {}): Promise<{ snapshot: InsightSnapshot }> {
  const record = await db.getPublishedMediaById(mediaId);
  if (!record) throw new Error("Media record not found");
  if (record.status !== "published" || !record.metaMediaId) throw new Error("Insights are only available for published media");
  try {
    const response = await metaRequest<InsightsApiResponse>(`${record.metaMediaId}/insights?metric=${METRICS.join(",")}`, { method: "GET" }, deps);
    const likes = metricValue(response.data, "likes");
    const comments = metricValue(response.data, "comments");
    const saves = metricValue(response.data, "saved");
    const shares = metricValue(response.data, "shares");
    const parts = [likes, comments, saves, shares].filter((value): value is number => value !== null);
    const snapshot = await db.insertInsightSnapshot({
      mediaId: record.id, reach: metricValue(response.data, "reach"), impressions: metricValue(response.data, "impressions"),
      likes, comments, saves, engagement: parts.length ? parts.reduce((left, right) => left + right, 0) : null,
    });
    await db.updatePublishedMedia(record.id, { lastInsightAt: new Date() });
    return { snapshot };
  } catch (error) {
    if (error instanceof MetaNotConfiguredError) throw error;
    throw new Error(safeErrorMessage(error));
  }
}
