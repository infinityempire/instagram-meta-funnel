import * as db from "../db";
import { logSafe, safeErrorMessage } from "../meta/safeLog";
import { getYouTubeAccessToken } from "./uploader";

const ANALYTICS_REPORTS_ENDPOINT = "https://youtubeanalytics.googleapis.com/v2/reports";
const METRICS = [
  "views",
  "likes",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "averageViewPercentage",
  "subscribersGained",
  "estimatedRevenue",
].join(",");

type AnalyticsReport = {
  columnHeaders?: Array<{ name?: string }>;
  rows?: Array<Array<string | number>>;
};

export type YouTubeMetricValues = {
  videoId: string;
  views: number;
  likes: number;
  estimatedMinutesWatched: number;
  averageViewDurationSeconds: number;
  averageViewPercentageBasisPoints: number;
  subscribersGained: number;
  estimatedRevenueMicros: number;
};

const numberValue = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Converts an official Analytics response into safe integer snapshot values. */
export function parseAnalyticsReport(report: AnalyticsReport): YouTubeMetricValues[] {
  const headers = report.columnHeaders?.map(header => header.name ?? "") ?? [];
  const index = (name: string) => headers.indexOf(name);
  const at = (row: Array<string | number>, name: string) => {
    const position = index(name);
    return position >= 0 ? row[position] : 0;
  };

  return (report.rows ?? []).map(row => ({
    videoId: String(at(row, "video")),
    views: Math.round(numberValue(at(row, "views"))),
    likes: Math.round(numberValue(at(row, "likes"))),
    estimatedMinutesWatched: Math.round(numberValue(at(row, "estimatedMinutesWatched"))),
    averageViewDurationSeconds: Math.round(numberValue(at(row, "averageViewDuration"))),
    averageViewPercentageBasisPoints: Math.round(numberValue(at(row, "averageViewPercentage")) * 100),
    subscribersGained: Math.round(numberValue(at(row, "subscribersGained"))),
    estimatedRevenueMicros: Math.round(numberValue(at(row, "estimatedRevenue")) * 1_000_000),
  })).filter(row => row.videoId);
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Refreshes metrics for public videos only. It cannot publish or change visibility. */
export async function refreshPublicYouTubeMetrics(ownerOpenId: string): Promise<{ refreshed: number; revenueMicros: number }> {
  const videos = await db.listYouTubeVideos(ownerOpenId, "public");
  if (videos.length === 0) return { refreshed: 0, revenueMicros: 0 };

  try {
    const accessToken = await getYouTubeAccessToken(ownerOpenId);
    const today = new Date();
    const earliest = videos.reduce((value, video) => !value || (video.publicAt && video.publicAt < value) ? (video.publicAt ?? video.uploadedAt) : value, null as Date | null) ?? today;
    const params = new URLSearchParams({
      ids: "channel==MINE",
      startDate: dateOnly(earliest),
      endDate: dateOnly(today),
      metrics: METRICS,
      dimensions: "video",
      filters: `video==${videos.map(video => video.youtubeVideoId).join(",")}`,
    });
    const response = await fetch(`${ANALYTICS_REPORTS_ENDPOINT}?${params}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(`YouTube Analytics report failed with HTTP ${response.status}`);
    const metrics = parseAnalyticsReport(await response.json() as AnalyticsReport);
    const recordByVideoId = new Map(videos.map(video => [video.youtubeVideoId, video]));
    let refreshed = 0;
    let revenueMicros = 0;
    for (const metric of metrics) {
      const video = recordByVideoId.get(metric.videoId);
      if (!video) continue;
      await db.insertYouTubeMetricSnapshot({ youtubeVideoRowId: video.id, ...metric });
      refreshed += 1;
      revenueMicros += metric.estimatedRevenueMicros;
    }
    logSafe("info", "YouTube public metrics refreshed", { refreshed, revenueMicros });
    return { refreshed, revenueMicros };
  } catch (error) {
    logSafe("error", "YouTube public metrics refresh failed", { error: safeErrorMessage(error) });
    throw error;
  }
}
