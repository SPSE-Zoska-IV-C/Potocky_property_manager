-- Add createdBy column to property table
ALTER TABLE "property" ADD COLUMN "createdBy" uuid REFERENCES "users"("id");

-- Set existing properties' createdBy to their group's owner
UPDATE "property" p
SET "createdBy" = g."ownerId"
FROM "groups" g
WHERE p."groupId" = g."id";

-- Make createdBy NOT NULL after setting initial values
ALTER TABLE "property" ALTER COLUMN "createdBy" SET NOT NULL; 