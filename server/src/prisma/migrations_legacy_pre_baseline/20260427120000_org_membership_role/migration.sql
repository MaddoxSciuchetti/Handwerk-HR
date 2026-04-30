-- Align DB with schema: OrganizationMember.membership_role + Invitation.invited_membership_role
-- Replaces removed Role / role_id columns. Safe to re-run on DBs that already have these columns.

-- Enum used by Prisma @@map fields below
DO $$ BEGIN
    CREATE TYPE "OrgMemberRole" AS ENUM ('admin', 'worker');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ─── organization_members ─────────────────────────────────────────────────────
ALTER TABLE "organization_members"
    ADD COLUMN IF NOT EXISTS "membership_role" "OrgMemberRole";

-- Default existing rows before NOT NULL
UPDATE "organization_members"
SET "membership_role" = 'worker'
WHERE "membership_role" IS NULL;

-- Org creators become admins (covers former "Owner" semantics after Role table removal)
UPDATE "organization_members" AS om
SET "membership_role" = 'admin'
FROM "organizations" AS o
WHERE om."organization_id" = o."id"
  AND om."user_id" = o."created_by_user_id";

ALTER TABLE "organization_members"
    ALTER COLUMN "membership_role" SET DEFAULT 'worker';
ALTER TABLE "organization_members"
    ALTER COLUMN "membership_role" SET NOT NULL;

ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_role_id_fkey";
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "role_id";

-- ─── invitations ──────────────────────────────────────────────────────────────
ALTER TABLE "invitations"
    ADD COLUMN IF NOT EXISTS "invited_membership_role" "OrgMemberRole";

UPDATE "invitations"
SET "invited_membership_role" = 'worker'
WHERE "invited_membership_role" IS NULL;

ALTER TABLE "invitations"
    ALTER COLUMN "invited_membership_role" SET DEFAULT 'worker';
ALTER TABLE "invitations"
    ALTER COLUMN "invited_membership_role" SET NOT NULL;

ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_role_id_fkey";
ALTER TABLE "invitations" DROP COLUMN IF EXISTS "role_id";
