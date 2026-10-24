ALTER TABLE "comments" ADD COLUMN "mentioned_user_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
