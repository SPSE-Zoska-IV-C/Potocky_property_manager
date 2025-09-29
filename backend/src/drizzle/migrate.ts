import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationClient = postgres(process.env.DATABASE_URL_35! || "", {
  max: 1,
});

async function main() {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./src/drizzle/migrations",
  });

  console.error(
    "\n\n---------------------------------------------------------------------------------\n\n"
  );
  console.log(
    "------------------------------ Migrations finished ------------------------------"
  );
  console.error(
    "\n\n---------------------------------------------------------------------------------\n\n"
  );

  await migrationClient.end();
}

main();
