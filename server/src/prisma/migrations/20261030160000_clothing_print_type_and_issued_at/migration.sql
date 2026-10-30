CREATE TYPE "ClothingPrintType" AS ENUM ('bedruckt', 'sondersachen', 'unbedruckt');

ALTER TABLE "clothing_stock_items"
ADD COLUMN "print_type" "ClothingPrintType" NOT NULL DEFAULT 'unbedruckt';

DROP INDEX "clothing_stock_items_organization_id_name_size_key";

CREATE UNIQUE INDEX "clothing_stock_items_organization_id_name_size_print_type_key"
ON "clothing_stock_items"("organization_id", "name", "size", "print_type");

ALTER TABLE "engagement_clothing"
ADD COLUMN "print_type" "ClothingPrintType" NOT NULL DEFAULT 'unbedruckt',
ADD COLUMN "issued_at" DATE NOT NULL DEFAULT CURRENT_DATE;

UPDATE "engagement_clothing"
SET "issued_at" = (("created_at" AT TIME ZONE 'UTC')::date);
