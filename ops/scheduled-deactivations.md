# Scheduled account deactivation

Crewmeister and Microsoft deactivation dates are the employee's **last active day** in Europe/Berlin. The API selects dates strictly before today's Berlin calendar date. Production cron runs every five minutes; staging runs every minute for testing; outages, provider failures, and large backlogs can delay execution.

## Render configuration

| Environment | API service | Cron service |
| --- | --- | --- |
| Staging | `srv-d6dnk2vpm1nc739v1m90` | `crn-dbi59bjbc2fs73a5bnq0` |
| Production | `srv-d65pdtlum26s73eajoeg` | `crn-dbi59cgae00c73b95kgg` |

The jobs use separate random `CRON_SECRET` values, matched to their API service, and environment-specific schedules (staging `* * * * *`, production `*/5 * * * *`). They were created **suspended**, with `SCHEDULED_DEACTIVATIONS_ENABLED=false`, until rollout. Existing API services are in Oregon, so the cron jobs use Oregon too; region does not change the Berlin date calculation.

`configure-deactivation-cron.py` creates missing jobs idempotently using `RENDER_API_KEY`. It does not rotate existing secrets or modify existing cron jobs. No secrets are stored in this repository.

## Rollout

1. Deploy the migration and application to staging using the existing pre-deploy Prisma migration command.
2. Check that the new endpoint responds with 401 without its secret. Check an authenticated empty batch returns `{ processed: 0, succeeded: 0, failed: 0 }` before creating live schedules.
3. Set the staging cron's `SCHEDULED_DEACTIVATIONS_ENABLED=true` and resume it. Verify mixed immediate/scheduled tasks in the popup, task date edits, and a due Microsoft simulation task. Crewmeister requires a suitable test account for a live validation.
4. Deploy to production; verify the endpoint, then enable and resume its cron in the same way.

The Docker command is `/bin/sh /etc/secrets/scheduled-deactivations.sh`. The script is uploaded through Render secret files and reads credentials from environment variables at runtime. It sends an HTTP POST with a 10-second connection timeout and 240-second total timeout. HTTP errors, including partial execution failure (503), fail the cron run; Render run logs show the counts. The API logs individual issue IDs and outcomes. Inspect failed runs and task errors; correct the integration configuration or cancel the schedule as appropriate.

## Execution limits and recovery

Each request selects up to 25 tasks with five concurrent executions and stops starting additional tasks after two minutes. Oldest-updated due tasks run first, so repeated failures do not starve other dates. Each external request times out after ten seconds. Terminal tasks are excluded.

Manual and cron deactivation share a database claim. Active claims reject schedule edits and duplicate execution; crashed claims expire after ten minutes. Successful execution clears the date; failures retain it for the next run. Task history records the scheduling user and whether execution came from cron or a manual run.

To pause execution, suspend the relevant cron. Cancelling an individual schedule does not deactivate the account. Setting a task to done, cancelled, or not applicable excludes it from cron execution.
