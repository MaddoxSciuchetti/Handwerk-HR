-- Add CHECK constraints that cannot be expressed in Prisma schema language.

-- worker_engagements: when both start_date and end_date are present,
-- end_date must be on or after start_date. Allow either or both to be NULL.
ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_date_range_check"
    CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "end_date" >= "start_date");

-- absences: end_date must be on or after start_date. Both columns are NOT NULL.
ALTER TABLE "absences"
    ADD CONSTRAINT "absences_date_range_check"
    CHECK ("end_date" >= "start_date");

-- absences: substitute_id cannot equal user_id. Allow substitute_id to be NULL.
ALTER TABLE "absences"
    ADD CONSTRAINT "absences_substitute_not_self_check"
    CHECK ("substitute_id" IS NULL OR "substitute_id" <> "user_id");
