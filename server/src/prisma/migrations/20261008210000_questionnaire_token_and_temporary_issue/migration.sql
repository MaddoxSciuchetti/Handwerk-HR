-- CreateEnum
CREATE TYPE "IssueKind" AS ENUM ('standard', 'contract_send');

-- AlterTable
ALTER TABLE "issues" ADD COLUMN "kind" "IssueKind" NOT NULL DEFAULT 'standard';
ALTER TABLE "issues" ADD COLUMN "is_temporary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "questionnaire_submissions" ADD COLUMN "token" VARCHAR(64);
UPDATE "questionnaire_submissions" SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;
ALTER TABLE "questionnaire_submissions" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX "questionnaire_submissions_token_key" ON "questionnaire_submissions"("token");
