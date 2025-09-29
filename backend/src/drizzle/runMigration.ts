import { db } from "./db";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface PostgresError {
  code: string;
  message: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as any).code === "string"
  );
}

async function runMigration() {
  try {
    console.log("Starting migration...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "0026_add_user_email_fields.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute the entire migration as a single statement
    console.log("\nExecuting migration...");
    try {
      await db.execute(sql.raw(migrationSQL));
      console.log("Success!");
    } catch (error) {
      if (isPostgresError(error) && error.code === "42P07") {
        // Ignore "already exists" errors
        console.log("Some objects already exist, continuing...");
      } else {
        console.error("Error executing migration:", error);
        throw error;
      }
    }

    // Run the trigger migration
    console.log("\nRunning trigger migration...");
    const triggerSQL = fs.readFileSync(
      path.join(__dirname, "migrations", "0021_add_stays_trigger.sql"),
      "utf8"
    );

    try {
      await db.execute(sql.raw(triggerSQL));
      console.log("Trigger migration successful!");
    } catch (error) {
      console.error("Error executing trigger migration:", error);
      throw error;
    }

    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();
