ALTER TABLE "workers" ADD COLUMN "welcome_mail_sent_at" TIMESTAMPTZ;

CREATE TABLE "welcome_mail_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sender_address" VARCHAR(254) NOT NULL,
    "group_id" VARCHAR(255) NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(400) NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "welcome_mail_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "welcome_mail_settings_organization_id_key" ON "welcome_mail_settings"("organization_id");

ALTER TABLE "welcome_mail_settings" ADD CONSTRAINT "welcome_mail_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
