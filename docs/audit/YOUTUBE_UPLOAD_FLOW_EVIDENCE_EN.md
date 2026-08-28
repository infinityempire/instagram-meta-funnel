# YouTube API Compliance Evidence
## Upload flow for Small Stories Hebrew Uploader

**API client:** Small Stories Hebrew Uploader  
**Project:** `tal-derie-youtube-upload`  
**Flow:** owner-authorized OAuth → encrypted server-side refresh token → resumable `videos.insert` → private-only response verification

## Purpose and scope

Small Stories Hebrew Uploader is an internal tool for one channel owner. It uses the official YouTube Data API to upload original Hebrew children’s videos and to verify the resulting video status. The tool does not expose YouTube API access to third parties, does not use browser automation, and does not upload on behalf of unrelated channels.

All children’s videos are submitted with `status.privacyStatus = "private"`, `status.selfDeclaredMadeForKids = true`, and `status.containsSyntheticMedia = true`. The server rejects an upload request if any of these three values is not present and correct.

## Actual server flow

1. The owner authorizes the application through Google OAuth. The OAuth state is short-lived and signed. The returned refresh token is encrypted before database persistence. The raw refresh token is not included in logs or API responses.
2. The server decrypts the stored refresh token only in memory and exchanges it server-side at `https://oauth2.googleapis.com/token` for a short-lived access token.
3. The server validates the upload request. Only a non-empty local MP4 file is accepted. Only private, Made-for-Kids, AI-disclosed metadata is accepted.
4. The server creates a resumable upload session with:
   `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
5. The request sends the video metadata as JSON and receives a resumable `Location` URL from YouTube.
6. The server streams the MP4 bytes to the resumable URL with an authenticated `PUT` request.
7. The server accepts completion only when YouTube returns a video ID and `status.privacyStatus = "private"`. Otherwise the upload is treated as a failure.
8. The application records only safe metadata such as the source filename, YouTube video ID, title, story world, visibility, child-directed flag, synthetic-media disclosure, and timestamps.
9. A separate `videos.list?part=status&id=...` verification path reads the returned status and exposes only the status fields needed for the owner’s internal dashboard.

## Sanitized implementation excerpt

The following excerpt is a simplified, secret-free summary of the implementation. The production source uses the same request sequence and controls, with project-specific helpers omitted here for readability. OAuth client credentials, refresh tokens, access tokens, database URLs, and encryption keys are intentionally omitted.

```ts
const RESUMABLE_ENDPOINT =
  "https://www.googleapis.com/upload/youtube/v3/videos" +
  "?uploadType=resumable&part=snippet,status";

function validatePrivateMetadata(metadata) {
  if (
    metadata.status.privacyStatus !== "private" ||
    metadata.status.selfDeclaredMadeForKids !== true ||
    metadata.status.containsSyntheticMedia !== true
  ) {
    throw new Error("Only private, made-for-kids uploads with AI disclosure are allowed");
  }
}

async function startResumableUpload(accessToken, metadata, fileSize) {
  const response = await fetch(RESUMABLE_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-type": "video/mp4",
      "x-upload-content-length": String(fileSize),
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) throw new Error(`Upload session failed: HTTP ${response.status}`);
  const uploadUrl = response.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube returned no resumable upload location");
  return uploadUrl;
}

async function completeUpload(uploadUrl, filePath, fileSize) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": "video/mp4",
      "content-length": String(fileSize),
    },
    body: readableVideoStream(filePath), // simplified name for the production stream helper
  });

  if (!response.ok) throw new Error(`Video transfer failed: HTTP ${response.status}`);
  const result = await response.json();
  if (!result.id || result.status?.privacyStatus !== "private") {
    throw new Error("YouTube did not confirm a private uploaded video");
  }
  return { videoId: result.id, privacyStatus: "private" };
}
```

## Example request body used by the uploader

```json
{
  "snippet": {
    "title": "<original Hebrew children’s-story title>",
    "description": "<owner-approved description>",
    "tags": ["Hebrew children stories", "Shorts"],
    "categoryId": "22",
    "defaultLanguage": "he"
  },
  "status": {
    "privacyStatus": "private",
    "selfDeclaredMadeForKids": true,
    "containsSyntheticMedia": true
  }
}
```

The angle-bracket values above are placeholders for the structure only; no fictitious title or upload ID is presented as an actual API event.

## Safety controls

The uploader is deliberately narrower than a general YouTube management tool. It does not contain a public-visibility publishing path, does not schedule public uploads, and does not change an existing video from private to public. It logs a basename and a safe error summary rather than credentials or authorization responses.

## Official references

[1] [YouTube Data API — Videos: insert](https://developers.google.com/youtube/v3/docs/videos/insert)  
[2] [YouTube Data API — Upload a video](https://developers.google.com/youtube/v3/guides/uploading_a_video)  
[3] [YouTube Data API — Quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)
