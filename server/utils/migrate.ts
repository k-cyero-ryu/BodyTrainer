import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations() {
  console.log("Running database migrations...");

  // Create a separate pool for migrations
  const migrationPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const migrationDb = drizzle({ client: migrationPool });

    const migrationsFolder = join(process.cwd(), "migrations");

    await migrate(migrationDb, { migrationsFolder });

    console.log("✓ Database migrations completed successfully");
  } catch (error) {
    console.error("✗ Database migration failed:", error);
    throw error;
  } finally {
    await migrationPool.end();
  }
}
