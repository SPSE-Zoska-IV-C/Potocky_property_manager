import { drizzle } from "drizzle-orm/postgres-js";
import { RoleTable, UsersTable } from "../users/schema";
import postgres from "postgres";
import {
  GroupMembersTable,
  GroupPropertyPermissionsTable,
  GroupsTable,
  PropertyPermissionsTable,
  PropertyTable,
  GroupMemberRolesTable,
} from "../properties/schema";
import "dotenv/config";

const schemas = {
  usersTable: UsersTable,
  rolesTable: RoleTable,
  propertyTable: PropertyTable,
  propertyPermissionsTable: PropertyPermissionsTable,
  groupsTable: GroupsTable,
  groupMembersTable: GroupMembersTable,
  groupPropertyPermissionsTable: GroupPropertyPermissionsTable,
  groupMemberRolesTable: GroupMemberRolesTable,
};

// check if the required environment variables are set
if (!process.env.DATABASE_URL_35) {
  throw new Error("DATABASE_URL_35 environment variable is not set");
}

const connectionConfig = {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Max idle time for connections (in seconds)
  connect_timeout: 10, // Connection timeout (in seconds)
  prepare: false, // Disable prepared statements for better performance
};

const shouldLog = process.env.NODE_ENV === "development";

let client: postgres.Sql;
try {
  client = postgres(process.env.DATABASE_URL_35, connectionConfig);
  console.log("Database connection pool initialized");
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  process.exit(1);
}

export const db = drizzle(client, {
  schema: schemas,
  logger: shouldLog,
});

// handle cleanup on application shutdown
process.on("SIGINT", async () => {
  try {
    await client.end();
    console.log("Database connection pool closed");
    process.exit(0);
  } catch (error) {
    console.error("Error closing database connection:", error);
    process.exit(1);
  }
});
