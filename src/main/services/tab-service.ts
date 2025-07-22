import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type { CreateTabData, Tab, UpdateTabData } from "@shared/triplit/types";
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
      logger.error("TabService:insertTab error", { error });
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
      logger.error("TabService:deleteTab error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteAllTabs(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.tabDbService.deleteAllTabs();
    } catch (error) {
      logger.error("TabService:deleteAllTabs error", { error });
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
      logger.error("TabService:updateTab error", { error });
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
      logger.error("TabService:getTab error", { error });
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
      logger.error("TabService:moveTab error", { error });
      throw error;
    }
  }

  // @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  // async activateTab(
  //   _event: Electron.IpcMainEvent,
  //   tabId: string,
  // ): Promise<void> {
  //   //! TODO: Implement logic to handle tab activation
  //   try {
  //     const tab = await this.tabDbService.getTab(tabId);
  //     if (tab && tab.type === "setting") {
  //       await this.tabDbService.updateTab(tabId, {
  //         path: "/settings/general-settings",
  //       });
  //     }
  //   } catch (error) {
  //     logger.error("TabService:activateTab error", { error });
  //     throw error;
  //   }
  // }
}
