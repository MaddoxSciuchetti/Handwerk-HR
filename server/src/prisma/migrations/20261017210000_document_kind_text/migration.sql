DROP INDEX "document_masters_one_primary_contract";

ALTER TABLE "document_masters"
  ALTER COLUMN "kind" SET DATA TYPE VARCHAR(80)
  USING ("kind"::text);

DROP TYPE "DocumentMasterKind";

CREATE UNIQUE INDEX "document_masters_one_primary_contract"
  ON "document_masters" ("organization_id")
  WHERE (is_primary = true AND kind = 'employment_contract');
