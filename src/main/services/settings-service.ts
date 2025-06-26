import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import type { SearchService } from "@shared/triplit/types";
import Logger from "electron-log";
import { inject, injectable } from "inversify";
import type { SettingsDbService } from "./db-service/settings-db-service";

@injectable()
@ServiceRegister(TYPES.SettingsService)
export class SettingsService {
  constructor(
    @inject(TYPES.SettingsDbService)
    private settingsDbService: SettingsDbService,
  ) {}

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setEnableWebSearch(_event: Electron.IpcMainEvent, enable: boolean) {
    try {
      await this.settingsDbService.setEnableWebSearch(enable);
    } catch (error) {
      Logger.error("ConfigService:setEnableWebSearch error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setEnableReason(_event: Electron.IpcMainEvent, enable: boolean) {
    try {
      await this.settingsDbService.setEnableReason(enable);
    } catch (error) {
      Logger.error("ConfigService:setEnablleReason error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setSearchService(
    _event: Electron.IpcMainEvent,
    searchService: SearchService,
  ) {
    try {
      await this.settingsDbService.setSearchService(searchService);
    } catch (error) {
      Logger.error("SettingsService:setsearchService error ---->", error);
      throw error;
    }
  }
}
