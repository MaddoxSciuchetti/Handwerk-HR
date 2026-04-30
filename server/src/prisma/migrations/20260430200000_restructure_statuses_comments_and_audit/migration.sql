-- CreateEnum
CREATE TYPE "AuditSource" AS ENUM ('user', 'webhook', 'system');

-- CreateTable engagement_statuses / issue_statuses
CREATE TABLE "engagement_statuses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "engagement_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "issue_statuses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issue_statuses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "engagement_statuses_organization_id_name_key" ON "engagement_statuses"("organization_id", "name");
CREATE INDEX "engagement_statuses_organization_id_idx" ON "engagement_statuses"("organization_id");

CREATE UNIQUE INDEX "issue_statuses_organization_id_name_key" ON "issue_statuses"("organization_id", "name");
CREATE INDEX "issue_statuses_organization_id_idx" ON "issue_statuses"("organization_id");

ALTER TABLE "engagement_statuses" ADD CONSTRAINT "engagement_statuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_statuses" ADD CONSTRAINT "issue_statuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Split organization_statuses into engagement vs issue (preserve ids for existing FK targets)
INSERT INTO "engagement_statuses" ("id", "organization_id", "name", "order_index", "is_default", "created_at", "updated_at")
SELECT "id", "organization_id", "name", "order_index", "is_default", "created_at", "updated_at"
FROM "organization_statuses"
WHERE "entity_type" = 'engagement';

INSERT INTO "issue_statuses" ("id", "organization_id", "name", "order_index", "is_default", "created_at", "updated_at")
SELECT "id", "organization_id", "name", "order_index", "is_default", "created_at", "updated_at"
FROM "organization_statuses"
WHERE "entity_type" = 'issue';

-- Drop composite FKs from engagements/issues → organization_statuses
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_status_id_status_entity_type_fkey";
ALTER TABLE "issues" DROP CONSTRAINT IF EXISTS "issues_status_id_status_entity_type_fkey";

DROP INDEX IF EXISTS "worker_engagements_status_entity_type_idx";
DROP INDEX IF EXISTS "issues_status_entity_type_idx";

ALTER TABLE "worker_engagements" DROP COLUMN IF EXISTS "status_entity_type";
ALTER TABLE "issues" DROP COLUMN IF EXISTS "status_entity_type";

ALTER TABLE "worker_engagements" ADD CONSTRAINT "worker_engagements_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "engagement_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "issue_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "organization_statuses";

DROP TYPE "StatusEntityKind";

-- Comments: immutable shape (drop threading / edited_at)
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_parent_comment_id_fkey";
DROP INDEX IF EXISTS "comments_parent_comment_id_idx";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "parent_comment_id";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "edited_at";

-- Subscription audit log
CREATE TABLE "subscription_audit_logs" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "source" "AuditSource" NOT NULL DEFAULT 'user',
    "action" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscription_audit_logs_subscription_id_idx" ON "subscription_audit_logs"("subscription_id");
CREATE INDEX "subscription_audit_logs_created_at_idx" ON "subscription_audit_logs"("created_at");

ALTER TABLE "subscription_audit_logs" ADD CONSTRAINT "subscription_audit_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_audit_logs" ADD CONSTRAINT "subscription_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Engagement date ordering
ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_dates_check"
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);

-- Absence date ordering
ALTER TABLE "absences"
    ADD CONSTRAINT "absences_dates_check"
    CHECK (end_date >= start_date);

-- No self-substitution in absences
ALTER TABLE "absences"
    ADD CONSTRAINT "absences_no_self_substitute"
    CHECK (substitute_id IS NULL OR user_id != substitute_id);

-- Comments are immutable: block any UPDATE
CREATE OR REPLACE FUNCTION prevent_comment_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Comments are immutable; updates are not allowed';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_immutable ON comments;
CREATE TRIGGER comments_immutable
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_comment_update();
