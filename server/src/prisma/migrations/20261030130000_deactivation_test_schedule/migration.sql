ALTER TABLE "issues" ADD COLUMN "scheduled_deactivate_test_at" TIMESTAMPTZ;
CREATE INDEX "issues_scheduled_deactivate_test_at_idx" ON "issues"("scheduled_deactivate_test_at");
