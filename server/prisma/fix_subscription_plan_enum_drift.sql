-- One-off: align live DB with migration `20260501180000_replace_free_plan_with_starter`
-- when the DB still has enum label `free` but migration history expects none.
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP NOT NULL;

UPDATE "subscriptions" SET "plan" = NULL WHERE "plan"::text = 'free';

ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
CREATE TYPE "SubscriptionPlan" AS ENUM ('starter', 'pro', 'enterprise');
ALTER TABLE "subscriptions"
    ALTER COLUMN "plan" TYPE "SubscriptionPlan"
    USING ("plan"::text::"SubscriptionPlan");
DROP TYPE "SubscriptionPlan_old";
