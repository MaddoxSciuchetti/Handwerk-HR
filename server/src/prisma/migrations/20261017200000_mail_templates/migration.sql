CREATE TABLE "mail_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "sender_address" VARCHAR(254) NOT NULL DEFAULT '',
    "group_id" VARCHAR(255) NOT NULL DEFAULT '',
    "group_name" VARCHAR(255) NOT NULL DEFAULT '',
    "subject" VARCHAR(400) NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mail_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mail_templates_organization_id_idx" ON "mail_templates"("organization_id");

ALTER TABLE "mail_templates" ADD CONSTRAINT "mail_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
