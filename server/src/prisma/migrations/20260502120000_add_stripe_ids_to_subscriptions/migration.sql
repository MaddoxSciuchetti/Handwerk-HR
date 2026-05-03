-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
