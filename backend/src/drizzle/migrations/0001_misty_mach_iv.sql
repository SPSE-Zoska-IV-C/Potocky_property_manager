CREATE TABLE IF NOT EXISTS "payment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"paymentId" varchar(255) DEFAULT '' NOT NULL,
	"paymentStatus" varchar(255) DEFAULT '' NOT NULL,
	"paymentDate" timestamp DEFAULT now() NOT NULL,
	"paymentAmount" integer DEFAULT 0 NOT NULL,
	"paymentCurrency" varchar(255) DEFAULT 'EUR' NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "payment_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hasTrial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alreadyUsedTrial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trialEndsAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isPremium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "premiumEndsAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
