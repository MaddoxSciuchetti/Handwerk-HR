ALTER TYPE "IssueStatus" ADD VALUE IF NOT EXISTS 'error';
CREATE TABLE "template_applications" (
  "id" TEXT NOT NULL,
  "worker_engagement_id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "run_automation" BOOLEAN NOT NULL DEFAULT false,
  "issue_ids" TEXT[] NOT NULL,
  "outcomes" JSONB NOT NULL DEFAULT '[]',
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_applications_worker_engagement_id_fkey" FOREIGN KEY ("worker_engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "template_applications_worker_engagement_id_key" ON "template_applications"("worker_engagement_id");
ALTER TABLE "issues" ADD COLUMN "automation_recipients" JSONB;
