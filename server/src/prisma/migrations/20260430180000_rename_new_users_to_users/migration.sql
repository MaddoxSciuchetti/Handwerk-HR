-- Rename physical table User @@map: new_users → users
ALTER TABLE "new_users" RENAME TO "users";

-- Align constraint / index names with a fresh Prisma create on `users`
ALTER TABLE "users" RENAME CONSTRAINT "new_users_pkey" TO "users_pkey";
ALTER INDEX "new_users_email_key" RENAME TO "users_email_key";
