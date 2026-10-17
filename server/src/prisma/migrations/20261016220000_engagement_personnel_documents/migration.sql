CREATE TYPE "PersonnelDocumentName" AS ENUM ('personalausweis', 'fuehrerschein', 'krankenkassenkarte');

CREATE TABLE "engagement_personnel_documents" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "name" "PersonnelDocumentName" NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(2048) NOT NULL,
    "mime_type" VARCHAR(128),
    "file_size_bytes" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_personnel_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "engagement_personnel_documents_engagement_id_idx" ON "engagement_personnel_documents"("engagement_id");

ALTER TABLE "engagement_personnel_documents" ADD CONSTRAINT "engagement_personnel_documents_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "engagement_personnel_documents" ADD CONSTRAINT "engagement_personnel_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
