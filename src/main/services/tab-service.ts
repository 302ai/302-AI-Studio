import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import type { CreateTabData, Tab, UpdateTabData } from "@shared/triplit/types";
import Logger from "electron-log";
import { inject, injectable } from "inversify";
import type { TabDbService } from "./db-service/tab-db-service";

@ServiceRegister(TYPES.TabService)
@injectable()
export class TabService {
  constructor(@inject(TYPES.TabDbService) private tabDbService: TabDbService) {}

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertTab(
    _event: Electron.IpcMainEvent,
    tab: CreateTabData,
  ): Promise<Tab> {
    try {
      const newTab = await this.tabDbService.insertTab(tab);
      return newTab;
    } catch (error) {
      Logger.error("TabService:insertTab error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async deleteTab(
    _event: Electron.IpcMainEvent,
    tabId: string,
  ): Promise<string> {
    try {
      const currentActiveTabId = await this.tabDbService.deleteTab(tabId);
      return currentActiveTabId;
    } catch (error) {
      Logger.error("TabService:deleteTab error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateTab(
    _event: Electron.IpcMainEvent,
    tabId: string,
    updateData: UpdateTabData,
  ): Promise<void> {
    try {
      await this.tabDbService.updateTab(tabId, updateData);
    } catch (error) {
      Logger.error("TabService:updateTab error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getTab(
    _event: Electron.IpcMainEvent,
    tabId: string,
  ): Promise<Tab | null> {
    try {
      const tab = await this.tabDbService.getTab(tabId);
      return tab;
    } catch (error) {
      Logger.error("TabService:getTab error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async moveTab(
    _event: Electron.IpcMainEvent,
    fromIndex: number,
    toIndex: number,
    tabs: Tab[],
  ): Promise<void> {
    try {
      await this.tabDbService.moveTab(fromIndex, toIndex, tabs);
    } catch (error) {
      Logger.error("TabService:moveTab error ---->", error);
      throw error;
    }
  }
}
