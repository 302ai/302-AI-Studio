/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import fs from "node:fs";
import path, { join } from "node:path";
import { isDev } from "@main/constant";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import { initTriplitClient } from "@main/triplit/client";
import { extractErrorMessage } from "@main/utils/error-utils";
import logger from "@shared/logger/main-logger";
import { TriplitLogHandler } from "@shared/triplit/log-handler";
import { schema } from "@shared/triplit/schema";
import { createServer, createTriplitStorageProvider } from "@triplit/server";
import { app } from "electron";
import { injectable } from "inversify";
import portfinder from "portfinder";

portfinder.setBasePort(9000);

export interface TriplitServerConfig {
  port: number;
  verboseLogs: boolean;
  jwtSecret: string;
  projectId: string;
  externalJwtSecret?: string;
  maxPayloadMb?: string;
  localDatabaseUrl?: string;
}

const defaultTriplitConfig: TriplitServerConfig = {
  port: 9000,
  verboseLogs: false,
  jwtSecret: "default-jwt-secret-change-in-production",
  projectId: "chat-app-triplit",
  externalJwtSecret: undefined,
  maxPayloadMb: "10",
  localDatabaseUrl: undefined, // Will be set dynamically
};

type TriplitServer = ReturnType<Awaited<ReturnType<typeof createServer>>>;

@ServiceRegister(TYPES.TriplitService)
@injectable()
export class TriplitService {
  private server: TriplitServer | null = null;
  private isServerRunning = false;
  private port: number = 9000;

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      logger.info("Starting Triplit server...");
      this.server = await this.startTriplitServer();
      this.isServerRunning = true;
      logger.info("Triplit server started successfully");

      const client = await initTriplitClient();
      client.updateServerUrl(`http://localhost:${this.port}`);
      client.connect();

      logger.info("TriplitService: Client connected", {
        serverUrl: client.serverUrl,
        process: "main",
      });

      app.on("before-quit", () => {
        this.cleanup();
      });

      app.on("will-quit", () => {
        this.cleanup();
      });
    } catch (error) {
      logger.error("Failed to start Triplit server:", { error });
      this.isServerRunning = false;
    }
  }

  private async startTriplitServer() {
    if (this.server) {
      logger.info("Triplit server is already running");
      return this.server;
    }

    const config = await this.getTriplitConfig();

    if (config.localDatabaseUrl) {
      const dbFile = config.localDatabaseUrl;
      const dbDir = path.dirname(dbFile);
      logger.info("Database file:", { dbFile });
      logger.info("Database directory:", { dbDir });

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info("Database directory created successfully");
      } else {
        logger.info("Database directory already exists");
      }

      process.env.LOCAL_DATABASE_URL = dbFile;
      logger.info("Setting LOCAL_DATABASE_URL to:", { dbFile });
    }

    const sqliteKV = await createTriplitStorageProvider("sqlite");

    const startServer = await createServer({
      storage: sqliteKV,
      verboseLogs: false, // Disable default verbose logging
      logHandler: new TriplitLogHandler(logger), // Use our custom log handler
      dbOptions: {
        schema: {
          collections: schema,
        },
      },
      jwtSecret: config.jwtSecret,
      projectId: config.projectId,
      externalJwtSecret: config.externalJwtSecret,
      maxPayloadMb: config.maxPayloadMb,
    });

    this.server = startServer(config.port);

    logger.info("Triplit server running on port", { port: config.port });
    logger.info("Database location:", { location: config.localDatabaseUrl });

    return this.server;
  }

  private async getTriplitConfig(): Promise<TriplitServerConfig> {
    const userDataPath = isDev
      ? join(__dirname, "../../../db")
      : app.getPath("userData");
    const defaultDatabaseDir = path.join(userDataPath, "triplit");
    const defaultDatabaseFile = path.join(defaultDatabaseDir, "db.sqlite");

    logger.info("Default database file:", { defaultDatabaseFile });

    this.port = await portfinder.getPortPromise();

    const config = {
      port: this.port,
      verboseLogs: false, // Force disable verbose logs
      jwtSecret: process.env.JWT_SECRET || defaultTriplitConfig.jwtSecret,
      projectId: process.env.PROJECT_ID || defaultTriplitConfig.projectId,
      externalJwtSecret: process.env.EXTERNAL_JWT_SECRET,
      maxPayloadMb:
        process.env.MAX_BODY_SIZE || defaultTriplitConfig.maxPayloadMb,
      localDatabaseUrl: process.env.LOCAL_DATABASE_URL || defaultDatabaseFile,
    };

    logger.info("Final Triplit config:", { config });
    return config;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getServerStatus(_event: Electron.IpcMainEvent): Promise<{
    isRunning: boolean;
    config: Partial<TriplitServerConfig>;
  }> {
    const config = await this.getTriplitConfig();
    return {
      isRunning: this.isServerRunning,
      config: {
        port: config.port,
        projectId: config.projectId,
        verboseLogs: config.verboseLogs,
      },
    };
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async restartServer(
    _event: Electron.IpcMainEvent,
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.info("Restarting Triplit server...");

      // 停止现有服务器
      if (this.server) {
        this.stopTriplitServer();
      }

      // 重新启动
      this.server = await this.startTriplitServer();
      this.isServerRunning = true;

      logger.info("Triplit server restarted successfully");
      return { success: true, message: "Server restarted successfully" };
    } catch (error) {
      logger.error("Failed to restart Triplit server:", { error });
      this.isServerRunning = false;
      const errorMessage = extractErrorMessage(error);
      return {
        success: false,
        message: `Failed to restart server: ${errorMessage}`,
      };
    }
  }

  private stopTriplitServer() {
    if (this.server) {
      this.server.close(() => {
        logger.info("Triplit server stopped");
        this.server = null;
        this.isServerRunning = false;
      });
    }
  }

  private cleanup() {
    if (this.server) {
      logger.info("Stopping Triplit server...");
      this.stopTriplitServer();
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getServerPort(_event: Electron.IpcMainEvent): Promise<number> {
    return this.port;
  }
}
