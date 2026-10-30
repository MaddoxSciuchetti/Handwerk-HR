ALTER TABLE "issues"
  ADD COLUMN "scheduled_deactivate_at" DATE,
  ADD COLUMN "scheduled_deactivate_by_user_id" TEXT,
  ADD COLUMN "deactivation_claim_token" TEXT,
  ADD COLUMN "deactivation_claim_until" TIMESTAMPTZ;
CREATE INDEX "issues_scheduled_deactivate_at_idx" ON "issues"("scheduled_deactivate_at");
