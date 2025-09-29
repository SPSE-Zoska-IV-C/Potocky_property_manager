-- First, drop existing foreign key constraints
ALTER TABLE "property" DROP CONSTRAINT IF EXISTS "property_userId_users_id_fk";

-- Drop property_permissions table as it's no longer needed
DROP TABLE IF EXISTS "property_permissions";

-- First, add groupId as nullable
ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "groupId" uuid;

-- Delete any existing properties that don't have a valid group
DELETE FROM "property" WHERE "groupId" IS NULL;

-- Make groupId NOT NULL
ALTER TABLE "property" ALTER COLUMN "groupId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "property" ADD CONSTRAINT "property_groupId_groups_id_fk" 
  FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE;

-- Finally, drop the old userId column
ALTER TABLE "property" DROP COLUMN IF EXISTS "userId"; 