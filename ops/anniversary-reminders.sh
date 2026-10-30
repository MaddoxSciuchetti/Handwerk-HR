#!/bin/sh
set -eu

if [ "${ANNIVERSARY_REMINDERS_ENABLED:-false}" != true ]; then
    echo 'Anniversary reminders disabled.'
    exit 0
fi

: "${CRON_SECRET:?CRON_SECRET is required}"
: "${API_URL:?API_URL is required}"

exec curl --fail-with-body --silent --show-error \
    --connect-timeout 10 --max-time 240 \
    -X POST -H "Authorization: Bearer $CRON_SECRET" \
    "${API_URL%/}/internal/cron/anniversary-reminders"
