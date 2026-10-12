ALTER TABLE "document_masters" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "approved_at" TIMESTAMPTZ, ADD COLUMN "source_key" TEXT,
  ADD COLUMN "source_mime" TEXT, ADD COLUMN "source_name" TEXT;
ALTER TABLE "employment_contracts" ADD COLUMN "outgoing_pdf_id" TEXT;
ALTER TABLE "arbeitszeugnisse" ADD COLUMN "draft_values" JSONB, ADD COLUMN "outgoing_pdf_id" TEXT;
CREATE TABLE "prepared_documents" (
  "id" TEXT PRIMARY KEY, "organization_id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL, "master_id" TEXT NOT NULL,
  "master_revision" INTEGER NOT NULL, "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL, "recipient" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL, "values" JSONB NOT NULL, "font_manifest" JSONB NOT NULL,
  "s3_key" TEXT NOT NULL, "content_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'prepared', "provider_id" TEXT,
  "approved_by" TEXT, "approved_at" TIMESTAMPTZ, "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "prepared_documents_organization_id_engagement_id_kind_status_idx"
  ON "prepared_documents" ("organization_id", "engagement_id", "kind", "status");
