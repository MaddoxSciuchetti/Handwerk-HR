CREATE TYPE "IntegrationProvider" AS ENUM ('microsoft_graph', 'crewmeister');

CREATE TYPE "IntegrationSequence" AS ENUM (
  'microsoft_create_account',
  'microsoft_send_onboarding_email',
  'microsoft_send_offboarding_email',
  'microsoft_deactivate_account',
  'crewmeister_create_account'
);

CREATE TABLE "organization_integrations" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "tenant_id" VARCHAR(255),
  "client_id" VARCHAR(255),
  "domain" VARCHAR(255),
  "license_sku_id" VARCHAR(255),
  "crew_id" VARCHAR(64),
  "client_secret_ciphertext" TEXT,
  "token_ciphertext" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "organization_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_integrations_organization_id_provider_key" ON "organization_integrations"("organization_id", "provider");
CREATE INDEX "organization_integrations_organization_id_idx" ON "organization_integrations"("organization_id");

ALTER TABLE "organization_integrations" ADD CONSTRAINT "organization_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template_items" ADD COLUMN "integration_provider" "IntegrationProvider";
ALTER TABLE "template_items" ADD COLUMN "sequence" "IntegrationSequence";

ALTER TABLE "issues" ADD COLUMN "integration_provider" "IntegrationProvider";
ALTER TABLE "issues" ADD COLUMN "sequence" "IntegrationSequence";
