ALTER TABLE "questionnaires"
ADD COLUMN "definition" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "worker_engagements"
ADD COLUMN "questionnaire_overrides" JSONB;

ALTER TABLE "questionnaire_submissions"
ADD COLUMN "form_definition" JSONB;
