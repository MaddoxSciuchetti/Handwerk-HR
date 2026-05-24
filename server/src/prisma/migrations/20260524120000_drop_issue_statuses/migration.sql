-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('open', 'in_progress', 'done', 'cancelled');

-- Build id -> enum mapping from legacy issue_statuses rows
CREATE TEMP TABLE _issue_status_map AS
SELECT
    ist.id,
    CASE
        WHEN LOWER(TRIM(ist.name)) IN ('offen', 'open', 'todo') THEN 'open'::"IssueStatus"
        WHEN LOWER(TRIM(ist.name)) IN ('in arbeit', 'in bearbeitung', 'in progress') THEN 'in_progress'::"IssueStatus"
        WHEN LOWER(TRIM(ist.name)) IN ('erledigt', 'done', 'completed', 'closed') THEN 'done'::"IssueStatus"
        WHEN LOWER(TRIM(ist.name)) IN ('abgebrochen', 'cancelled', 'canceled') THEN 'cancelled'::"IssueStatus"
        WHEN ist.is_default THEN 'open'::"IssueStatus"
        WHEN ist.order_index = (
            SELECT MAX(ist2.order_index)
            FROM issue_statuses ist2
            WHERE ist2.organization_id = ist.organization_id
        ) THEN 'done'::"IssueStatus"
        ELSE 'in_progress'::"IssueStatus"
    END AS enum_status
FROM issue_statuses ist;

-- Add new status column on issues
ALTER TABLE "issues" ADD COLUMN "status" "IssueStatus";

-- Migrate issue rows
UPDATE "issues" i
SET "status" = m.enum_status
FROM _issue_status_map m
WHERE i.status_id = m.id;

-- Default any unmigrated rows (should not happen if FK was intact)
UPDATE "issues" SET "status" = 'open'::"IssueStatus" WHERE "status" IS NULL;

ALTER TABLE "issues" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "issues" ALTER COLUMN "status" SET DEFAULT 'open';

-- Drop legacy FK and column
ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_id_fkey";
DROP INDEX IF EXISTS "issues_status_id_idx";
ALTER TABLE "issues" DROP COLUMN "status_id";

CREATE INDEX "issues_status_idx" ON "issues"("status");

-- Migrate audit log JSONB: statusId (UUID) -> status (enum string)
UPDATE "issue_audit_logs" l
SET "old_value" = (
    l.old_value - 'statusId'
) || jsonb_build_object(
    'status',
    COALESCE(
        (SELECT m.enum_status::text FROM _issue_status_map m WHERE m.id = l.old_value->>'statusId'),
        l.old_value->>'statusId'
    )
)
WHERE l.old_value IS NOT NULL
  AND l.old_value ? 'statusId';

UPDATE "issue_audit_logs" l
SET "new_value" = (
    l.new_value - 'statusId'
) || jsonb_build_object(
    'status',
    COALESCE(
        (SELECT m.enum_status::text FROM _issue_status_map m WHERE m.id = l.new_value->>'statusId'),
        l.new_value->>'statusId'
    )
)
WHERE l.new_value IS NOT NULL
  AND l.new_value ? 'statusId';

-- Drop issue_statuses table and trigger
DROP TRIGGER IF EXISTS set_updated_at ON "issue_statuses";
DROP TABLE "issue_statuses";
