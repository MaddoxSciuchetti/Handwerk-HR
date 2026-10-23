CREATE TABLE "issue_mentions" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen_at" TIMESTAMPTZ,

    CONSTRAINT "issue_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "issue_mentions_issue_id_user_id_key" ON "issue_mentions"("issue_id", "user_id");

CREATE INDEX "issue_mentions_user_id_seen_at_idx" ON "issue_mentions"("user_id", "seen_at");

ALTER TABLE "issue_mentions" ADD CONSTRAINT "issue_mentions_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "issue_mentions" ADD CONSTRAINT "issue_mentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
