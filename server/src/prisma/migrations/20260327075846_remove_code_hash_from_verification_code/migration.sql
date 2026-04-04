/*
  Warnings:

  - You are about to drop the column `code_hash` on the `new_verification_codes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "new_verification_codes" DROP COLUMN "code_hash";
