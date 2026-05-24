-- CreateEnum
CREATE TYPE "EngagementProgress" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Build id -> enum mapping from legacy engagement_statuses rows
CREATE TEMP TABLE _engagement_status_map AS
SELECT
    es.id,
    CASE
        WHEN LOWER(TRIM(es.name)) IN ('ausstehend', 'pending', 'planned', 'open', 'todo') THEN 'pending'::"EngagementProgress"
        WHEN LOWER(TRIM(es.name)) IN ('in arbeit', 'in bearbeitung', 'in progress', 'in_progress') THEN 'in_progress'::"EngagementProgress"
        WHEN LOWER(TRIM(es.name)) IN ('abgeschlossen', 'completed', 'done', 'closed') THEN 'completed'::"EngagementProgress"
        WHEN LOWER(TRIM(es.name)) IN ('abgebrochen', 'cancelled', 'canceled') THEN 'cancelled'::"EngagementProgress"
        WHEN es.is_default THEN 'pending'::"EngagementProgress"
        WHEN es.order_index = (
            SELECT MAX(es2.order_index)
            FROM engagement_statuses es2
            WHERE es2.organization_id = es.organization_id
        ) THEN 'completed'::"EngagementProgress"
        ELSE 'in_progress'::"EngagementProgress"
    END AS enum_status
FROM engagement_statuses es;

-- Add new status column on worker_engagements
ALTER TABLE "worker_engagements" ADD COLUMN "status" "EngagementProgress";

-- Migrate engagement rows
UPDATE "worker_engagements" we
SET "status" = m.enum_status
FROM _engagement_status_map m
WHERE we.status_id = m.id;

-- Default any unmigrated rows
UPDATE "worker_engagements" SET "status" = 'pending'::"EngagementProgress" WHERE "status" IS NULL;

ALTER TABLE "worker_engagements" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "worker_engagements" ALTER COLUMN "status" SET DEFAULT 'pending';

-- Drop legacy FK and column
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_id_fkey";
DROP INDEX IF EXISTS "worker_engagements_status_id_idx";
ALTER TABLE "worker_engagements" DROP COLUMN "status_id";

CREATE INDEX "worker_engagements_status_idx" ON "worker_engagements"("status");

-- Drop engagement_statuses table and trigger
DROP TRIGGER IF EXISTS set_updated_at ON "engagement_statuses";
DROP TABLE "engagement_statuses";
