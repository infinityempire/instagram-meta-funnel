# Email reply draft — YouTube API Services

**Use:** Reply to the existing YouTube API Services email thread from the owner’s Gmail account. Do not send this draft from an unrelated account or through an automated mailer.

**Attachments to include:**

1. `YOUTUBE_UPLOAD_FLOW_EVIDENCE_EN.md` — the upload-flow reference and sanitized implementation script.
2. `YOUTUBE_API_SAMPLE_REPORT_EN.md` — the readable sample report.
3. `YOUTUBE_API_SAMPLE_REPORT.json` — the machine-readable sample report.

Do not attach secrets, environment files, OAuth client exports, refresh tokens, or database credentials.

---

Subject: Re: YouTube API Services Form — Additional Compliance Evidence

Hi YouTube API Services Team,

Thank you for reviewing the YouTube API Services request and for explaining what is needed to complete the review.

Please find attached the two requested items for the API client **Small Stories Hebrew Uploader**:

1. **Visual reference / upload-flow script**

The attached document describes the actual server-side upload flow and includes a sanitized implementation excerpt. The application uses the official YouTube Data API and a resumable upload session. The flow is: owner-authorized OAuth, server-side refresh-token exchange, metadata validation, `videos.insert` resumable session creation, MP4 transfer, and post-upload status verification.

The uploader rejects the request unless the metadata is set to `privacyStatus = private`, `selfDeclaredMadeForKids = true`, and `containsSyntheticMedia = true`. The completion path also rejects the result unless YouTube confirms the uploaded video as private. The service does not publish public videos, does not schedule public uploads, and does not serve third-party channels.

2. **Sample report of retrieved YouTube API data**

The attached report lists the five video records currently stored for the single authenticated channel owner and the status fields used by the application. All five records are private, Made for Kids, and marked as containing synthetic media.

The report also explains the current Analytics result accurately. There are no public videos in the application database, so the public-video Analytics refresh returned zero rows. We have intentionally not inserted sample views, likes, watch time, subscriber counts, or revenue values. No performance or revenue metrics are being represented as real when they have not been retrieved.

The application’s intended Analytics query uses the owner scope (`ids=channel==MINE`) and the following metrics when a permitted public video is available: `views`, `likes`, `estimatedMinutesWatched`, `averageViewDuration`, `averageViewPercentage`, `subscribersGained`, and `estimatedRevenue`.

All data access is limited to the authenticated owner’s own YouTube channel. Refresh tokens are encrypted at rest, credentials are not included in logs or reports, and the application does not sell, redistribute, or expose YouTube data to third parties.

Please let us know if you need a different format, a live owner-controlled demonstration, or any additional information to complete the compliance review. This is the correct technical contact email for the application.

Best regards,

Tal Derie
Small Stories Hebrew Uploader

---

## Final sending checklist

Before replying, the owner must verify that the attached Markdown and JSON files correspond to the current code and database state. The owner must send the email manually from the same account used for the YouTube API Services correspondence. Do not send until the attachments have been opened and checked.

Do not claim that the audit has passed, that the quota has been increased, or that public publishing is enabled. The only accurate status before a written YouTube decision is: **additional compliance evidence supplied; review pending**.

## Official references

[1] [YouTube Data API — Videos: insert](https://developers.google.com/youtube/v3/docs/videos/insert)  
[2] [YouTube Data API — Videos: list](https://developers.google.com/youtube/v3/docs/videos/list)  
[3] [YouTube Analytics API](https://developers.google.com/youtube/analytics)  
[4] [YouTube Data API — Quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)
