import { existsSync, mkdirSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { DB_CONFIG, getAppDataPath } from "../constant";
import * as schema from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(getAppDataPath(), DB_CONFIG.dbFileName);

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath, {
  timeout: DB_CONFIG.timeout,
});

export let db: BetterSQLite3Database<typeof schema>;

export const dbConnect = async () => {
  db = drizzle(sqlite, { schema });

  if (process.env.NODE_ENV === "production") {
    migrate(db, {
      migrationsFolder: path.join(__dirname, "../../../migrations"),
    });
  }
};
