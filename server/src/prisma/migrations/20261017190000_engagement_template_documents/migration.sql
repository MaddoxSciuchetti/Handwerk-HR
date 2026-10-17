CREATE TABLE "engagement_template_documents" (
  "id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL,
  "master_id" TEXT NOT NULL,
  "matched_master_revision" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "engagement_template_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "engagement_template_documents_engagement_id_master_id_key" ON "engagement_template_documents"("engagement_id", "master_id");
CREATE INDEX "engagement_template_documents_master_id_idx" ON "engagement_template_documents"("master_id");

ALTER TABLE "engagement_template_documents" ADD CONSTRAINT "engagement_template_documents_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "engagement_template_documents" ADD CONSTRAINT "engagement_template_documents_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "document_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "engagement_template_document_values" (
  "id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "key" VARCHAR(120) NOT NULL,
  "value" VARCHAR(8000) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "engagement_template_document_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "engagement_template_document_values_document_id_key_key" ON "engagement_template_document_values"("document_id", "key");

ALTER TABLE "engagement_template_document_values" ADD CONSTRAINT "engagement_template_document_values_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "engagement_template_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
