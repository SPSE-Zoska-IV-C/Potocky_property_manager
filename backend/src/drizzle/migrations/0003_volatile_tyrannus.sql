CREATE TABLE IF NOT EXISTS "role" (
	"id" integer PRIMARY KEY DEFAULT 0 NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"permissionsId" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roleId" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
