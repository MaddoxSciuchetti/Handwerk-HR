# Hosting

Staging and production run on Render. The API is a Render web service. Postgres is Render Managed Postgres. Env and secrets sit in the Render Dashboard. When the branch a service tracks updates, Render deploys it — details in [ci.cd.md](./ci.cd.md).

Decision: Host on a PaaS (Render), not a self-managed VPS.

Reason: We want deploys, TLS, logs, and managed Postgres without running our own servers. A VPS would mean patching the OS, wiring nginx, and owning backups by hand — more ops for a small team. Render auto-deploy + pre-deploy migrate is enough.

Decision: Ship the React client as a Render Static Site (Vite build), and the Express API as a long-running web service on the same PaaS.

Reason: The SPA is files after `vite build` — static hosting fits. Render serves that output over its CDN with Brotli (and gzip) and HTTP/2, so we do not wire compression in the React app. The API needs a process, env secrets, and a migrate step before start — that is PaaS, not static. Keeping both on Render means one dashboard for frontend, backend, and Postgres. Frontend optimization notes: [optimization.md](../frontend/optimization.md) §4.

Before that, the database was on Neon while the app lived somewhere else. Two providers meant two places to look, two places for secrets, and more room for mistakes. We moved Postgres onto Render so the app and the database stay with one host. Old Neon cutover notes are only history (`server/src/prisma/cutover/`).

For backups and how we scale the database, see [database](../database/Intro.md).
