CREATE TABLE "anniversary_reminders_sent" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "years" INTEGER NOT NULL,
    "anniversary_date" DATE NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anniversary_reminders_sent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "anniversary_reminders_sent_unique"
  ON "anniversary_reminders_sent"("organization_id", "worker_id", "years", "anniversary_date", "recipient_user_id");

CREATE INDEX "anniversary_reminders_sent_anniversary_date_idx"
  ON "anniversary_reminders_sent"("anniversary_date");

CREATE INDEX "anniversary_reminders_sent_organization_id_anniversary_date_idx"
  ON "anniversary_reminders_sent"("organization_id", "anniversary_date");

ALTER TABLE "anniversary_reminders_sent"
  ADD CONSTRAINT "anniversary_reminders_sent_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "anniversary_reminders_sent"
  ADD CONSTRAINT "anniversary_reminders_sent_worker_id_fkey"
  FOREIGN KEY ("worker_id") REFERENCES "workers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "anniversary_reminders_sent"
  ADD CONSTRAINT "anniversary_reminders_sent_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
