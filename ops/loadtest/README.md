# API load probe

Small Node script (no k6 install) that hammers one API path with N concurrent clients and prints p50/p95 + error rate.

How to run the probe, env vars, and the recorded staging baseline table live in `docs/backend/load-probe.md`. The script entrypoint is `ops/loadtest/run.mjs`.

## Safety

Defaults to `http://127.0.0.1:3000`. Non-local hosts need `LOADTEST_ALLOW_NON_LOCAL=1`. Prefer staging over production.

## Quick start

```bash
# Public root
LOADTEST_VUS=20 LOADTEST_DURATION_MS=15000 node ops/loadtest/run.mjs

# Authenticated /tasks
LOADTEST_EMAIL='you@example.com' \
LOADTEST_PASSWORD='…' \
LOADTEST_PATH=/tasks \
LOADTEST_VUS=20 \
node ops/loadtest/run.mjs
```
