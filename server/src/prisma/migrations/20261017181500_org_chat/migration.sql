ALTER TABLE "issues" ALTER COLUMN "worker_engagement_id" DROP NOT NULL;

ALTER TABLE "issues" ADD COLUMN "organization_id" TEXT;

ALTER TABLE "issues" ADD CONSTRAINT "issues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "issues_organization_id_idx" ON "issues"("organization_id");

CREATE TABLE "org_chat_messages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" VARCHAR(10000) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "org_chat_messages_organization_id_created_at_idx" ON "org_chat_messages"("organization_id", "created_at");

ALTER TABLE "org_chat_messages" ADD CONSTRAINT "org_chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "org_chat_messages" ADD CONSTRAINT "org_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
