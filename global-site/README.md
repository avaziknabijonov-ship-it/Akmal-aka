# GLOBAL source and readiness

Production: https://global-education.uz. Hosting: Sites on Cloudflare Workers, project `appgprj_6ad1f83321a88191abeb7d874a607329`, D1 binding `DB`. See [repository status](../README.md). This branch is a review candidate, not a deployment. No production settings or data were changed.

## Reproducible local build

The original commit copied app sources but omitted `scripts/`, `build/` and a lockfile; Git history contains no versions of those helpers. Its own README says tooling was retained in the separate Sites repository. The snapshot therefore could not build independently. This branch replaces those private helper imports with official Vinext and Cloudflare Vite plugins and tracks the Worker entrypoint. No missing helper downloads are required.

Use Node 22.13+ (validated with Node 24.22.1), npm 11:

```sh
cd global-site
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run db:migrate:local
npm start
```

`npm run dev` starts Vite. `npm start` serves the built Worker locally; neither publishes. `wrangler.jsonc` has only a placeholder LOCAL database ID. Do not deploy this configuration to replace production. Build output is `dist/server/index.js` and `dist/client`; tracked `.openai/hosting.json` preserves the Sites ID and binding. Sites publication requires reviewed source, packaging that includes both outputs, and a separate explicitly authorized deployment workflow.

Configure local runtime values in ignored `.dev.vars` (Wrangler) or `.env` as supported by Vite. Never put values in a VITE-prefixed variable. Local origins and Turnstile hostname settings must match; use Cloudflare's documented test keys only in local testing. Production form submission depends on Cloudflare's edge-provided `CF-Connecting-IP`, so non-Cloudflare local submissions fail closed unless exercised in a local Worker test with a simulated header.

## External configuration required before any future rollout

Secrets (runtime only):

- `ADMIN_PASSWORD`: random high-entropy owner password, at least 32 characters. Browser Basic authentication username is `owner`. HTTPS is required; rotate to revoke access. No email/header bypass or mock auth exists. Only distribute this credential to the owner; the application cannot establish the real-world owner's identity for you.
- `TELEGRAM_BOT_TOKEN`: bot credential. Never logged or embedded in client code.
- `TURNSTILE_SECRET_KEY`: server-side Turnstile verification secret.
- `RATE_LIMIT_SALT`: random secret for hashing edge IP addresses.

Other runtime settings:

- `TELEGRAM_CHAT_ID`: private owner destination; keep as a secret if desired. Grant bot permission in that chat. No message is sent until both Telegram settings exist.
- `TURNSTILE_SITE_KEY`: public widget key. Configure allowed hostname, action `lead`.
- `PUBLIC_ORIGIN`: exact canonical origin, e.g. `https://global-education.uz`, without trailing slash.
- `PRIVACY_CONTROLLER`, `PRIVACY_CONTACT`, `PRIVACY_RETENTION`: owner-provided legal entity/controller, data-rights contact and retention period. These facts were not supplied; do not invent them. The form fails closed until all are supplied. Owner must establish and operate deletion/retention procedures; no automatic retention job is claimed.

Never request or paste real secrets into a PR. Configure runtime values only through the host's secret/settings interface after a separately authorized rollout.

## Database and rollout prerequisites

Keep `DB` bound to D1. Migrations: `0000_wooden_epoch.sql` creates leads; `0001_flaky_colossus.sql` adds notification state, unique request ID, and rate limits. Drizzle journal/snapshot and schema agree. Local migration command above touches only local state. Before a future production migration: inspect actual schema and migration ledger, take a D1 backup, and reconcile any existing unrecorded `leads` table. Do not blindly replay `0000` against an existing table. No remote migration was run in this task.

Existing leads become `pending`; review whether historical notifications should be sent before running retries. D1 is the durable source of truth. Telegram delivery happens after insertion; Telegram failure does not delete or roll back a lead. UI success means saved in D1, not delivered to Telegram.

## Delivery and retries

Each browser submission retains a UUID until success; D1's unique `request_id` prevents another row on response-loss retries. Turnstile is single-use, so obtain a fresh challenge for every retry. The endpoint deliberately returns no lead data or public lookup ID.

Notification states visible in `/admin`: `pending` (including unconfigured Telegram), `sending`, `sent`, `failed` (explicit Telegram 4xx rejection), `unknown` (timeout, malformed response, 5xx or uncertain delivery). Attempts, safe error codes and message IDs are stored. An atomic D1 claim prevents concurrent sends; sent rows are never automatically sent again. Raw Telegram errors and bot URLs are never logged by application code.

Owner presses “Повторить pending / failed” to process up to 10 oldest eligible rows. This is the durable manual retry mechanism; no background scheduler is configured or claimed. Fix 401/403 configuration before retrying and respect Telegram 429 cooldown. A future external scheduler may call the same protected POST endpoint with owner authentication and exact `Origin: PUBLIC_ORIGIN`, but must be separately authorized and configured.

**Telegram Bot API has no idempotency key. Exactly-once eventual delivery cannot be guaranteed across a network timeout or a crash after Telegram accepts a message but before D1 records it.** To avoid duplicates, `unknown` and stale `sending` are never automatically retried. The owner must search the private chat for the application UUID. If found, reconcile its message ID and mark `sent` via a protected D1 administration workflow. Only after confirming non-delivery may the owner reset to `pending`; a mistaken reset can duplicate a message. Uncertain outcomes remain visible for manual resolution instead of silently losing the application.

## Security and privacy

Body bytes are counted from the actual stream (4 KiB), independent of Content-Length. Server validates types, lengths, phone digits, program enum, consent, honeypot, UUID and unknown fields. Exact origin checking, server-verified Turnstile hostname/action and an atomic D1 limit of 5 requests per edge IP per 10 minutes protect the public endpoint. Hashes expire after 10 minutes and are cleaned on subsequent submissions. Cloudflare must be the trusted ingress supplying `CF-Connecting-IP`; do not expose the Worker through a proxy that preserves arbitrary visitor values. Turnstile is mandatory even if headers are forged. Shared-IP users may need to wait or call the listed phone numbers.

`oai-authenticated-user-*` headers are never accepted as admin authentication. All admin routes check the owner secret; the Worker challenges before rendering and responses use `no-store`. Retry POST checks origin against CSRF. Admin and CSV export page through 50 rows with deterministic ordering; exports are authenticated and neutralize spreadsheet formulas. Basic auth credentials remain in browser memory until the browser session closes; use a dedicated owner browser profile and close it on shared devices. CSV files contain personal data: store and delete them according to the owner's policy. No public lead listing exists.

The consent links `/privacy`, describing data fields, D1, Telegram and Turnstile. Missing legal/retention facts are explicitly configuration requirements. Hosting access policy, live secrets, legal compliance and actual Telegram credentials were not inspected or changed.

## Validation

See [VALIDATION.md](VALIDATION.md) for executed checks and limitations. Unit tests cover forged admin headers, credentials, streamed byte limits, validation, CSV escaping and Telegram claim/retry/uncertain-result behavior. Live Telegram and production form tests are intentionally excluded to avoid real notifications or personal-data writes.
