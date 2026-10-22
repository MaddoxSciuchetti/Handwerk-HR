-- AlterEnum
ALTER TYPE "IntegrationSequence" ADD VALUE 'microsoft_send_teams_message';

-- CreateTable
CREATE TABLE "microsoft_user_connections" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "home_account_id" TEXT NOT NULL,
    "microsoft_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "scopes" TEXT[],
    "cache_ciphertext" TEXT NOT NULL,
    "reconnect_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "microsoft_user_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "microsoft_auth_attempts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "browser_hash" TEXT NOT NULL,
    "verifier_ciphertext" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "microsoft_auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "microsoft_connection_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "microsoft_connection_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams_sends" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "microsoft_user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lease_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teams_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams_send_destinations" (
    "id" TEXT NOT NULL,
    "send_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "graph_message_id" TEXT,
    "message_url" TEXT,
    "error" TEXT,
    "retry_after" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teams_send_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "microsoft_user_connections_organization_id_user_id_key" ON "microsoft_user_connections"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "microsoft_auth_attempts_expires_at_idx" ON "microsoft_auth_attempts"("expires_at");

-- CreateIndex
CREATE INDEX "microsoft_connection_events_organization_id_user_id_idx" ON "microsoft_connection_events"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_sends_issue_id_key" ON "teams_sends"("issue_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_sends_idempotency_key_key" ON "teams_sends"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "teams_send_destinations_send_id_team_id_channel_id_key" ON "teams_send_destinations"("send_id", "team_id", "channel_id");

-- AddForeignKey
ALTER TABLE "microsoft_user_connections" ADD CONSTRAINT "microsoft_user_connections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microsoft_user_connections" ADD CONSTRAINT "microsoft_user_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microsoft_auth_attempts" ADD CONSTRAINT "microsoft_auth_attempts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microsoft_auth_attempts" ADD CONSTRAINT "microsoft_auth_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microsoft_connection_events" ADD CONSTRAINT "microsoft_connection_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microsoft_connection_events" ADD CONSTRAINT "microsoft_connection_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_sends" ADD CONSTRAINT "teams_sends_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_sends" ADD CONSTRAINT "teams_sends_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_sends" ADD CONSTRAINT "teams_sends_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_send_destinations" ADD CONSTRAINT "teams_send_destinations_send_id_fkey" FOREIGN KEY ("send_id") REFERENCES "teams_sends"("id") ON DELETE CASCADE ON UPDATE CASCADE;
