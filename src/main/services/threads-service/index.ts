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

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async createThread(_event: Electron.IpcMainEvent, threadData: ThreadItem) {
    try {
      const {
        id: threadId,
        title,
        providerId,
        modelId,
        createdAt,
        updatedAt,
        collected,
      } = threadData;

      const dbThreadData: InsertThread = {
        threadId,
        title,
        providerId,
        modelId,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        collected,
      };

      const thread = await this.threadRepository.createThread(dbThreadData);

      Logger.info("Thread created successfully, threadId: ", thread.id);

      return { success: true, threadId: thread.id };
    } catch (error) {
      Logger.error("Failed to create thread:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async updateThread(
    _event: Electron.IpcMainEvent,
    threadId: string,
    data: Partial<ThreadItem>
  ) {
    try {
      const updateData: Partial<InsertThread> = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.collected !== undefined) updateData.collected = data.collected;
      if (data.providerId !== undefined)
        updateData.providerId = data.providerId;
      if (data.modelId !== undefined) updateData.modelId = data.modelId;

      const thread = await this.threadRepository.updateThread(
        threadId,
        updateData
      );
      Logger.info("Thread updated successfully, threadId: ", thread.id);

      return { success: true, thread };
    } catch (error) {
      Logger.error("Failed to update thread:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteThread(_event: Electron.IpcMainEvent, threadId: string) {
    try {
      const success = await this.threadRepository.delete(threadId);
      if (!success) {
        throw new Error("Failed to delete thread");
      }

      Logger.info("Thread deleted successfully, threadId: ", threadId);
    } catch (error) {
      Logger.error("Failed to delete thread:", error);
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getThreads(_event: Electron.IpcMainEvent) {
    return await this.threadRepository.getAllThreads();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getThreadById(_event: Electron.IpcMainEvent, threadId: string) {
    return await this.threadRepository.getByThreadId(threadId);
  }
}
