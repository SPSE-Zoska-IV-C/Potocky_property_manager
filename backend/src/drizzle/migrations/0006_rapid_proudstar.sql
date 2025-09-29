CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "teamId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "teamId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property" ADD CONSTRAINT "property_teamId_teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_teamId_teams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
