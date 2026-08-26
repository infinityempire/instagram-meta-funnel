import { describe, expect, it } from "vitest";
import { parseAnalyticsReport } from "./analytics";

describe("YouTube Analytics report parsing", () => {
  it("converts official report values into integer snapshots", () => {
    const rows = parseAnalyticsReport({
      columnHeaders: [
        { name: "video" }, { name: "views" }, { name: "likes" }, { name: "estimatedMinutesWatched" },
        { name: "averageViewDuration" }, { name: "averageViewPercentage" }, { name: "subscribersGained" }, { name: "estimatedRevenue" },
      ],
      rows: [["video-1", 20, 3, 11.4, 8.6, 91.25, 2, 1.23]],
    });

    expect(rows).toEqual([{
      videoId: "video-1", views: 20, likes: 3, estimatedMinutesWatched: 11,
      averageViewDurationSeconds: 9, averageViewPercentageBasisPoints: 9125,
      subscribersGained: 2, estimatedRevenueMicros: 1_230_000,
    }]);
  });
});
