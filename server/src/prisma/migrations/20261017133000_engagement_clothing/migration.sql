CREATE TYPE "ClothingSource" AS ENUM ('storage', 'purchased');

CREATE TABLE "engagement_clothing" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "stock_item_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "size" VARCHAR(32) NOT NULL DEFAULT '',
    "product_url" VARCHAR(2048),
    "source" "ClothingSource" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returned_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "engagement_clothing_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "engagement_clothing_quantity_check" CHECK (
        "quantity" >= 1
        AND "returned_quantity" >= 0
        AND "returned_quantity" <= "quantity"
    )
);

CREATE INDEX "engagement_clothing_engagement_id_idx" ON "engagement_clothing"("engagement_id");

CREATE INDEX "engagement_clothing_stock_item_id_idx" ON "engagement_clothing"("stock_item_id");

ALTER TABLE "engagement_clothing" ADD CONSTRAINT "engagement_clothing_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "engagement_clothing" ADD CONSTRAINT "engagement_clothing_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "clothing_stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
