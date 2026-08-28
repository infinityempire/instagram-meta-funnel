# YouTube API Services — Sample Retrieved Data Report

**API client:** Small Stories Hebrew Uploader  
**Google Cloud project:** `tal-derie-youtube-upload`  
**Report date:** 2026-08-28  
**Scope:** the single owner’s channel only

## Executive summary

The application retrieves video status through the official YouTube Data API `videos.list` endpoint after upload. It is also prepared to retrieve targeted owner-level performance metrics through the official YouTube Analytics API. At the time of this report, the application database contains five uploaded videos and all five are recorded as private, Made for Kids, and synthetic-media disclosed.

There are no public videos in the application database. Consequently, the public-video Analytics refresh returned zero rows and no performance or revenue values are asserted in this report. This is an availability result, not a fabricated zero-performance claim.

## Stored upload/status records

The following records are the actual five YouTube video records currently stored by the application. The IDs and titles are included to make the report auditable; no OAuth credentials or tokens are included.

```json
{
  "source": "application youtube_videos table",
  "record_count": 5,
  "videos": [
    {
      "videoId": "D0v0k88WUP0",
      "title": "פיצי הענן והפרח הצמא",
      "storyWorld": "פיצי הענן",
      "sourceFilename": "P2_pitzi_flower_final.mp4",
      "visibility": "private",
      "madeForKids": true,
      "containsSyntheticMedia": true,
      "uploadedAt": "2026-08-26 04:57:39"
    },
    {
      "videoId": "NqcUNh8SlIs",
      "title": "לולי הארנבת והירח הקטן",
      "storyWorld": "לולי הארנבת",
      "sourceFilename": "L1_luli_moon_synced.mp4",
      "visibility": "private",
      "madeForKids": true,
      "containsSyntheticMedia": true,
      "uploadedAt": "2026-08-26 04:57:40"
    },
    {
      "videoId": "cqsnDTa6vqs",
      "title": "לולי הארנבת והבועה הקופצת",
      "storyWorld": "לולי הארנבת",
      "sourceFilename": "L2_luli_bubble_precise_sync.mp4",
      "visibility": "private",
      "madeForKids": true,
      "containsSyntheticMedia": true,
      "uploadedAt": "2026-08-26 04:57:40"
    },
    {
      "videoId": "OAOAiCiLPvQ",
      "title": "טומי הרכבת מחפש צבע צהוב",
      "storyWorld": "טומי הרכבת",
      "sourceFilename": "T1_tommy_yellow_final.mp4",
      "visibility": "private",
      "madeForKids": true,
      "containsSyntheticMedia": true,
      "uploadedAt": "2026-08-26 04:57:41"
    },
    {
      "videoId": "N6g_8rBvk2k",
      "title": "טומי הרכבת והענן הממהר",
      "storyWorld": "טומי הרכבת",
      "sourceFilename": "T2_tommy_cloud_final.mp4",
      "visibility": "private",
      "madeForKids": true,
      "containsSyntheticMedia": true,
      "uploadedAt": "2026-08-26 04:57:41"
    }
  ]
}
```

## API operation represented by the report

For each video ID, the status verification path calls:

```text
GET https://www.googleapis.com/youtube/v3/videos
    ?part=status
    &id=<owner-video-id>
Authorization: Bearer <short-lived access token>
```

The application reads the returned `privacyStatus`, `madeForKids`, and `selfDeclaredMadeForKids` fields. It does not expose the access token or refresh token in the report.

## Analytics availability result

The application’s Analytics refresh function is intentionally limited to videos recorded as public. The current query found no public videos:

```json
{
  "analyticsEndpoint": "https://youtubeanalytics.googleapis.com/v2/reports",
  "queryScope": "ids=channel==MINE",
  "dimensions": "video",
  "metrics": [
    "views",
    "likes",
    "estimatedMinutesWatched",
    "averageViewDuration",
    "averageViewPercentage",
    "subscribersGained",
    "estimatedRevenue"
  ],
  "publicVideosAvailableForRefresh": 0,
  "rowsRetrieved": 0,
  "revenueReported": false,
  "reason": "All five stored videos are private; the application does not claim public performance metrics for private drafts."
}
```

This empty Analytics result is included deliberately to show the current extent of API usage. Once an authorized public video exists and a permitted Analytics query is run, the report will contain the returned rows and the observation date. Until then, there are no genuine views, retention, subscriber, or revenue metrics to report.

## Data handling and restrictions

All retrieved data concerns the authenticated owner’s own channel. The application does not request or report other creators’ data, does not sell YouTube data, and does not provide a public API service. Refresh tokens are encrypted at rest, and credentials are omitted from logs and reports.

## Official references

[1] [YouTube Data API — Videos: list](https://developers.google.com/youtube/v3/docs/videos/list)  
[2] [YouTube Analytics API](https://developers.google.com/youtube/analytics)  
[3] [YouTube Analytics API — Data model](https://developers.google.com/youtube/analytics/data_model)  
[4] [YouTube Data API — Quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)
