-- AlterTable
ALTER TABLE "template_items" ADD COLUMN "default_status" "IssueStatus" NOT NULL DEFAULT 'open';
ALTER TABLE "template_items" ADD COLUMN "default_assignee_user_id" TEXT;

-- AddForeignKey
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_default_assignee_user_id_fkey" FOREIGN KEY ("default_assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "template_items_default_assignee_user_id_idx" ON "template_items"("default_assignee_user_id");
