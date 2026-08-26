# Small Stories Hebrew — YouTube API Compliance Evidence

## Public Policy URLs

Privacy Policy: https://instafunnel-lphz3bum.manus.space/privacy

Terms of Service: https://instafunnel-lphz3bum.manus.space/terms

## API Client

Small Stories Hebrew Creator Console is an internal creator tool for an authorized channel owner. The tool uses Google OAuth to upload original creator-owned child-directed video drafts, record authorized metadata, verify private upload status, and read authorized performance data.

The client defaults to private uploads. Public visibility changes require an explicit owner decision and remain subject to YouTube API restrictions and policy review.

## OAuth and Data Controls

OAuth authorization is initiated by a short-lived signed launch link. The callback validates a signed state and a short-lived secure cookie before exchanging an authorization code server-side. Refresh tokens are encrypted at rest and never rendered in the application UI or logged.

The owner can disconnect YouTube at any time. Disconnecting revokes the Google token and removes the encrypted connection record. The application does not collect passwords, Google verification codes, viewer profiles, or comments.

## Child-Directed Content Controls

Every prepared upload is forced to `privacyStatus=private`, `selfDeclaredMadeForKids=true`, and `containsSyntheticMedia=true` before any request is made. A pre-publication checklist covers narration synchronization, scene continuity, pacing, visual defects, child-directed setting, and synthetic-media disclosure.

## Current Authorized Uses

1. Video Uploading & Account Management
2. Tools for Creators
3. Internal Company Tool
4. Analytics & Reporting

## YouTube API Services

The service is subject to the YouTube Terms of Service and Google Privacy Policy.
