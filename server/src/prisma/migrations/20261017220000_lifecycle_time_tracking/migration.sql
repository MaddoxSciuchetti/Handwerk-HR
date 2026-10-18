BEGIN;

ALTER TABLE "worker_engagements" ADD COLUMN "started_at" TIMESTAMPTZ;
ALTER TABLE "issues" ADD COLUMN "started_at" TIMESTAMPTZ, ADD COLUMN "completed_at" TIMESTAMPTZ;

-- Elapsed turnaround time includes waiting, starting when the record is created.
UPDATE "worker_engagements" SET "started_at" = "created_at";
UPDATE "issues" SET "started_at" = "created_at";
ALTER TABLE "worker_engagements" ALTER COLUMN "started_at" SET NOT NULL, ALTER COLUMN "started_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "issues" ALTER COLUMN "started_at" SET NOT NULL, ALTER COLUMN "started_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Restore known completion events only. updated_at is not a completion timestamp.
UPDATE "issues" AS i SET "completed_at" = history."completed_at"
FROM (
    SELECT "issue_id", MAX("created_at") AS "completed_at"
    FROM "issue_audit_logs"
    WHERE "new_value"->>'status' = 'done'
      AND ("old_value"->>'status') IS DISTINCT FROM 'done'
    GROUP BY "issue_id"
) AS history
WHERE i."id" = history."issue_id" AND i."status" = 'done'
  AND history."completed_at" >= i."started_at";
UPDATE "worker_engagements" SET "completed_at" = NULL WHERE "status" <> 'completed';

-- Database triggers cover every writer, including bulk updates and automations.
CREATE FUNCTION track_lifecycle_elapsed_time() RETURNS TRIGGER AS $$
DECLARE
    final_status TEXT := TG_ARGV[0];
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.started_at := NEW.created_at;
        IF NEW.status::text = final_status THEN
            NEW.completed_at := COALESCE(NEW.completed_at, CURRENT_TIMESTAMP);
        ELSE
            NEW.completed_at := NULL;
        END IF;
    ELSE
        NEW.started_at := OLD.started_at;
        IF NEW.status::text <> final_status THEN
            NEW.completed_at := NULL;
        ELSIF OLD.status::text <> final_status THEN
            NEW.completed_at := CURRENT_TIMESTAMP;
        ELSE
            -- Editing an already completed record must not change its duration.
            NEW.completed_at := OLD.completed_at;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER worker_engagement_elapsed_time
BEFORE INSERT OR UPDATE ON "worker_engagements"
FOR EACH ROW EXECUTE FUNCTION track_lifecycle_elapsed_time('completed');

CREATE TRIGGER issue_elapsed_time
BEFORE INSERT OR UPDATE ON "issues"
FOR EACH ROW EXECUTE FUNCTION track_lifecycle_elapsed_time('done');

COMMIT;
