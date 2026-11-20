# GLOBAL — education website

Production: https://global-education.uz (Sites / Cloudflare Workers, D1 binding `DB`).

`main` originally contained only project notes. `global-website` contains the incomplete source snapshot (commit `3ba7e8d`); this readiness branch carries the complete review candidate. See [global-site/README.md](global-site/README.md) for installation, configuration, migrations, security and Telegram delivery semantics.

The Sites project is `appgprj_6ad1f83321a88191abeb7d874a607329`. On 2026-11-12 `get_site` reported active, version 18 and the production URL above. Listing saved versions was denied (`project_not_found`), so the live commit, runtime secrets and database schema could not be verified. The GitHub snapshot is **not verified as the exact live deployment source**. The former `easyloom8.chatgpt.site` URL and “owner-private” assertion are historical, not current verified settings.

Telegram was absent from the snapshot; the previous README's “enabled” claim was unsupported. This branch implements delivery, but does not configure or deploy it. Production was left untouched. Review the PR into `main`; merging is not deployment authorization.

The existing GLOBAL design, contact phones, programs, 11th-grade section and no-guarantee admission wording are retained. No real credentials belong in this repository.
