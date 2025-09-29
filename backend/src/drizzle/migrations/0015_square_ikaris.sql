CREATE TABLE IF NOT EXISTS "group_member_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"dateAssigned" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_member_roles" ADD CONSTRAINT "group_member_roles_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_member_roles" ADD CONSTRAINT "group_member_roles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
