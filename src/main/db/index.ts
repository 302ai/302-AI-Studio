import { existsSync, mkdirSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";
import { APP_NAME, DB_CONFIG } from "../constant";
import * as schema from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(
  app.getPath("appData"),
  APP_NAME,
  DB_CONFIG.dbFileName
);
const sqlite = new Database(DB_PATH, {
  timeout: DB_CONFIG.timeout,
});

export let db: BetterSQLite3Database<typeof schema>;

export const dbConnect = async () => {
  generateDbPath(DB_PATH);
  db = drizzle(sqlite, { schema });

  if (process.env.NODE_ENV === "production") {
    migrate(db, {
      migrationsFolder: path.join(__dirname, "../../../migrations"),
    });
  }
};

const generateDbPath = (dirString: string) => {
  try {
    const dir = dirname(dirString);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};
