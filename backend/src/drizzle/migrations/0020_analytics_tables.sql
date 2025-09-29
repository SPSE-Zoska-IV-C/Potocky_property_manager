-- Create guests table
CREATE TABLE IF NOT EXISTS "guests" (
  "guestId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" varchar(255) NOT NULL,
  "lastName" varchar(255) NOT NULL,
  "email" varchar(255),
  "phone" varchar(50),
  "nationality" varchar(100),
  "dateOfBirth" date,
  "idNumber" varchar(100),
  "idType" varchar(50),
  "notes" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "createdBy" uuid NOT NULL REFERENCES "users"("id")
);

-- Create stays table
CREATE TABLE IF NOT EXISTS "stays" (
  "stayId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "propertyId" uuid NOT NULL REFERENCES "property"("propertyId") ON DELETE CASCADE,
  "guestId" uuid NOT NULL REFERENCES "guests"("guestId") ON DELETE CASCADE,
  "checkIn" date NOT NULL,
  "checkOut" date NOT NULL,
  "totalPrice" integer NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'upcoming',
  "paymentStatus" varchar(50) NOT NULL DEFAULT 'pending',
  "numberOfGuests" integer NOT NULL DEFAULT 1,
  "specialRequests" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "createdBy" uuid NOT NULL REFERENCES "users"("id"),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_stays_propertyId" ON "stays"("propertyId");
CREATE INDEX IF NOT EXISTS "idx_stays_guestId" ON "stays"("guestId");
CREATE INDEX IF NOT EXISTS "idx_stays_status" ON "stays"("status");
CREATE INDEX IF NOT EXISTS "idx_stays_dates" ON "stays"("checkIn", "checkOut"); 