CREATE TABLE "automation_document_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "automation" VARCHAR(64) NOT NULL,
    "document_master_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "automation_document_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_document_settings_organization_id_automation_key" ON "automation_document_settings"("organization_id", "automation");

CREATE INDEX "automation_document_settings_document_master_id_idx" ON "automation_document_settings"("document_master_id");

ALTER TABLE "automation_document_settings" ADD CONSTRAINT "automation_document_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_document_settings" ADD CONSTRAINT "automation_document_settings_document_master_id_fkey" FOREIGN KEY ("document_master_id") REFERENCES "document_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
