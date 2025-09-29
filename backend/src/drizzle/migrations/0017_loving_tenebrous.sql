ALTER TABLE "property" DROP CONSTRAINT "property_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "groupId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property" ADD CONSTRAINT "property_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "property" DROP COLUMN IF EXISTS "userId";