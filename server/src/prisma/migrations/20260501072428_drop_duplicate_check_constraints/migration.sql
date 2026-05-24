-- Drop the duplicate CHECK constraints added in 20260501072057_add_check_constraints.
-- Equivalent constraints already exist from 20260430200000_restructure_statuses_comments_and_audit
-- (worker_engagements_dates_check, absences_dates_check, absences_no_self_substitute).

ALTER TABLE "worker_engagements"
    DROP CONSTRAINT IF EXISTS "worker_engagements_date_range_check";

ALTER TABLE "absences"
    DROP CONSTRAINT IF EXISTS "absences_date_range_check";

ALTER TABLE "absences"
    DROP CONSTRAINT IF EXISTS "absences_substitute_not_self_check";
