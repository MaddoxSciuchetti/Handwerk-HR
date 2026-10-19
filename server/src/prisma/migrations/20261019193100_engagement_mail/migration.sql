CREATE TYPE "EngagementMailRecipientKind" AS ENUM (
  'worker_private',
  'worker_work',
  'microsoft_group',
  'teams_channel'
);

ALTER TABLE "mail_templates" ADD COLUMN "origin" VARCHAR(32);

CREATE UNIQUE INDEX "mail_templates_organization_id_origin_key" ON "mail_templates"("organization_id", "origin");

ALTER TABLE "template_items" ADD COLUMN "mail_template_id" TEXT;
ALTER TABLE "issues" ADD COLUMN "mail_template_id" TEXT;

CREATE INDEX "template_items_mail_template_id_idx" ON "template_items"("mail_template_id");
CREATE INDEX "issues_mail_template_id_idx" ON "issues"("mail_template_id");

ALTER TABLE "template_items" ADD CONSTRAINT "template_items_mail_template_id_fkey" FOREIGN KEY ("mail_template_id") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_mail_template_id_fkey" FOREIGN KEY ("mail_template_id") REFERENCES "mail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "engagement_mail_recipients" (
  "id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL,
  "kind" "EngagementMailRecipientKind" NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "address" VARCHAR(254),
  "worker_id" TEXT,
  "group_id" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "engagement_mail_recipients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "engagement_mail_recipients_engagement_id_idx" ON "engagement_mail_recipients"("engagement_id");

ALTER TABLE "engagement_mail_recipients" ADD CONSTRAINT "engagement_mail_recipients_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "mail_templates" (
  "id",
  "organization_id",
  "name",
  "description",
  "sender_address",
  "group_id",
  "group_name",
  "subject",
  "body",
  "origin",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  "organization_id",
  'Willkommensmail',
  'E-Mail an das Team bei Eintritt',
  '',
  '',
  '',
  "subject",
  "body",
  'welcome',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "welcome_mail_settings"
WHERE length(btrim("subject")) > 0 AND length(btrim("body")) > 0;

INSERT INTO "mail_templates" (
  "id",
  "organization_id",
  "name",
  "description",
  "sender_address",
  "group_id",
  "group_name",
  "subject",
  "body",
  "origin",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  "organization_id",
  'Entlassungsmail',
  'E-Mail an das Team bei Entlassung',
  '',
  '',
  '',
  "subject",
  "body",
  'departure',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "departure_mail_settings"
WHERE length(btrim("subject")) > 0 AND length(btrim("body")) > 0;

INSERT INTO "engagement_mail_recipients" (
  "id",
  "engagement_id",
  "kind",
  "label",
  "group_id",
  "created_at"
)
SELECT
  gen_random_uuid()::text,
  we."id",
  'microsoft_group',
  wms."group_name",
  wms."group_id",
  CURRENT_TIMESTAMP
FROM "worker_engagements" AS we
JOIN "welcome_mail_settings" AS wms ON wms."organization_id" = we."organization_id"
WHERE length(btrim(wms."group_id")) > 0
  AND length(btrim(wms."group_name")) > 0
  AND EXISTS (
    SELECT 1 FROM "issues" AS i
    WHERE i."worker_engagement_id" = we."id"
      AND i."sequence" = 'microsoft_send_onboarding_email'
  );

INSERT INTO "engagement_mail_recipients" (
  "id",
  "engagement_id",
  "kind",
  "label",
  "group_id",
  "created_at"
)
SELECT
  gen_random_uuid()::text,
  we."id",
  'microsoft_group',
  dms."group_name",
  dms."group_id",
  CURRENT_TIMESTAMP
FROM "worker_engagements" AS we
JOIN "departure_mail_settings" AS dms ON dms."organization_id" = we."organization_id"
WHERE length(btrim(dms."group_id")) > 0
  AND length(btrim(dms."group_name")) > 0
  AND EXISTS (
    SELECT 1 FROM "issues" AS i
    WHERE i."worker_engagement_id" = we."id"
      AND i."sequence" = 'microsoft_send_offboarding_email'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "engagement_mail_recipients" AS existing
    WHERE existing."engagement_id" = we."id"
      AND existing."group_id" = dms."group_id"
  );

UPDATE "template_items" AS ti
SET
  "mail_template_id" = mt."id",
  "sequence" = 'microsoft_send_email'
FROM "issue_templates" AS it
JOIN "mail_templates" AS mt
  ON mt."organization_id" = it."organization_id" AND mt."origin" = 'welcome'
WHERE ti."issue_template_id" = it."id"
  AND ti."sequence" = 'microsoft_send_onboarding_email';

UPDATE "template_items" AS ti
SET
  "mail_template_id" = mt."id",
  "sequence" = 'microsoft_send_email'
FROM "issue_templates" AS it
JOIN "mail_templates" AS mt
  ON mt."organization_id" = it."organization_id" AND mt."origin" = 'departure'
WHERE ti."issue_template_id" = it."id"
  AND ti."sequence" = 'microsoft_send_offboarding_email';

UPDATE "issues" AS i
SET
  "mail_template_id" = mt."id",
  "sequence" = 'microsoft_send_email'
FROM "worker_engagements" AS we
JOIN "mail_templates" AS mt
  ON mt."organization_id" = we."organization_id" AND mt."origin" = 'welcome'
WHERE i."worker_engagement_id" = we."id"
  AND i."sequence" = 'microsoft_send_onboarding_email';

UPDATE "issues" AS i
SET
  "mail_template_id" = mt."id",
  "sequence" = 'microsoft_send_email'
FROM "worker_engagements" AS we
JOIN "mail_templates" AS mt
  ON mt."organization_id" = we."organization_id" AND mt."origin" = 'departure'
WHERE i."worker_engagement_id" = we."id"
  AND i."sequence" = 'microsoft_send_offboarding_email';

UPDATE "template_items"
SET "sequence" = 'microsoft_send_email'
WHERE "sequence" IN ('microsoft_send_onboarding_email', 'microsoft_send_offboarding_email');

UPDATE "issues"
SET "sequence" = 'microsoft_send_email'
WHERE "sequence" IN ('microsoft_send_onboarding_email', 'microsoft_send_offboarding_email');
