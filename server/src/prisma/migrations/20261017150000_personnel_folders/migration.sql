CREATE TABLE "engagement_personnel_folders" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_personnel_folders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "engagement_personnel_folders_engagement_id_label_key" ON "engagement_personnel_folders"("engagement_id", "label");

CREATE INDEX "engagement_personnel_folders_engagement_id_idx" ON "engagement_personnel_folders"("engagement_id");

ALTER TABLE "engagement_personnel_folders" ADD CONSTRAINT "engagement_personnel_folders_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "engagement_personnel_documents" ADD COLUMN "folder_id" TEXT;

CREATE INDEX "engagement_personnel_documents_folder_id_idx" ON "engagement_personnel_documents"("folder_id");

ALTER TABLE "engagement_personnel_documents" ADD CONSTRAINT "engagement_personnel_documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "engagement_personnel_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
