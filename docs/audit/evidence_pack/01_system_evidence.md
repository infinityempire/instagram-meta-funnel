# System Evidence — Small Stories Hebrew

**Service:** Small Stories Hebrew YouTube Uploader  
**Google Cloud project:** `tal-derie-youtube-upload` (`855401426442`)  
**Public service URL:** https://instafunnel-lphz3bum.manus.space/

## Purpose and scope

Small Stories Hebrew is an internal creator tool for one authorized channel owner. The service uses the official YouTube Data API through owner-authorized OAuth to upload original Hebrew children’s short-form videos, manage only the owner’s video metadata, and read the owner’s own performance data. It is not a public SaaS product and does not provide API access to third parties.

## Implemented controls

| Control | Evidence |
|---|---|
| OAuth authorization | Signed short-lived state; protected callback; server-side authorization-code exchange. |
| Token protection | Refresh-token material is encrypted at rest and not exposed in the interface or logs. |
| Owner control | The owner can disconnect the channel; the stored authorization is revoked and removed. |
| Upload policy | Uploads default to Private. Public visibility changes require an explicit owner decision. |
| Children’s content | Child-directed uploads are marked Made for Kids, with AI-assisted-content disclosure where applicable. |
| Data use | The service does not scrape, resell, aggregate, or expose third-party YouTube data. |

## APIs and use cases

The service uses YouTube Data API v3 for private uploads and status verification, and YouTube Analytics API only for the authorized owner’s performance information. Current intended use is low-volume: a small number of original uploads per day and low-frequency status or analytics reads.

## Public policy references

- Privacy Policy: https://instafunnel-lphz3bum.manus.space/privacy
- Terms of Service: https://instafunnel-lphz3bum.manus.space/terms
