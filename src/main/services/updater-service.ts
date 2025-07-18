import { isDev } from "@main/constant";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import { app } from "electron";
import {
  type AppUpdater as _AppUpdater,
  autoUpdater,
  type ProgressInfo,
  type UpdateInfo,
} from "electron-updater";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import { EventNames, sendToRenderer } from "./event-service";
import type { SettingsService } from "./settings-service";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded";

@ServiceRegister(TYPES.UpdaterService)
@injectable()
export class UpdaterService {
  private autoUpdater: _AppUpdater = autoUpdater;
  private status: UpdaterStatus = "idle";
  private initFlag: boolean = false;

  constructor(
    @inject(TYPES.SettingsService) private settingsService: SettingsService,
  ) {
    this.setupEventListeners();
    this.init();
  }

  private async init(): Promise<void> {
    this.initFlag = true;

    const autoUpdate = await this.settingsService.getAutoUpdate();
    const feedUrl = await this.settingsService.getFeedUrl();

    this.autoUpdater.autoDownload = autoUpdate;
    // * Avoid auto install on app quit in dev mode
    this.autoUpdater.autoInstallOnAppQuit = isDev ? false : autoUpdate;
    this.autoUpdater.setFeedURL(feedUrl);
    this.autoUpdater.logger = logger;
    this.autoUpdater.forceDevUpdateConfig = !app.isPackaged;

    if (autoUpdate) {
      this.autoCheckForUpdates();
    }
  }

  private async autoCheckForUpdates(): Promise<void> {
    try {
      await this.autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error("UpdaterService:checkForUpdates error", { error });
      this.status = "idle";
    }
  }

  private setupEventListeners(): void {
    this.autoUpdater.on("update-available", (updateInfo: UpdateInfo) => {
      logger.info("new version available", { updateInfo });
      this.status = "available";
      sendToRenderer(EventNames.UPDATER_CHECK_STATUS, {
        status: "available",
        version: updateInfo.version,
      });
    });

    this.autoUpdater.on("update-not-available", (updateInfo: UpdateInfo) => {
      logger.info("no new version available", { updateInfo });
      this.status = "idle";

      if (this.initFlag) {
        this.initFlag = false;
        return;
      }

      sendToRenderer(EventNames.UPDATER_CHECK_STATUS, {
        status: "not-available",
        version: updateInfo.version,
      });
    });

    this.autoUpdater.on("download-progress", (progress: ProgressInfo) => {
      logger.info("downloading", { progress });
      this.status = "downloading";
      sendToRenderer(EventNames.UPDATER_DOWNLOAD_STATUS, {
        status: "downloading",
        precent: progress.percent,
      });
    });

    this.autoUpdater.on("update-downloaded", (updateInfo: UpdateInfo) => {
      logger.info("downloaded", { updateInfo });
      this.status = "downloaded";
      sendToRenderer(EventNames.UPDATER_DOWNLOAD_STATUS, {
        status: "downloaded",
      });
    });
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setAutoUpdate(
    _event: Electron.IpcMainInvokeEvent,
    autoUpdate: boolean,
  ): Promise<void> {
    this.autoUpdater.autoDownload = autoUpdate;
    this.autoUpdater.autoInstallOnAppQuit = autoUpdate;
    await this.settingsService.setAutoUpdate(autoUpdate);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async checkForUpdates(_event: Electron.IpcMainInvokeEvent): Promise<void> {
    try {
      this.status = "checking";
      await this.autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error("UpdaterService:checkForUpdates error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getStatus(_event: Electron.IpcMainInvokeEvent): Promise<UpdaterStatus> {
    return this.status;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async update(_event: Electron.IpcMainInvokeEvent): Promise<void> {
    this.status = "downloading";
    await this.autoUpdater.downloadUpdate();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async install(_event: Electron.IpcMainInvokeEvent): Promise<void> {
    this.autoUpdater.quitAndInstall(true, true);
  }
}
