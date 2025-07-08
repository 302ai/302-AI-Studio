import { TYPES } from "@main/shared/types";
import type {
  CreateThreadData,
  Thread,
  UpdateThreadData,
} from "@shared/triplit/types";
import logger from "@shared/logger/main-logger";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import type { ThreadDbService } from "./db-service/thread-db-service";
import { EventNames, emitter } from "./event-service";

@ServiceRegister(TYPES.ThreadService)
@injectable()
export class ThreadService {
  constructor(
    @inject(TYPES.ThreadDbService) private threadDbService: ThreadDbService,
  ) {
    emitter.on(EventNames.PROVIDER_DELETE, ({ providerId }) => {
      this.resetThreadByProviderId(providerId);
    });
  }

  private async resetThreadByProviderId(providerId: string) {
    try {
      const threads = await this.threadDbService.getThreads();
      for (const thread of threads) {
        if (thread.providerId === providerId) {
          await this.threadDbService.updateThread(thread.id, {
            providerId: "",
            modelId: "",
          });
        }
      }
    } catch (error) {
      logger.error("ThreadService:resetProviderId error", { error });
      throw error;
    }
  }

  async getThreads(): Promise<Thread[]> {
    const threads = await this.threadDbService.getThreads();
    return threads;
  }

  async _getThreadById(threadId: string): Promise<Thread | null> {
    return await this.threadDbService.getThreadById(threadId);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertThread(
    _event: Electron.IpcMainEvent,
    thread: CreateThreadData,
  ): Promise<Thread> {
    try {
      const newThread = await this.threadDbService.insertThread(thread);
      return newThread;
    } catch (error) {
      logger.error("ThreadService:insertThread error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteThread(
    _event: Electron.IpcMainEvent,
    threadId: string,
  ): Promise<void> {
    try {
      await this.threadDbService.deleteThread(threadId);
    } catch (error) {
      logger.error("ThreadService:deleteThread error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateThread(
    _event: Electron.IpcMainEvent,
    threadId: string,
    updateData: UpdateThreadData,
  ): Promise<void> {
    try {
      await this.threadDbService.updateThread(threadId, updateData);
    } catch (error) {
      logger.error("ThreadService:updateThread error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getThreadById(
    _event: Electron.IpcMainEvent,
    threadId: string,
  ): Promise<Thread | null> {
    try {
      const thread = await this.threadDbService.getThreadById(threadId);
      return thread;
    } catch (error) {
      logger.error("ThreadService:getThreadById error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async deleteAllThreads(): Promise<string[]> {
    try {
      const threadIds = await this.threadDbService.deleteAllThreads();
      return threadIds;
    } catch (error) {
      logger.error("ThreadService:deleteAllThreads error", { error });
      throw error;
    }
  }
}
