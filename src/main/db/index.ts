import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "fs";
import path, { dirname } from "path";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { APP_NAME, DB_CONFIG } from "../constant";
import { app } from "electron";
import { fileURLToPath } from "url";

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
