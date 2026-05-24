-- Drop default and make plan nullable: trialing organizations have no plan yet.
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP NOT NULL;

-- Existing 'free' rows are organizations still in their trial period: clear the plan.
UPDATE "subscriptions" SET "plan" = NULL WHERE "plan" = 'free';

-- Replace the SubscriptionPlan enum: drop 'free', add 'starter'.
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
CREATE TYPE "SubscriptionPlan" AS ENUM ('starter', 'pro', 'enterprise');
ALTER TABLE "subscriptions"
    ALTER COLUMN "plan" TYPE "SubscriptionPlan"
    USING ("plan"::text::"SubscriptionPlan");
DROP TYPE "SubscriptionPlan_old";
