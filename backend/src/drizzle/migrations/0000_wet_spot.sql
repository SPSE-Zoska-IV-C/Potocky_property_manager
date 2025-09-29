CREATE TABLE IF NOT EXISTS "property_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"propertyId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property" (
	"propertyId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"isRented" boolean DEFAULT false NOT NULL,
	"pricePerDay" integer NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"lastDateRented" timestamp DEFAULT now() NOT NULL,
	"lastDayCleaned" timestamp DEFAULT now() NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"rooms" integer DEFAULT 1 NOT NULL,
	"loan" integer DEFAULT 0 NOT NULL,
	"propertySellPriceNow" integer DEFAULT 0 NOT NULL,
	"propertyBuyPrice" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "property_propertyId_unique" UNIQUE("propertyId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastLogin" timestamp DEFAULT now() NOT NULL,
	"isAdmin" boolean DEFAULT false NOT NULL,
	"lastIp" varchar(255) DEFAULT '' NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_permissions" ADD CONSTRAINT "property_permissions_propertyId_property_propertyId_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("propertyId") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_permissions" ADD CONSTRAINT "property_permissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property" ADD CONSTRAINT "property_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
