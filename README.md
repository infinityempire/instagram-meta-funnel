# Instagram Meta Funnel

An admin-only dashboard for one owned Instagram professional account. It uses the official Meta Graph API only; it does not use scraping, browser automation, CAPTCHA workarounds, or simulated users.

## What it does

The application verifies Instagram webhook notifications with a raw-body HMAC SHA-256 check, stores a privacy-safe event summary, matches incoming DM text against operator-managed keywords, and forwards a minimal lead payload to a configured WhatsApp funnel endpoint with no more than three attempts. It also supports manual Reel publishing and manual Insight snapshot refreshes. Nothing is scheduled to publish automatically.

## Required account setup

1. Convert the owned Instagram account to **Creator** or **Business**.
2. Create a Meta app in Meta for Developers and add the Instagram Login / Instagram API product.
3. Configure the callback URL as `https://<published-domain>/api/meta/webhook` and subscribe to the required Instagram message events.
4. Add the account owner as an app role for development testing. Advanced access/App Review is required if the app will serve accounts outside app roles.

The typical permissions for this single-account flow are `instagram_business_basic`, `instagram_business_manage_messages`, and `instagram_business_content_publish`. Meta may alter permission labels or review requirements; use the current Meta developer dashboard as the authority during setup.

## Server-only configuration

Enter values through the project's secure Secrets management interface only. Do not commit values or paste them into code, database records, logs, or chat messages.

| Environment variable | Purpose |
| --- | --- |
| `META_APP_ID` | Meta app identifier. |
| `META_APP_SECRET` | Webhook HMAC secret. |
| `META_VERIFY_TOKEN` | Token chosen for the webhook challenge. |
| `META_ACCESS_TOKEN` | Server-side token for the owned Instagram professional account. |
| `META_INSTAGRAM_ACCOUNT_ID` | Instagram professional account ID. |
| `META_GRAPH_API_VERSION` | API version; defaults to `v26.0`. |
| `WHATSAPP_FUNNEL_WEBHOOK_URL` | Internal endpoint that receives minimal matched-lead payloads. |

## Verification

Run `pnpm test` and `pnpm check`. The dashboard's Settings screen lists only missing variable names, never values. For local resource notes, see [BUILD_VERIFICATION.md](./BUILD_VERIFICATION.md). For route-level empty-state verification, see [QA_VERIFICATION.md](./QA_VERIFICATION.md).
