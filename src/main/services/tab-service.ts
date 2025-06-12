import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { CreateTabData, Tab, UpdateTabData } from "@shared/triplit/types";
import Logger from "electron-log";
import { TabDbService } from "./db-service/tab-db-service";

@ServiceRegister("tabService")
export class TabService {
  private tabDbService: TabDbService;

  constructor() {
    this.tabDbService = new TabDbService();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertTab(
    _event: Electron.IpcMainEvent,
    tab: CreateTabData,
  ): Promise<Tab> {
    try {
      const newTab = await this.tabDbService.insertTab(tab);
      Logger.info("insertTab success ---->", newTab);
      return newTab;
    } catch (error) {
      Logger.error("insertTab error ---->", error);
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
      Logger.info("deleteTab success ---->", {
        tabId,
        currentActiveTabId,
      });
      return currentActiveTabId;
    } catch (error) {
      Logger.error("deleteTab error ---->", error);
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
      Logger.info("updateTab success ---->", {
        tabId,
        updateData,
      });
    } catch (error) {
      Logger.error("updateTab error ---->", error);
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
      Logger.info("getTab success ---->", {
        tabId,
        tab,
      });
      return tab;
    } catch (error) {
      Logger.error("getTab error ---->", error);
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
      Logger.info("moveTab success ---->", {
        fromIndex,
        toIndex,
      });
    } catch (error) {
      Logger.error("moveTab error ---->", error);
      throw error;
    }
  }
}
