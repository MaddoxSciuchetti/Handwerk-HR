ALTER TABLE "workers" ADD COLUMN "departure_mail_sent_at" TIMESTAMPTZ;

CREATE TABLE "departure_mail_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sender_address" VARCHAR(254) NOT NULL,
    "group_id" VARCHAR(255) NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(400) NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "departure_mail_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departure_mail_settings_organization_id_key" ON "departure_mail_settings"("organization_id");

ALTER TABLE "departure_mail_settings" ADD CONSTRAINT "departure_mail_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
