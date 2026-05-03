-- Prisma: allow edited migration 20260501175040_add_free_to_subscription_plan to be re-applied
-- with an updated checksum (file was changed after first apply).
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260501175040_add_free_to_subscription_plan';
