# Anniversary reminder emails

Once per day the cron job asks the API for company jubilees whose milestone (5 / 10 / 15 / 20 / 25 years from `entry_date`) falls on **today in Europe/Berlin**. Eligible workers match the Team/Cockpit rules (completed onboarding or transfer, not already exited). Each active org member receives one Resend email (`EMAIL_SENDER`) listing that org’s jubilees. Sends are recorded in `anniversary_reminders_sent` so retries do not spam.

## Render configuration

| Environment | API service | Cron schedule (UTC) |
| --- | --- | --- |
| Staging | `srv-d6dnk2vpm1nc739v1m90` | `0 6 * * *` (07:00/08:00 Berlin) |
| Production | `srv-d65pdtlum26s73eajoeg` | `0 6 * * *` (07:00/08:00 Berlin) |

Jobs reuse each environment’s existing `CRON_SECRET` on the API. They are created **suspended**, with `ANNIVERSARY_REMINDERS_ENABLED=false`, until rollout. Cron services use the same region as the API (Oregon).

`configure-anniversary-cron.py` creates missing jobs idempotently using `RENDER_API_KEY`. It does not rotate existing secrets or modify existing cron jobs. No secrets are stored in this repository.

## Rollout

1. Deploy the migration and application (pre-deploy Prisma migrate as usual).
2. Check that `POST /internal/cron/anniversary-reminders` returns 401 without the secret, and `{ processed: 0, succeeded: 0, failed: 0 }` with the secret on a day with no due jubilees.
3. Create the cron with `configure-anniversary-cron.py`, set staging `ANNIVERSARY_REMINDERS_ENABLED=true`, resume it, and verify a test jubilee email.
4. Enable and resume production the same way.

The Docker command is `/bin/sh /etc/secrets/anniversary-reminders.sh`. The script is uploaded through Render secret files and reads credentials from environment variables at runtime. HTTP errors, including partial execution failure (503), fail the cron run.

## Pause

Suspend the Render cron job, or set `ANNIVERSARY_REMINDERS_ENABLED=false`.
