-- Add groupId column to guests table
ALTER TABLE "guests" ADD COLUMN "groupId" uuid NOT NULL REFERENCES "groups"("id");

-- Add index for faster lookups
CREATE INDEX "guests_groupId_idx" ON "guests"("groupId"); 