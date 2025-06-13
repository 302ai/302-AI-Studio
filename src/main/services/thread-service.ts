import type {
  CreateThreadData,
  Thread,
  UpdateThreadData,
} from "@shared/triplit/types";
import Logger from "electron-log";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import { ThreadDbService } from "./db-service/thread-db-service";

@ServiceRegister("threadService")
export class ThreadService {
  private threadDbService: ThreadDbService;

  constructor() {
    this.threadDbService = new ThreadDbService();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertThread(
    _event: Electron.IpcMainEvent,
    thread: CreateThreadData,
  ): Promise<Thread> {
    try {
      const newThread = await this.threadDbService.insertThread(thread);
      Logger.info("insertThread success ---->", newThread);
      return newThread;
    } catch (error) {
      Logger.error("insertThread error ---->", error);
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
      Logger.info("deleteThread success ---->", threadId);
    } catch (error) {
      Logger.error("deleteThread error ---->", error);
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
      Logger.info("updateThread success ---->", threadId);
    } catch (error) {
      Logger.error("updateThread error ---->", error);
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
      Logger.info("getThreadById success ---->", thread);
      return thread;
    } catch (error) {
      Logger.error("getThreadById error ---->", error);
      throw error;
    }
  }
}
