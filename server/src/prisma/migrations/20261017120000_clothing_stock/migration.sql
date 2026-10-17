CREATE TABLE "clothing_stock_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "size" VARCHAR(32) NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clothing_stock_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clothing_stock_items_organization_id_idx" ON "clothing_stock_items"("organization_id");

CREATE UNIQUE INDEX "clothing_stock_items_organization_id_name_size_key" ON "clothing_stock_items"("organization_id", "name", "size");

ALTER TABLE "clothing_stock_items" ADD CONSTRAINT "clothing_stock_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
