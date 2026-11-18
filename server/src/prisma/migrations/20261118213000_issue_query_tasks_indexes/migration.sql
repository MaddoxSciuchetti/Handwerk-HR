-- Speed up GET /tasks: filter assigneeOnly, org scope, and createdAt/id sort.
CREATE INDEX "issues_assignee_only_idx" ON "issues"("assignee_only");
CREATE INDEX "issues_created_at_id_idx" ON "issues"("created_at", "id");
CREATE INDEX "issues_organization_id_created_at_idx" ON "issues"("organization_id", "created_at");
CREATE INDEX "issues_worker_engagement_id_created_at_idx" ON "issues"("worker_engagement_id", "created_at");
