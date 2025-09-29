CREATE TABLE IF NOT EXISTS "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"dateJoined" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_property_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"propertyId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"ownerId" uuid NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_property_permissions" ADD CONSTRAINT "group_property_permissions_propertyId_property_propertyId_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("propertyId") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_property_permissions" ADD CONSTRAINT "group_property_permissions_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
