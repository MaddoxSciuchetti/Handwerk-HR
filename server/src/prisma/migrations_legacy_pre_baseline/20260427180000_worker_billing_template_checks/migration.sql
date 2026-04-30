-- ─── Worker: drop archive columns & shrink WorkerStatus (drop `archived`) ────────────────
UPDATE "workers" SET "status" = 'inactive' WHERE "status"::text = 'archived';

ALTER TABLE "workers" DROP CONSTRAINT IF EXISTS "workers_archived_by_user_id_fkey";

ALTER TABLE "workers" DROP COLUMN IF EXISTS "archived_by_user_id";
ALTER TABLE "workers" DROP COLUMN IF EXISTS "archived_at";

CREATE TYPE "WorkerStatus_new" AS ENUM ('active', 'inactive');

ALTER TABLE "workers" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "workers"
    ALTER COLUMN "status" TYPE "WorkerStatus_new"
    USING (
        CASE
            WHEN "status"::text = 'active' THEN 'active'::"WorkerStatus_new"
            ELSE 'inactive'::"WorkerStatus_new"
        END
    );

ALTER TABLE "workers"
    ALTER COLUMN "status" SET DEFAULT 'active'::"WorkerStatus_new";

DROP TYPE "WorkerStatus";

ALTER TYPE "WorkerStatus_new" RENAME TO "WorkerStatus";

-- ─── Billing: fold PaymentMethod into Subscription; Invoice FK cleanup ───────────────────
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_payment_method_id_fkey";

ALTER TABLE "subscriptions"
    DROP CONSTRAINT IF EXISTS "subscriptions_active_payment_method_id_fkey";

UPDATE "subscriptions" AS s
SET
    "provider" = pm."provider",
    "provider_payment_method_id" = pm."provider_payment_method_id",
    "card_brand" = pm."card_brand",
    "card_last4" = pm."card_last4",
    "card_exp_month" = pm."card_exp_month",
    "card_exp_year" = pm."card_exp_year"
FROM "payment_methods" AS pm
WHERE s."active_payment_method_id" = pm."id";

ALTER TABLE "invoices" DROP COLUMN IF EXISTS "payment_method_id";

ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "active_payment_method_id";

DROP TABLE IF EXISTS "payment_methods";

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "provider_payment_method_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "card_brand" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "card_last4" CHAR(4);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "card_exp_month" SMALLINT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "card_exp_year" SMALLINT;

-- ─── TemplateItem.default_priority: DefaultPriority → IssuePriority ────────────────────────
ALTER TABLE "template_items" ALTER COLUMN "default_priority" DROP DEFAULT;

ALTER TABLE "template_items"
    ALTER COLUMN "default_priority" TYPE "IssuePriority"
    USING (
        CASE
            WHEN "default_priority" IS NULL THEN NULL::"IssuePriority"
            ELSE lower(trim("default_priority"::text))::"IssuePriority"
        END
    );

DROP TYPE IF EXISTS "DefaultPriority";

-- ─── WorkerEngagement: date sanity CHECK ───────────────────────────────────────────────────
ALTER TABLE "worker_engagements" DROP CONSTRAINT IF EXISTS "worker_engagements_dates_check";

ALTER TABLE "worker_engagements"
    ADD CONSTRAINT "worker_engagements_dates_check"
        CHECK (
            ("start_date" IS NULL OR "end_date" IS NULL OR "end_date" >= "start_date")
        );

-- ─── Absence → absences + snake_case (matches Prisma @@map); substitute ≠ user ──────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Absence'
    ) THEN
        EXECUTE 'ALTER TABLE "Absence" RENAME TO absences';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'userId'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "userId" TO user_id';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'orgId'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "orgId" TO org_id';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'substituteId'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "substituteId" TO substitute_id';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'absenceType'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "absenceType" TO absence_type';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'startDate'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "startDate" TO start_date';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'endDate'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "endDate" TO end_date';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'createdAt'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "createdAt" TO created_at';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'absences' AND column_name = 'updatedAt'
    ) THEN
        EXECUTE 'ALTER TABLE absences RENAME COLUMN "updatedAt" TO updated_at';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'absences'
    ) THEN
        ALTER TABLE "absences" DROP CONSTRAINT IF EXISTS "absences_substitute_not_self_check";
        ALTER TABLE "absences"
            ADD CONSTRAINT "absences_substitute_not_self_check"
                CHECK (("substitute_id" IS NULL) OR ("user_id" <> "substitute_id"));
    END IF;
END $$;
