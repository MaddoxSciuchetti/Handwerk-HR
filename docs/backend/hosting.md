# Hosting

Staging and production run on Render. The API is a Render web service. Postgres is Render Managed Postgres. Env and secrets sit in the Render Dashboard. When the branch a service tracks updates, Render deploys it — details in [ci.cd.md](./ci.cd.md).

Before that, the database was on Neon while the app lived somewhere else. Two providers meant two places to look, two places for secrets, and more room for mistakes. We moved Postgres onto Render so the app and the database stay with one host. Old Neon cutover notes are only history (`server/src/prisma/cutover/`).

For backups and how we scale the database, see [database](../database/Intro.md).
