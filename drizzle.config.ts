import { defineConfig } from "drizzle-kit";
import { dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import { getDbPath } from "./src/main/constant";

const databasePath = getDbPath();

const generateDbPath = (dirString: string) => {
  try {
    const dir = dirname(dirString);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    console.log("Database path:", databasePath);
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

generateDbPath(databasePath);

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main/db/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: databasePath,
  },
});
