CREATE TABLE "engagement_material_documents" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(2048) NOT NULL,
    "mime_type" VARCHAR(128),
    "file_size_bytes" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_material_documents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "engagement_materials" ADD COLUMN "source_document_id" TEXT;

CREATE INDEX "engagement_material_documents_engagement_id_idx" ON "engagement_material_documents"("engagement_id");
CREATE INDEX "engagement_materials_source_document_id_idx" ON "engagement_materials"("source_document_id");

ALTER TABLE "engagement_material_documents" ADD CONSTRAINT "engagement_material_documents_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "engagement_materials" ADD CONSTRAINT "engagement_materials_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "engagement_material_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
