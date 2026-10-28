-- Allow fast-track onboarding by name without an email address.
ALTER TABLE "workers" ALTER COLUMN "email" DROP NOT NULL;
