-- Drop invoices that cannot be keyed idempotently (Stripe id required).
DELETE FROM "invoices" WHERE "provider_invoice_id" IS NULL;

ALTER TABLE "invoices" ALTER COLUMN "provider_invoice_id" SET NOT NULL;

CREATE UNIQUE INDEX "invoices_provider_invoice_id_key" ON "invoices"("provider_invoice_id");
