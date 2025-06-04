import fs from "node:fs";
import path from "node:path";
import { createServer } from "@triplit/server";
import { getTrilitConfig } from "./config";

export type TriplitServer = ReturnType<
  Awaited<ReturnType<typeof createServer>>
>;

let dbServer: TriplitServer | null = null;

export async function startTrilitServer(): Promise<TriplitServer> {
  if (dbServer) {
    console.log("Triplit server is already running");
    return dbServer;
  }

  const config = getTrilitConfig();

  if (config.localDatabaseUrl) {
    const dbFile = config.localDatabaseUrl;
    const dbDir = path.dirname(dbFile);
    console.log("Database file:", dbFile);
    console.log("Database directory:", dbDir);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log("Database directory created successfully");
    } else {
      console.log("Database directory already exists");
    }

    process.env.LOCAL_DATABASE_URL = dbFile;
    console.log("Setting LOCAL_DATABASE_URL to:", dbFile);
  }

  const startServer = await createServer({
    storage: "sqlite",
    verboseLogs: config.verboseLogs,
    jwtSecret: config.jwtSecret,
    projectId: config.projectId,
    externalJwtSecret: config.externalJwtSecret,
    maxPayloadMb: config.maxPayloadMb,
  });

  dbServer = startServer(config.port);

  console.log("Triplit server running on port", config.port);
  console.log("Database location:", config.localDatabaseUrl);

  return dbServer;
}

export function stopTrilitServer() {
  if (dbServer) {
    dbServer.close(() => {
      console.log("Triplit server shutting down...");
      dbServer = null;
    });
  }
}

if (require.main === module) {
  startTrilitServer();

  process.on("SIGINT", () => {
    stopTrilitServer();
    process.exit();
  });
}
