ALTER TABLE "questionnaire_submissions" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "employment_contracts" ADD COLUMN "matched_questionnaire_revision" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "questionnaire_changes" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "changed_by_user_id" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questionnaire_changes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "questionnaire_changes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "questionnaire_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "questionnaire_changes_submission_id_revision_key" ON "questionnaire_changes"("submission_id", "revision");
