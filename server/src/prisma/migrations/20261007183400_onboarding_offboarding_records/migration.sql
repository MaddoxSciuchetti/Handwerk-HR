-- AlterEnum
ALTER TYPE "EngagementProgress" ADD VALUE 'expected' AFTER 'pending';

-- CreateEnum
CREATE TYPE "DocumentMasterKind" AS ENUM ('employment_contract', 'arbeitszeugnis');

-- CreateEnum
CREATE TYPE "EmploymentContractStatus" AS ENUM ('draft', 'signed');

-- CreateEnum
CREATE TYPE "QuestionnaireSubmissionStatus" AS ENUM ('sent', 'completed');

-- CreateEnum
CREATE TYPE "ExternalAccountProvider" AS ENUM ('engine4', 'microsoft_365', 'crewmeister');

-- CreateEnum
CREATE TYPE "ExternalAccountStatus" AS ENUM ('active', 'disabled');

-- AlterTable
ALTER TABLE "workers" ADD COLUMN "work_email" VARCHAR(254);

-- CreateTable
CREATE TABLE "document_masters" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "kind" "DocumentMasterKind" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "master_id" TEXT NOT NULL,
    "status" "EmploymentContractStatus" NOT NULL DEFAULT 'draft',
    "signed_body" JSONB,
    "file_url" VARCHAR(2048),
    "sent_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "confirmed_by_user_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contract_values" (
    "id" TEXT NOT NULL,
    "employment_contract_id" TEXT NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" VARCHAR(8000) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employment_contract_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arbeitszeugnisse" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "master_id" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "file_url" VARCHAR(2048),
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "arbeitszeugnisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaires" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_questions" (
    "id" TEXT NOT NULL,
    "questionnaire_id" TEXT NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "label" VARCHAR(400) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_submissions" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "status" "QuestionnaireSubmissionStatus" NOT NULL DEFAULT 'sent',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "questionnaire_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_answers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" VARCHAR(8000) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "questionnaire_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_materials" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "article_number" VARCHAR(120) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "engagement_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_workwear" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "size" VARCHAR(32) NOT NULL,
    "article_number" VARCHAR(120) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "worker_workwear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_external_accounts" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "provider" "ExternalAccountProvider" NOT NULL,
    "external_id" VARCHAR(255) NOT NULL,
    "status" "ExternalAccountStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "worker_external_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_forwardings" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "needed" BOOLEAN NOT NULL DEFAULT false,
    "destination" VARCHAR(254),
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mail_forwardings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_masters_organization_id_idx" ON "document_masters"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "employment_contracts_engagement_id_key" ON "employment_contracts"("engagement_id");

-- CreateIndex
CREATE INDEX "employment_contracts_master_id_idx" ON "employment_contracts"("master_id");

-- CreateIndex
CREATE INDEX "employment_contracts_confirmed_by_user_id_idx" ON "employment_contracts"("confirmed_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employment_contract_values_employment_contract_id_key_key" ON "employment_contract_values"("employment_contract_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "arbeitszeugnisse_engagement_id_key" ON "arbeitszeugnisse"("engagement_id");

-- CreateIndex
CREATE INDEX "arbeitszeugnisse_master_id_idx" ON "arbeitszeugnisse"("master_id");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaires_organization_id_key" ON "questionnaires"("organization_id");

-- CreateIndex
CREATE INDEX "questionnaire_questions_questionnaire_id_idx" ON "questionnaire_questions"("questionnaire_id");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_questions_questionnaire_id_key_key" ON "questionnaire_questions"("questionnaire_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_submissions_engagement_id_key" ON "questionnaire_submissions"("engagement_id");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_answers_submission_id_key_key" ON "questionnaire_answers"("submission_id", "key");

-- CreateIndex
CREATE INDEX "engagement_materials_engagement_id_idx" ON "engagement_materials"("engagement_id");

-- CreateIndex
CREATE INDEX "worker_workwear_worker_id_idx" ON "worker_workwear"("worker_id");

-- CreateIndex
CREATE INDEX "worker_external_accounts_worker_id_idx" ON "worker_external_accounts"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "worker_external_accounts_worker_id_provider_key" ON "worker_external_accounts"("worker_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "mail_forwardings_engagement_id_key" ON "mail_forwardings"("engagement_id");

-- AddForeignKey
ALTER TABLE "document_masters" ADD CONSTRAINT "document_masters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "document_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contract_values" ADD CONSTRAINT "employment_contract_values_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arbeitszeugnisse" ADD CONSTRAINT "arbeitszeugnisse_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arbeitszeugnisse" ADD CONSTRAINT "arbeitszeugnisse_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "document_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_questions" ADD CONSTRAINT "questionnaire_questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_answers" ADD CONSTRAINT "questionnaire_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "questionnaire_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_materials" ADD CONSTRAINT "engagement_materials_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_workwear" ADD CONSTRAINT "worker_workwear_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_external_accounts" ADD CONSTRAINT "worker_external_accounts_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_forwardings" ADD CONSTRAINT "mail_forwardings_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "worker_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
