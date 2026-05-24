# Production DB Cutover Runbook

One-time migration from legacy schema to the current Prisma schema while preserving BSB Gruppe production data.

## Neon branches (V2 pern_project)

| Branch | ID | Purpose |
|---|---|---|
| production | `br-muddy-dream-ad3r49m9` | Live production |
| development | `br-jolly-butterfly-ad4cpkd1` | Staging / dev |
| prod-backup-2026-05-24 | `br-long-pine-adzmuoak` | Pre-cutover snapshot |
| migration-rehearsal | `br-rapid-bonus-adox0tpv` | Validated dry run (PASS) |

**PITR:** Note timestamp in Neon console immediately before production cutover for point-in-time restore.

## Files

| File | Purpose |
|---|---|
| `00_preflight_snapshot.sql` | Read-only baseline (run on production first) |
| `01_quarantine_legacy.sql` | Rename legacy tables |
| `02_apply_target_schema.sh` | `prisma migrate deploy` (15 migrations) |
| `03_etl_legacy_to_new.sql` | Legacy → new data migration |
| `04_validate.sql` | Post-ETL checks (must show `PASS`) |
| `run_cutover.sh` | Runs steps 01 → 04 in sequence |
| `baseline/preflight-2026-05-24.md` | Saved production baseline |

## Pre-cutover checklist

- [ ] `00_preflight_snapshot.sql` run on production; output saved
- [ ] `prod-backup-*` branch exists
- [ ] PITR timestamp recorded
- [ ] Rehearsal branch shows `validation_result = PASS`
- [ ] App in maintenance mode (stop writes)
- [ ] New app build ready to deploy

## Production cutover

```bash
cd server
export DIRECT_URL="postgresql://..."   # production branch connection string
export DATABASE_URL="$DIRECT_URL"
bash src/prisma/cutover/run_cutover.sh
```

Expected validation output:
- 5 users, 2 workers, 2 engagements, 28 issues, 20 audit logs, 11 comments
- Bekir onboarding: 2 done / 3 in progress / 10 open
- Florim offboarding: 12 done / 0 in progress / 1 open
- Templates: Onboarding=15, Offboarding=13
- `validation_result = PASS`

After SQL cutover:
1. Deploy new application code
2. Verify login (Timo Janik + one worker account)
3. Verify worker lifecycle UI and task history
4. Disable maintenance mode
5. Notify users to re-login

## Rollback

1. **Fastest:** Neon PITR restore production to pre-cutover timestamp
2. **Backup branch:** `prod-backup-2026-05-24` (`br-long-pine-adzmuoak`)
3. **Partial failure:** Legacy data remains in `_legacy_*` tables until dropped in a follow-up migration
4. Re-deploy previous app version if schema rollback is needed

## Production cutover result (2026-05-24)

Production branch (`br-muddy-dream-ad3r49m9`) cutover completed successfully:
- `validation_result = PASS`
- All counts and engagement statuses match rehearsal
- Legacy tables preserved as `_legacy_*` for recovery

**Next steps for you:**
1. Deploy the new application code to production
2. Test login (users must re-login — sessions were not migrated)
3. Verify worker lifecycle and task history in the UI
4. Keep `prod-backup-2026-05-24` for at least 7 days

## Rehearsal result (2026-05-24)

Migration-rehearsal branch cutover completed successfully with the same validation output as production.

## Business rules applied

- Organization: `bsb-gruppe`
- Engagement responsible: Timo Janik (`cmmoxksr7000i2vnsd3enikpz`)
- Onboarding template IDs: 93–106, 109
- Offboarding template IDs: all other form_field_ids
- Sessions discarded (users re-login)
