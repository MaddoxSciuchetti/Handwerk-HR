ALTER TABLE "workers" ADD COLUMN "hidden_personnel_folders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
