CREATE TABLE IF NOT EXISTS "group_member_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "groupId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "role" varchar(50) NOT NULL DEFAULT 'member',
  "dateAssigned" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "group_member_roles_id_unique" UNIQUE("id")
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "group_member_roles" ADD CONSTRAINT "group_member_roles_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "group_member_roles" ADD CONSTRAINT "group_member_roles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$; 