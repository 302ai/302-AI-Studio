import { db } from "@main/db";
import { ThreadRepository } from "@main/db/repositories/thread-repository";
import type { InsertThread } from "@main/db/schema/threads";
import type { ThreadItem } from "@shared/types/thread";
import Logger from "electron-log";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../shared/reflect";

@ServiceRegister("threadsService")
export class ThreadsService {
  private threadRepository: ThreadRepository;

  constructor() {
    this.threadRepository = new ThreadRepository(db);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setActiveThreadId(_event: Electron.IpcMainEvent, threadId: string) {
    console.log("threadId", threadId);
  }

  getThreadId(_event: Electron.IpcMainEvent, threadId: string) {
    console.log("threadId", threadId);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async createThread(_event: Electron.IpcMainEvent, threadData: ThreadItem) {
    try {
      const {
        id: threadId,
        title,
        settings: { providerId, modelId },
        createdAt,
        updatedAt,
        isCollected,
      } = threadData;

      const dbThreadData: InsertThread = {
        threadId,
        title,
        providerId,
        modelId,
        createdAt,
        updatedAt,
        isCollected,
      };

      const thread = await this.threadRepository.create(dbThreadData);

      Logger.info("Thread created successfully, threadId: ", thread.threadId);
      return { success: true, threadId: thread.threadId };
    } catch (error) {
      Logger.error("Failed to create thread:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
