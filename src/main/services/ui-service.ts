import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import type { Provider, Thread } from "@shared/triplit/types";
import Logger from "electron-log";
import { inject, injectable } from "inversify";
import type { UiDbService } from "./db-service/ui-db-service";
import { EventNames, emitter } from "./event-service";

@ServiceRegister(TYPES.UiService)
@injectable()
export class UiService {
  constructor(@inject(TYPES.UiDbService) private uiDbService: UiDbService) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    emitter.on(EventNames.PROVIDER_DELETE, () => {
      this.resetSelectedModelId();
    });
    emitter.on(EventNames.PROVIDER_UPDATE, () => {
      this.resetSelectedModelId();
    });
  }

  // * Active Provider Id
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateActiveProviderId(
    _event: Electron.IpcMainEvent,
    providerId: string,
  ): Promise<void> {
    try {
      await this.uiDbService.updateActiveProviderId(providerId);
    } catch (error) {
      Logger.error("UiService:updateActiveProviderId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveProviderId(): Promise<string> {
    try {
      const activeProviderId = await this.uiDbService.getActiveProviderId();
      return activeProviderId;
    } catch (error) {
      Logger.error("UiService:getActiveProviderId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearActiveProviderId(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.uiDbService.clearActiveProviderId();
    } catch (error) {
      Logger.error("UiService:clearActiveProviderId error ---->", error);
      throw error;
    }
  }

  // * Active Provider
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveProvider(): Promise<Provider | null> {
    try {
      const activeProvider = await this.uiDbService.getActiveProvider();
      return activeProvider;
    } catch (error) {
      Logger.error("UiService:getActiveProvider error ---->", error);
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
    } catch (error) {
      Logger.error("UiService:updateActiveThreadId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveThreadId(): Promise<string> {
    try {
      const activeThreadId = await this.uiDbService.getActiveThreadId();
      return activeThreadId;
    } catch (error) {
      Logger.error("UiService:getActiveThreadId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearActiveThreadId(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.uiDbService.clearActiveThreadId();
    } catch (error) {
      Logger.error("UiService:clearActiveThreadId error ---->", error);
      throw error;
    }
  }

  // * Active Thread
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveThread(): Promise<Thread | null> {
    try {
      const activeThread = await this.uiDbService.getActiveThread();
      return activeThread;
    } catch (error) {
      Logger.error("UiService:getActiveThread error ---->", error);
      throw error;
    }
  }

  // * Active Tab Id
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getActiveTabId(): Promise<string> {
    try {
      const activeTabId = await this.uiDbService.getActiveTabId();
      return activeTabId;
    } catch (error) {
      Logger.error("UiService:getActiveTabId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearActiveTabId(_event: Electron.IpcMainEvent): Promise<void> {
    try {
      await this.uiDbService.clearActiveTabId();
    } catch (error) {
      Logger.error("UiService:clearActiveTabId error ---->", error);
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
    } catch (error) {
      Logger.error("UiService:updateActiveTabHistory error ---->", error);
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
    } catch (error) {
      Logger.error("UiService:updateActiveTabId error ---->", error);
      throw error;
    }
  }

  // * Selected Model Id
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateSelectedModelId(
    _event: Electron.IpcMainEvent,
    modelId: string,
  ): Promise<void> {
    try {
      await this.uiDbService.updateSelectedModelId(modelId);
    } catch (error) {
      Logger.error("UiService:updateSelectedModelId error ---->", error);
      throw error;
    }
  }

  private async resetSelectedModelId(): Promise<void> {
    try {
      await this.uiDbService.updateSelectedModelId("");
    } catch (error) {
      Logger.error("UiService:updateSelectedModelId error ---->", error);
      throw error;
    }
  }
}
