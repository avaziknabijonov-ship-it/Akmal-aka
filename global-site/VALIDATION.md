# Readiness verification — 2026-11-12

## Repository and hosting evidence

- `origin/main`: notes-only README; `origin/global-website`: source snapshot `3ba7e8d`.
- No tracked `scripts/` or `build/` helpers in any fetched Git history. Snapshot README explicitly refers to build tools retained elsewhere.
- Sites `get_site` returned project `appgprj_6ad1f83321a88191abeb7d874a607329`, active, version 18, https://global-education.uz. Access policy and current-user role were null. `list_site_versions` returned `project_not_found`: the live source SHA, deployment record and runtime settings remain unverified.
- No Sites writes, deployment, remote D1 migration, secret changes or production form submissions were performed.
- Removed unused header-only auth helper and root `worker.js` placeholder to avoid accidental use.

## Executed checks

- Fresh `npm ci` from `package-lock.json`.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Nine assertions/tests in three test files: strict request validation, real streamed size limits (including forged Content-Length), owner authentication and forged headers, CSV injection, notification concurrency and retry uncertainty, schema/data preservation, idempotent insertion and rate-limit expiry. Each file was also executed directly with `node --import tsx tests/<file>.test.ts` to expose individual results.
- `npm run db:generate`: no schema changes after generating and tracking migration 0001 and its snapshot/journal.
- `npm run db:migrate:local`: migrations 0000 and 0001 both applied to local D1 successfully. No production database access.
- Built Worker HTTP smoke tests: `/` and `/privacy` 200; `/admin`, `/api/admin/export` and `/api/admin/retry` reject forged owner email headers with 401 and no-store. Synthetic local owner credential: admin and CSV return 200; retry rejects foreign Origin with 403 and accepts local Origin with 303 redirect. Missing required form configuration returns 503 without inserting data. Authenticated tests uncovered and fixed the start command's local D1 persistence path.
- `git diff --check`; repository text scan for Telegram token patterns, GitHub credential patterns and private-key headers: no matches. Generated output, dependencies, local DB and environment files are ignored. This scan is a bounded check, not proof that every possible secret format is absent.

## Limits

Build emits nonfatal Vinext chunk/import optimization warnings. A local development Worker restart caused one transient 503 during smoke tests; the same request passed after startup settled. Production Telegram credentials, Turnstile setup, runtime secrets, delivery and actual schema were not tested. Telegram transport was mocked; local SQL and D1 checks were real. No real application or notification was created.

Browser interaction with the real Turnstile widget was not verified; HTTP smoke tests and static checks do not establish browser integration. Before separately authorized release, review privacy settings, owner credential distribution, D1 migration ledger/backup, approved hostname and bot destination in an isolated staging environment.

Telegram Bot API cannot guarantee exactly-once eventual delivery after uncertain outcomes. This implementation avoids automatic duplicates using a durable claim and manual reconciliation for `unknown`/stale `sending`; full eventual delivery in those cases requires owner action. See README for the recovery procedure.
