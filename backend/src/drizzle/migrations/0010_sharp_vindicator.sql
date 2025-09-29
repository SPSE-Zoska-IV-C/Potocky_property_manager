ALTER TABLE "property" ALTER COLUMN "teamId" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "teamId" SET DEFAULT gen_random_uuid();