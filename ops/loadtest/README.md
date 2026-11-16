# API load probe

Small Node script (no k6 install) that hammers one API path with N concurrent clients and prints p50/p95 + error rate.

## Safety

Defaults to `http://127.0.0.1:3000`. Non-local hosts need `LOADTEST_ALLOW_NON_LOCAL=1`. Prefer staging over production.

## Baseline (fixed concurrency)

```bash
# Public root (what UptimeRobot roughly does, but hotter)
LOADTEST_VUS=20 LOADTEST_DURATION_MS=15000 node ops/loadtest/run.mjs

# Authenticated /tasks (needs a real org user with subscription)
LOADTEST_EMAIL='you@example.com' \
LOADTEST_PASSWORD='…' \
LOADTEST_PATH=/tasks \
LOADTEST_VUS=20 \
node ops/loadtest/run.mjs
```

## Ramp until it hurts (ceiling)

Raises concurrency in steps until error rate > 5% or p95 > 2000 ms (configurable):

```bash
LOADTEST_MODE=ramp \
LOADTEST_STEP_VUS=10 \
LOADTEST_MAX_VUS=80 \
LOADTEST_DURATION_MS=10000 \
LOADTEST_EMAIL='you@example.com' \
LOADTEST_PASSWORD='…' \
LOADTEST_PATH=/tasks \
node ops/loadtest/run.mjs
```

## Env vars

| Variable | Default | Meaning |
|----------|---------|---------|
| `LOADTEST_BASE_URL` | `http://127.0.0.1:3000` | API origin |
| `LOADTEST_PATH` | `/` or `/tasks` if creds set | Path to hit |
| `LOADTEST_MODE` | `baseline` | `baseline` or `ramp` |
| `LOADTEST_VUS` | `10` | Fixed concurrency (baseline) |
| `LOADTEST_MAX_VUS` | `80` | Ramp ceiling |
| `LOADTEST_STEP_VUS` | `10` | Ramp step |
| `LOADTEST_DURATION_MS` | `15000` | How long each step runs |
| `LOADTEST_ERROR_BUDGET` | `0.05` | Stop ramp above this error rate |
| `LOADTEST_P95_BUDGET_MS` | `2000` | Stop ramp above this p95 |
| `LOADTEST_EMAIL` / `LOADTEST_PASSWORD` | — | Login for cookie auth |
| `LOADTEST_ALLOW_NON_LOCAL` | unset | Must be `1` for non-localhost |

Paste the printed JSON into the observability deep dive when you have numbers from staging.
