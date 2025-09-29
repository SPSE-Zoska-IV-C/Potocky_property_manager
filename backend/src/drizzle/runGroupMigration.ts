import { db } from "./db";
import { sql } from "drizzle-orm";

async function runGroupMigration() {
  try {
    console.log("Starting group migration...");

    // Drop the existing column if it exists
    await db.execute(sql`
      ALTER TABLE "guests" 
      DROP COLUMN IF EXISTS "groupId"
    `);

    // Add groupId column with the correct definition
    await db.execute(sql`
      ALTER TABLE "guests" 
      ADD COLUMN "groupId" uuid NOT NULL REFERENCES "groups"("id")
    `);

    // Add index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "guests_groupId_idx" ON "guests"("groupId")
    `);

    console.log("Group migration completed successfully!");
  } catch (error) {
    console.error("Error during group migration:", error);
    throw error;
  }
}

runGroupMigration();
