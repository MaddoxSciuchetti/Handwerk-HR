ALTER TYPE "EngagementMailRecipientKind" ADD VALUE 'microsoft_user';
ALTER TABLE "engagement_mail_recipients" ADD COLUMN "microsoft_user_id" VARCHAR(64);
