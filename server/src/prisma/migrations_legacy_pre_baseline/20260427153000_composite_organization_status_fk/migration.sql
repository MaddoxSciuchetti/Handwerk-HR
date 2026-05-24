-- Composite FK from worker_engagements / issues -> organization_statuses (id, entity_type).
-- CHECK constraints freeze status_entity_type so engagements cannot reference issue statuses and vice versa.

-- 1) Child columns (idempotent for partially applied DBs)
ALTER TABLE "worker_engagements"
    ADD COLUMN IF NOT EXISTS "status_entity_type" TEXT NOT NULL DEFAULT 'engagement';

ALTER TABLE "issues"
    ADD COLUMN IF NOT EXISTS "status_entity_type" TEXT NOT NULL DEFAULT 'issue';

UPDATE "worker_engagements" SET "status_entity_type" = 'engagement' WHERE "status_entity_type" IS DISTINCT FROM 'engagement';
UPDATE "issues" SET "status_entity_type" = 'issue' WHERE "status_entity_type" IS DISTINCT FROM 'issue';

-- 2) Unique pair on parent (composite FK target)
CREATE UNIQUE INDEX IF NOT EXISTS "organization_statuses_id_entity_type_key"
    ON "organization_statuses" ("id", "entity_type");

-- 3) Drop legacy single-column FKs (Prisma default names)
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_id_fkey";
ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_id_fkey";

-- 4) CHECK constraints (drop first for idempotency)
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_entity_type_check";
ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_status_entity_type_check"
        CHECK ("status_entity_type" = 'engagement');

ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_entity_type_check";
ALTER TABLE "issues"
    ADD CONSTRAINT "issues_status_entity_type_check"
        CHECK ("status_entity_type" = 'issue');

-- 5) Composite foreign keys (names aligned with Prisma Migrate conventions)
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_id_status_entity_type_fkey";
ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_status_id_status_entity_type_fkey"
        FOREIGN KEY ("status_id", "status_entity_type")
        REFERENCES "organization_statuses" ("id", "entity_type")
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_id_status_entity_type_fkey";
ALTER TABLE "issues"
    ADD CONSTRAINT "issues_status_id_status_entity_type_fkey"
        FOREIGN KEY ("status_id", "status_entity_type")
        REFERENCES "organization_statuses" ("id", "entity_type")
        ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6) Supporting indexes for status_entity_type filters (matches Prisma @@index)
CREATE INDEX IF NOT EXISTS "worker_engagements_status_entity_type_idx"
    ON "worker_engagements" ("status_entity_type");

CREATE INDEX IF NOT EXISTS "issues_status_entity_type_idx"
    ON "issues" ("status_entity_type");
