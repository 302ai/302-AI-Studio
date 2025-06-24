import { TYPES } from "@main/shared/types";
import type {
  CreateThreadData,
  Thread,
  UpdateThreadData,
} from "@shared/triplit/types";
import Logger from "electron-log";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import type { ThreadDbService } from "./db-service/thread-db-service";

@ServiceRegister(TYPES.ThreadService)
@injectable()
export class ThreadService {
  constructor(
    @inject(TYPES.ThreadDbService) private threadDbService: ThreadDbService,
  ) {}

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
      Logger.error("ThreadService:insertThread error ---->", error);
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
      Logger.error("ThreadService:deleteThread error ---->", error);
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
      Logger.error("ThreadService:updateThread error ---->", error);
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
      Logger.error("ThreadService:getThreadById error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteAllThreads(): Promise<void> {
    try {
      await this.threadDbService.deleteAllThreads();
    } catch (error) {
      Logger.error("ThreadService:deleteAllThreads error ---->", error);
      throw error;
    }
  }
}
