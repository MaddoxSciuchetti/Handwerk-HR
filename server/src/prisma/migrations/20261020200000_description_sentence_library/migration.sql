CREATE TABLE "description_sentences" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sentence" VARCHAR(500) NOT NULL,
    "normalized" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "description_sentences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "description_sentences_organization_id_normalized_key"
    ON "description_sentences"("organization_id", "normalized");
ALTER TABLE "description_sentences" ADD CONSTRAINT "description_sentences_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
