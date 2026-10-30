DROP INDEX IF EXISTS "issues_scheduled_deactivate_test_at_idx";
ALTER TABLE "issues" DROP COLUMN IF EXISTS "scheduled_deactivate_test_at";
