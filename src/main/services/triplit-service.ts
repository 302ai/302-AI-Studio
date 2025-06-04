import { getTrilitConfig } from "@shared/triplit/config";
import {
  startTrilitServer,
  stopTrilitServer,
  type TriplitServer,
} from "@shared/triplit/server";
import { app } from "electron";
import Logger from "electron-log";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";

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
      this.server = await startTrilitServer();
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

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  getServerStatus(_event: Electron.IpcMainEvent): {
    isRunning: boolean;
    config: any;
  } {
    const config = getTrilitConfig();
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
    _event: Electron.IpcMainEvent
  ): Promise<{ success: boolean; message: string }> {
    try {
      Logger.info("Restarting Triplit server...");

      // 停止现有服务器
      if (this.server) {
        stopTrilitServer();
        this.server = null;
        this.isServerRunning = false;
      }

      // 重新启动
      this.server = await startTrilitServer();
      this.isServerRunning = true;

      Logger.info("Triplit server restarted successfully");
      return { success: true, message: "Server restarted successfully" };
    } catch (error) {
      Logger.error("Failed to restart Triplit server:", error);
      this.isServerRunning = false;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to restart server: ${errorMessage}`,
      };
    }
  }

  private cleanup() {
    if (this.server) {
      Logger.info("Stopping Triplit server...");
      stopTrilitServer();
      this.server = null;
      this.isServerRunning = false;
    }
  }
}
