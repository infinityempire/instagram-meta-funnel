# OpenHands Implementation Prompt — Instagram Meta Funnel

You are the implementation engineer for a production-grade, premium admin platform named **Instagram Meta Funnel**. Build the platform in the existing repository at:

```text
/home/ubuntu/instagram-meta-funnel
```

Your job is to implement the code, tests, dashboard, documentation, and a safe private GitHub push. A separate operator will later configure Meta, complete the OAuth/account ownership steps, add secrets through the platform’s secure secret manager, and approve any real public publishing action.

## Non-negotiable operating rules

1. Use **only official Meta Graph API / Instagram Platform APIs**. Do not use Playwright, Selenium, browser automation, scraping, CAPTCHA workarounds, simulated users, undocumented APIs, or any approach that imitates a person.
2. Do not create or send real Instagram posts, DMs, or WhatsApp funnel requests during development unless the operator explicitly configures the required secrets and manually triggers the action from the admin dashboard.
3. Never hardcode, commit, log, render, return to the client, or print secrets. This includes access tokens, app secrets, webhook verify tokens, OAuth codes, WhatsApp funnel URLs, passwords, and API responses that may contain them.
4. Use the existing full-stack TypeScript project, its Express server, Drizzle/MySQL database, tRPC API, built-in authentication, and existing React/Tailwind/shadcn components. Do not replace the scaffold or build a parallel project.
5. Use the existing `todo.md`. Mark an item complete only after it is implemented and tested; do not delete any item.
6. Do not seed fake leads, fake webhook events, fake insights, fake posts, fake reviews, or fake success states. Empty states must say that the real integration is not yet configured.

## Business goal

Build an elegant, secure Instagram automation and management platform for one owned **Instagram professional account** using the official **Business Login for Instagram / Instagram API with Instagram Login** route. It must provide:

- Meta webhook verification and signed notification handling.
- Official Reels/content publishing workflow.
- Keyword-triggered Instagram DM lead capture and forwarding to an existing WhatsApp funnel webhook.
- Auditable lead, webhook, media, and insight logs.
- Admin-only dashboard with status feedback and charted insights.
- A clean setup path for a future official Meta OAuth connection.

The product is an internal operator dashboard, not a public consumer site.

## Required Meta-oriented configuration

Create server-only configuration validation for these environment variables. Do not expose their values to the frontend; only return a boolean readiness/status summary to authenticated admins.

```text
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_ACCESS_TOKEN=
META_INSTAGRAM_ACCOUNT_ID=
META_GRAPH_API_VERSION=v26.0
WHATSAPP_FUNNEL_WEBHOOK_URL=
```

Create a `.env.example` that lists the names only, with blank values. Ensure `.env` remains ignored by Git. If a secret is absent, features must return an explicit `not_configured` status instead of throwing a raw error or leaking configuration details.

## Official Meta constraints to preserve

- The account must be an Instagram professional account; the account owner later configures it in Meta for Developers.
- Use `graph.instagram.com` for the selected direct Instagram login route.
- Meta webhook verification is a GET request using `hub.mode`, `hub.verify_token`, and `hub.challenge`.
- Meta event notifications use `X-Hub-Signature-256` with a SHA-256 HMAC based on the raw request body and the app secret.
- Content publishing requires a media container, a bounded status check for `status_code`, and a `media_publish` call only after a ready container is confirmed.
- Reels use `media_type=REELS`. Support `is_ai_generated` as an explicit manual form option.
- Media used through `video_url` must be publicly accessible when Meta fetches it.
- Publishing must be an explicit admin action. Do not schedule automatic public publishing.

## Database work

The repository schema already contains these tables. Verify they exist and preserve/extend them only through proper Drizzle migrations:

- `webhook_events`: safe/deduplicated Meta notifications with verification state, event type, status, timestamps, and safe summaries.
- `keyword_rules`: operator-managed keyword triggers.
- `leads`: Instagram-scoped ID, keyword, delivery status, attempts, safe error summary, timestamps.
- `published_media`: request ID, media container ID, Meta media ID, type, source URL, caption, AI flag, status, safe errors, timestamps.
- `insight_snapshots`: append-only reach, engagement, impressions, likes, comments, saves, timestamp.

Implement database helpers in `server/db.ts`. Use transactional or idempotent logic as needed. Meta webhook payloads may be retried, so use a stable SHA-256 dedupe key and avoid duplicate lead delivery on duplicate events.

## Server architecture and implementation requirements

### 1. Meta configuration and safe logging

Create a small `server/meta/` module family. Suggested files:

```text
server/meta/config.ts
server/meta/safeLog.ts
server/meta/retry.ts
server/meta/client.ts
server/meta/webhooks.ts
server/meta/publishing.ts
server/meta/insights.ts
server/meta/leadForwarding.ts
```

Use server-side `fetch` with an `AbortController` timeout and bounded retry logic. Retry only retryable network failures and suitable `408`, `429`, and `5xx` responses. Use no more than three attempts with exponential backoff. Capture only a short, token-scrubbed error summary.

Implement a reusable `redactSensitive` / `safeErrorMessage` function that removes bearer tokens, query-string access tokens, app secrets, and authorization headers from all logs and admin-visible errors.

### 2. Public webhook endpoint

Register the Meta route before generic JSON parsing so the raw request body remains available.

```text
GET  /api/meta/webhook
POST /api/meta/webhook
```

For GET:

- Validate `hub.mode === "subscribe"`.
- Compare `hub.verify_token` to `META_VERIFY_TOKEN` in a timing-safe way.
- Return the exact `hub.challenge` with status 200 only when valid; otherwise 403.

For POST:

- Use route-specific raw-body middleware for `application/json`.
- Verify `X-Hub-Signature-256` using SHA-256 HMAC and `META_APP_SECRET` with timing-safe comparison.
- Return 401 for invalid/missing signatures without writing unsafe payload contents.
- Store a safe summary and dedupe key, acknowledge valid requests quickly with 200, and process the payload safely.
- Detect Instagram messaging entries in a defensive, schema-tolerant way.
- Match active `keyword_rules` case-insensitively against incoming message text.
- For each matched lead, persist a `leads` record and forward a minimal lead payload to `WHATSAPP_FUNNEL_WEBHOOK_URL` with bounded retry. The forwarded body may include `instagramScopedUserId`, `triggerKeyword`, `occurredAt`, and a non-sensitive source label. Do not forward full private message text by default.

### 3. Publishing service

Implement a server-only service invoked only by an admin tRPC mutation.

Required form inputs:

```text
sourceUrl: valid public HTTPS media URL
caption: optional text
isAiGenerated: boolean
mediaType: initially REELS only in the UI
```

Required state flow:

```text
draft -> creating_container -> processing -> ready -> published
                                     \-> failed
```

Implementation flow:

1. Validate the admin input with Zod.
2. Create a `published_media` record using a unique `clientRequestId`.
3. Call `POST /<IG_ID>/media` with `media_type=REELS`, `video_url`, caption, `is_ai_generated`, and server token.
4. Store the returned container ID.
5. Poll `GET /<CONTAINER_ID>?fields=status_code` with a strict bounded attempt count and delay that fits normal request execution. If it remains `IN_PROGRESS`, return the current saved status so the operator can run a manual status refresh; do not hold requests indefinitely.
6. When `FINISHED`, call `POST /<IG_ID>/media_publish` with `creation_id`.
7. Store the returned Meta media ID and a `published` status.
8. Persist only safe error messages on failure and return user-friendly status feedback.

Never publish automatically after a future timer. The final publish request must happen only inside the explicitly invoked admin mutation.

### 4. Insights service

Implement an admin-triggered refresh for a selected published media record. Fetch available official metrics for the media, normalise missing metrics to `null`, append a snapshot to `insight_snapshots`, and update `lastInsightAt`.

The UI should graph available `reach` and `engagement` values over time. It must render a clear empty state when no real data exists.

### 5. Admin tRPC API

Use `adminProcedure` for all dashboard operations. At minimum include procedures for:

```text
meta.getConfigurationStatus
dashboard.getSummary
webhooks.list
leads.list
keywords.list
keywords.create
keywords.setActive
keywords.remove
media.list
media.createReelAndPublish
media.refreshStatus
media.refreshInsights
insights.forMedia
```

Use pagination/limits for logs. Validate every input with Zod. Do not return full raw payloads, secrets, or raw Meta errors.

## Admin dashboard requirements

Use the existing `DashboardLayout` component and replace placeholder navigation with a polished, premium admin UI. Maintain a dark, refined editorial look: deep ink/navy surfaces, subtle cool-gray layers, restrained violet or teal emphasis, crisp typography, generous spacing, no gaudy gradients, and accessible contrast.

Implement these primary sections:

| Section | Purpose |
|---|---|
| Overview | Configuration readiness, total leads, delivery success rate, published media count, latest webhook status, and a small insight trend chart. |
| Publish Reel | Manual form for source URL, caption, `is_ai_generated` toggle, pre-flight validation, operation status, and clear API result/error feedback. |
| Leads | Paginated lead table with time, scoped user ID, matched keyword, delivery status, attempt count, and safe error information. |
| Webhooks | Paginated event log with received time, event type, valid-signature status, processing state, and safe summary. |
| Media & Insights | Published media table plus selected-post charts for reach and engagement snapshots. |
| Keywords | Add, enable/disable, and remove DM keyword rules. |
| Settings | Read-only connection readiness cards. Never display secret values. |

All screens must have robust loading, empty, success, and error states. Status must be visible and understandable without inspecting logs. Buttons that perform external actions must show progress and disable while pending.

## Tests and quality gates

Write or update Vitest tests for at least:

1. Valid and invalid webhook GET verification.
2. Valid and invalid HMAC SHA-256 signature handling.
3. Token-safe error redaction.
4. Keyword matching and duplicate-event suppression.
5. Lead forwarding retry limits and delivered/failed state transitions using mocked HTTP.
6. Publish request validation, processing state transitions, and an AI-generated flag being passed in the request body.
7. The admin-only tRPC authorization boundary.

Run all of:

```bash
pnpm check
pnpm test
```

Fix any failures before committing. Use the preview to inspect the dashboard and correct layout issues. Do not include screenshots with any secret values.

## README and handoff

Write a concise but complete `README.md` covering:

- What the platform does and its official-API-only policy.
- Required Meta setup for the direct Instagram professional route.
- Required permissions and the distinction between development testing and production/advanced access.
- Exact public callback URL pattern: `https://<deployment-domain>/api/meta/webhook`.
- Required secret names, but never values.
- How to add keywords, create a manual Reel publish operation, inspect webhooks, refresh insights, and troubleshoot common statuses.
- The fact that the user must manually approve public publishing in the dashboard.

## GitHub delivery requirement

When all code, migrations, tests, README, and `todo.md` updates are complete:

1. Review `git status` and confirm no `.env`, tokens, secrets, temporary exports, or logs are staged.
2. Commit with a clear message such as `feat: implement secure Meta Instagram funnel platform`.
3. Create or use a **private** GitHub repository named `instagram-meta-funnel` under the authenticated owner.
4. Push the completed code to the private repository using `gh` / GitHub CLI. Never paste a PAT into commands, files, or commit history.
5. Return the private repository URL, the final commit hash, successful `pnpm check` and `pnpm test` results, and a concise list of implementation files.

## Definition of done

The code is complete only when the application has secure server-side Meta configuration handling, HMAC-validated public webhook verification, persistent audit logs, DM keyword lead forwarding with retry, manual Reels publishing state management, insights snapshots/charts, a polished admin dashboard, tested admin authorization, a README, and a clean private GitHub push. Do not fabricate any real Meta connection or insight data; represent unconfigured services transparently.
