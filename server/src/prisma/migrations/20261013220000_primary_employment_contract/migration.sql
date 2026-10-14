ALTER TABLE "document_masters" ADD COLUMN "is_primary" BOOLEAN NOT NULL DEFAULT false;

UPDATE "document_masters" AS selected
SET "is_primary" = true
WHERE selected."id" IN (
    SELECT DISTINCT ON ("organization_id") "id"
    FROM "document_masters"
    WHERE "kind" = 'employment_contract'
    ORDER BY "organization_id", "updated_at" DESC
);

CREATE UNIQUE INDEX "document_masters_one_primary_contract" ON "document_masters"("organization_id") WHERE (is_primary = true AND kind = 'employment_contract');
