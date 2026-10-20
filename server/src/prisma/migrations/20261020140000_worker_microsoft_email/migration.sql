ALTER TABLE "workers" ADD COLUMN "microsoft_email" VARCHAR(254);

-- Preserve the Microsoft address stored by the previous provisioning flow.
-- Keep existing email columns unchanged.
UPDATE "workers" AS worker
SET "microsoft_email" = worker."work_email"
WHERE worker."work_email" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "worker_external_accounts" AS account
    WHERE account."worker_id" = worker."id"
      AND account."provider" = 'microsoft_365'
  );
