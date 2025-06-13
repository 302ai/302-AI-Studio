/** biome-ignore-all lint/suspicious/noExplicitAny: biome-ignore-all */
import fs from "node:fs";
import path from "node:path";
import { extractErrorMessage } from "@main/utils/error-utils";
import { createServer, createTriplitStorageProvider } from "@triplit/server";
import { app } from "electron";
import Logger from "electron-log";
import portfinder from "portfinder";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";

// Triplit服务器配置
export interface TrilitServerConfig {
  port: number;
  verboseLogs: boolean;
  jwtSecret: string;
  projectId: string;
  externalJwtSecret?: string;
  maxPayloadMb?: string;
  localDatabaseUrl?: string;
}

const defaultTrilitConfig: TrilitServerConfig = {
  port: 8080,
  verboseLogs: false,
  jwtSecret: "default-jwt-secret-change-in-production",
  projectId: "chat-app-triplit",
  externalJwtSecret: undefined,
  maxPayloadMb: "10",
  localDatabaseUrl: undefined, // Will be set dynamically
};

type TriplitServer = ReturnType<Awaited<ReturnType<typeof createServer>>>;

@ServiceRegister("triplitService")
export class TriplitService {
  private server: TriplitServer | null = null;
  private isServerRunning = false;

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      Logger.info("Starting Triplit server...");
      this.server = await this.startTriplitServer();
      this.isServerRunning = true;
      Logger.info("Triplit server started successfully");

      // 监听应用退出事件，确保服务器正确关闭
      app.on("before-quit", () => {
        this.cleanup();
      });

      app.on("will-quit", () => {
        this.cleanup();
      });
    } catch (error) {
      Logger.error("Failed to start Triplit server:", error);
      this.isServerRunning = false;
    }
  }

  private async startTriplitServer() {
    if (this.server) {
      Logger.info("Triplit server is already running");
      return this.server;
    }

    const config = await this.getTrilitConfig();

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

    const sqliteKV = await createTriplitStorageProvider("sqlite");

    const startServer = await createServer({
      storage: sqliteKV,
      verboseLogs: config.verboseLogs,
      jwtSecret: config.jwtSecret,
      projectId: config.projectId,
      externalJwtSecret: config.externalJwtSecret,
      maxPayloadMb: config.maxPayloadMb,
    });

    this.server = startServer(config.port);

    console.log("Triplit server running on port", config.port);
    console.log("Database location:", config.localDatabaseUrl);

    return this.server;
  }

  private async getTrilitConfig(): Promise<TrilitServerConfig> {
    const userDataPath = app.getPath("userData");
    const defaultDatabaseDir = path.join(userDataPath, "triplit");
    const defaultDatabaseFile = path.join(defaultDatabaseDir, "db.sqlite");

    console.log("Default database file:", defaultDatabaseFile);

    const port = await portfinder.getPortPromise();
    const config = {
      port: port,
      verboseLogs: !!(
        process.env.VERBOSE_LOGS || defaultTrilitConfig.verboseLogs
      ),
      jwtSecret: process.env.JWT_SECRET || defaultTrilitConfig.jwtSecret,
      projectId: process.env.PROJECT_ID || defaultTrilitConfig.projectId,
      externalJwtSecret: process.env.EXTERNAL_JWT_SECRET,
      maxPayloadMb:
        process.env.MAX_BODY_SIZE || defaultTrilitConfig.maxPayloadMb,
      localDatabaseUrl: process.env.LOCAL_DATABASE_URL || defaultDatabaseFile,
    };

    console.log("Final Triplit config:", config);
    return config;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getServerStatus(_event: Electron.IpcMainEvent): Promise<{
    isRunning: boolean;
    config: any;
  }> {
    const config = await this.getTrilitConfig();
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
      Logger.info("Restarting Triplit server...");

      // 停止现有服务器
      if (this.server) {
        this.stopTriplitServer();
      }

      // 重新启动
      this.server = await this.startTriplitServer();
      this.isServerRunning = true;

      Logger.info("Triplit server restarted successfully");
      return { success: true, message: "Server restarted successfully" };
    } catch (error) {
      Logger.error("Failed to restart Triplit server:", error);
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
        Logger.info("Triplit server stopped");
        this.server = null;
        this.isServerRunning = false;
      });
    }
  }

  private cleanup() {
    if (this.server) {
      Logger.info("Stopping Triplit server...");
      this.stopTriplitServer();
    }
  }
}
