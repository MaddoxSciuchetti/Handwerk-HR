ALTER TYPE "IssueKind" ADD VALUE IF NOT EXISTS 'contract_confirm';

ALTER TABLE "employment_contracts" ADD COLUMN "conversation_id" VARCHAR(512);
CREATE UNIQUE INDEX "employment_contracts_conversation_id_key" ON "employment_contracts"("conversation_id");
