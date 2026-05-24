-- AlterTable
ALTER TABLE "users" ADD COLUMN     "archivedAt" TIMESTAMP(6),
ADD COLUMN     "archivedBy" TEXT;

-- CreateIndex
CREATE INDEX "users_archivedAt_idx" ON "users"("archivedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_archivedBy_fkey" FOREIGN KEY ("archivedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
