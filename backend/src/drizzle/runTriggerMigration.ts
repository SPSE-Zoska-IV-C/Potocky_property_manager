import { db } from "./db";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runTriggerMigration() {
  try {
    console.log("Starting trigger migration...");

    // Create the trigger function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = now();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("Created trigger function");

    // Create the trigger
    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_stays_updated_at ON "stays";
      CREATE TRIGGER update_stays_updated_at
          BEFORE UPDATE ON "stays"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log("Created trigger");
    console.log("Trigger migration completed successfully!");
  } catch (error) {
    console.error("Trigger migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTriggerMigration();
