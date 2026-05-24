-- Postgres enum for organization_statuses.entity_type + child status_entity_type columns.
-- Keeps CHECK constraints aligned with enum literals.

-- Drop dependent FKs and indexes first
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_id_status_entity_type_fkey";
ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_id_status_entity_type_fkey";

DROP INDEX IF EXISTS "organization_statuses_id_entity_type_key";

ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_entity_type_check";
ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_entity_type_check";

DO $$ BEGIN
    CREATE TYPE "StatusEntityKind" AS ENUM ('engagement', 'issue');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "organization_statuses"
    ALTER COLUMN "entity_type" TYPE "StatusEntityKind"
    USING ("entity_type"::text::"StatusEntityKind");

ALTER TABLE "worker_engagements"
    ALTER COLUMN "status_entity_type" DROP DEFAULT,
    ALTER COLUMN "status_entity_type" TYPE "StatusEntityKind"
        USING ("status_entity_type"::text::"StatusEntityKind"),
    ALTER COLUMN "status_entity_type" SET DEFAULT 'engagement'::"StatusEntityKind";

ALTER TABLE "issues"
    ALTER COLUMN "status_entity_type" DROP DEFAULT,
    ALTER COLUMN "status_entity_type" TYPE "StatusEntityKind"
        USING ("status_entity_type"::text::"StatusEntityKind"),
    ALTER COLUMN "status_entity_type" SET DEFAULT 'issue'::"StatusEntityKind";

CREATE UNIQUE INDEX IF NOT EXISTS "organization_statuses_id_entity_type_key"
    ON "organization_statuses" ("id", "entity_type");

ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_status_entity_type_check"
        CHECK ("status_entity_type" = 'engagement'::"StatusEntityKind");

ALTER TABLE "issues"
    ADD CONSTRAINT "issues_status_entity_type_check"
        CHECK ("status_entity_type" = 'issue'::"StatusEntityKind");

ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_status_id_status_entity_type_fkey"
        FOREIGN KEY ("status_id", "status_entity_type")
        REFERENCES "organization_statuses" ("id", "entity_type")
        ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "issues"
    ADD CONSTRAINT "issues_status_id_status_entity_type_fkey"
        FOREIGN KEY ("status_id", "status_entity_type")
        REFERENCES "organization_statuses" ("id", "entity_type")
        ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "worker_engagements_status_entity_type_idx"
    ON "worker_engagements" ("status_entity_type");

CREATE INDEX IF NOT EXISTS "issues_status_entity_type_idx"
    ON "issues" ("status_entity_type");
