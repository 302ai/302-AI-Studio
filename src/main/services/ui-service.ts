import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { Provider, Thread } from "@shared/triplit/types";
import Logger from "electron-log";
import { UiDbService } from "./db-service/ui-db-service";

@ServiceRegister("uiService")
export class UiService {
  private uiDbService: UiDbService;

  constructor() {
    this.uiDbService = new UiDbService();
  }

  // * Active Provider Id
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateActiveProviderId(
    _event: Electron.IpcMainEvent,
    providerId: string,
  ): Promise<void> {
    try {
      await this.uiDbService.updateActiveProviderId(providerId);
      Logger.info("updateActiveProviderId success ---->", providerId);
    } catch (error) {
      Logger.error("updateActiveProviderId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveProviderId(): Promise<string> {
    try {
      const activeProviderId = await this.uiDbService.getActiveProviderId();
      Logger.info("getActiveProviderId success ---->", activeProviderId);
      return activeProviderId;
    } catch (error) {
      Logger.error("getActiveProviderId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearActiveProviderId(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.uiDbService.clearActiveProviderId();
      Logger.info("clearActiveProviderId success");
    } catch (error) {
      Logger.error("clearActiveProviderId error ---->", error);
      throw error;
    }
  }

  // * Active Provider
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveProvider(): Promise<Provider | null> {
    try {
      const activeProvider = await this.uiDbService.getActiveProvider();
      Logger.info("getActiveProvider success ---->", activeProvider);
      return activeProvider;
    } catch (error) {
      Logger.error("getActiveProvider error ---->", error);
      throw error;
    }
  }

  // * Active Thread Id
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateActiveThreadId(
    _event: Electron.IpcMainEvent,
    threadId: string,
  ): Promise<void> {
    try {
      await this.uiDbService.updateActiveThreadId(threadId);
      Logger.info("updateActiveThreadId success ---->", threadId);
    } catch (error) {
      Logger.error("updateActiveThreadId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveThreadId(): Promise<string> {
    try {
      const activeThreadId = await this.uiDbService.getActiveThreadId();
      Logger.info("getActiveThreadId success ---->", activeThreadId);
      return activeThreadId;
    } catch (error) {
      Logger.error("getActiveThreadId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearActiveThreadId(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.uiDbService.clearActiveThreadId();
      Logger.info("clearActiveThreadId success");
    } catch (error) {
      Logger.error("clearActiveThreadId error ---->", error);
      throw error;
    }
  }

  // * Active Thread
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveThread(): Promise<Thread | null> {
    try {
      const activeThread = await this.uiDbService.getActiveThread();
      Logger.info("getActiveThread success ---->", activeThread);
      return activeThread;
    } catch (error) {
      Logger.error("getActiveThread error ---->", error);
      throw error;
    }
  }

  // * Active Tab Id
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveTabId(): Promise<string> {
    try {
      const activeTabId = await this.uiDbService.getActiveTabId();
      Logger.info("getActiveTabId success ---->", activeTabId);
      return activeTabId;
    } catch (error) {
      Logger.error("getActiveTabId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearActiveTabId(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.uiDbService.clearActiveTabId();
      Logger.info("clearActiveTabId success");
    } catch (error) {
      Logger.error("clearActiveTabId error ---->", error);
      throw error;
    }
  }

  // * Tab History
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateActiveTabHistory(
    _event: Electron.IpcMainEvent,
    tabId: string,
  ): Promise<void> {
    try {
      await this.uiDbService.updateActiveTabHistory(tabId);
      Logger.info("updateActiveTabHistory success ---->", tabId);
    } catch (error) {
      Logger.error("updateActiveTabHistory error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateActiveTabId(
    _event: Electron.IpcMainEvent,
    tabId: string,
  ): Promise<void> {
    try {
      await this.uiDbService.updateActiveTabId(tabId);
      Logger.info("updateActiveTabId success ---->", tabId);
    } catch (error) {
      Logger.error("updateActiveTabId error ---->", error);
      throw error;
    }
  }
}
