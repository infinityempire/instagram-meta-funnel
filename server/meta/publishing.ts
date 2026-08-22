import { z } from "zod";
import * as db from "../db";
import type { PublishedMedia, PublishStatus } from "../../drizzle/schema";
import { metaRequest, MetaNotConfiguredError, type MetaClientDeps } from "./client";
import { safeErrorMessage } from "./safeLog";

export const publishInputSchema = z.object({
  sourceUrl: z.string().url("Must be a valid URL").max(1024).refine(url => url.startsWith("https://"), "Media URL must be public HTTPS"),
  caption: z.string().max(2200).optional(),
  isAiGenerated: z.boolean().default(false),
});

type PublishInput = z.infer<typeof publishInputSchema>;
type PublishOutcome = { record: PublishedMedia; status: PublishStatus; message: string };
type ContainerStatus = { status_code?: string };

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function pollContainer(containerId: string, deps: MetaClientDeps & { sleep?: (ms: number) => Promise<void> }) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await metaRequest<ContainerStatus>(`${containerId}?fields=status_code`, { method: "GET", timeoutMs: 10_000 }, deps);
    if (response.status_code === "FINISHED") return "FINISHED" as const;
    if (response.status_code === "ERROR" || response.status_code === "EXPIRED") return "ERROR" as const;
    if (attempt < 4) await (deps.sleep ?? sleep)(3_000);
  }
  return "IN_PROGRESS" as const;
}

async function createContainer(input: PublishInput, deps: MetaClientDeps): Promise<string> {
  const config = deps.config;
  if (!config) throw new MetaNotConfiguredError();
  const response = await metaRequest<{ id?: string }>(`${config.instagramAccountId}/media`, {
    method: "POST",
    form: { media_type: "REELS", video_url: input.sourceUrl, caption: input.caption, is_ai_generated: input.isAiGenerated },
  }, deps);
  if (!response.id) throw new Error("Meta did not return a media container ID");
  return response.id;
}

async function publishContainer(containerId: string, deps: MetaClientDeps): Promise<string> {
  const config = deps.config;
  if (!config) throw new MetaNotConfiguredError();
  const response = await metaRequest<{ id?: string }>(`${config.instagramAccountId}/media_publish`, {
    method: "POST", form: { creation_id: containerId },
  }, deps);
  if (!response.id) throw new Error("Meta did not return a published media ID");
  return response.id;
}

/** This is invoked only by the explicit admin mutation; it is never scheduled. */
export async function createReelAndPublish(
  input: PublishInput,
  clientRequestId: string,
  deps: MetaClientDeps & { sleep?: (ms: number) => Promise<void> } = {},
): Promise<PublishOutcome> {
  const existing = await db.getPublishedMediaByRequestId(clientRequestId);
  if (existing) return { record: existing, status: existing.status, message: "Request already processed (idempotent)" };
  const record = await db.insertPublishedMedia({
    clientRequestId, sourceUrl: input.sourceUrl, caption: input.caption ?? null, isAiGenerated: input.isAiGenerated,
    mediaType: "REELS", status: "creating_container",
  });
  try {
    const containerId = await createContainer(input, deps);
    await db.updatePublishedMedia(record.id, { containerId, status: "processing" });
    const state = await pollContainer(containerId, deps);
    if (state === "FINISHED") {
      await db.updatePublishedMedia(record.id, { status: "ready" });
      const metaMediaId = await publishContainer(containerId, deps);
      const updated = await db.updatePublishedMedia(record.id, { metaMediaId, status: "published", lastError: null });
      return { record: updated!, status: "published", message: "Reel published to Instagram" };
    }
    if (state === "IN_PROGRESS") {
      const updated = await db.updatePublishedMedia(record.id, { status: "processing" });
      return { record: updated!, status: "processing", message: "Meta is still processing the video. Use Refresh status to continue." };
    }
    const updated = await db.updatePublishedMedia(record.id, { status: "failed", lastError: "Meta reported the media container as ERROR/EXPIRED" });
    return { record: updated!, status: "failed", message: "Meta could not process the media container" };
  } catch (error) {
    const safe = safeErrorMessage(error);
    const updated = await db.updatePublishedMedia(record.id, { status: "failed", lastError: safe });
    return { record: updated!, status: "failed", message: error instanceof MetaNotConfiguredError ? safe : `Publishing failed: ${safe}` };
  }
}

export async function refreshMediaStatus(
  mediaId: number,
  deps: MetaClientDeps & { sleep?: (ms: number) => Promise<void> } = {},
): Promise<PublishOutcome> {
  const record = await db.getPublishedMediaById(mediaId);
  if (!record) throw new Error("Media record not found");
  if (record.status === "published") return { record, status: "published", message: "Already published" };
  if (!record.containerId) return { record, status: record.status, message: "No container yet — nothing to refresh" };
  try {
    const response = await metaRequest<ContainerStatus>(`${record.containerId}?fields=status_code`, { method: "GET", timeoutMs: 10_000 }, deps);
    if (response.status_code === "FINISHED") {
      await db.updatePublishedMedia(record.id, { status: "ready" });
      const metaMediaId = await publishContainer(record.containerId, deps);
      const updated = await db.updatePublishedMedia(record.id, { metaMediaId, status: "published", lastError: null });
      return { record: updated!, status: "published", message: "Reel published to Instagram" };
    }
    if (response.status_code === "ERROR" || response.status_code === "EXPIRED") {
      const updated = await db.updatePublishedMedia(record.id, { status: "failed", lastError: `Meta container status: ${response.status_code}` });
      return { record: updated!, status: "failed", message: "Meta could not process the media container" };
    }
    return { record, status: record.status, message: `Container still processing (${response.status_code ?? "unknown"})` };
  } catch (error) {
    const safe = safeErrorMessage(error);
    await db.updatePublishedMedia(record.id, { lastError: safe });
    throw new Error(safe);
  }
}
