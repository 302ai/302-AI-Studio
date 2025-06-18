import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type {
  CreateMessageData,
  Message,
  UpdateMessageData,
} from "@shared/triplit/types";
import Logger from "electron-log";
import { MessageDbService } from "./db-service/message-db-service";

@ServiceRegister("messageService")
export class MessageService {
  private messageDbService: MessageDbService;

  constructor() {
    this.messageDbService = new MessageDbService();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertMessage(
    _event: Electron.IpcMainEvent,
    message: CreateMessageData,
  ): Promise<Message> {
    try {
      const newMessage = await this.messageDbService.insertMessage(message);
      Logger.info("insertMessage success ---->", newMessage);
      return newMessage;
    } catch (error) {
      Logger.error("insertMessage error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateMessage(
    _event: Electron.IpcMainEvent,
    messageId: string,
    updateData: UpdateMessageData,
  ): Promise<void> {
    try {
      await this.messageDbService.updateMessage(messageId, updateData);
      Logger.info("updateMessage success ---->", messageId);
    } catch (error) {
      Logger.error("updateMessage error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteMessage(
    _event: Electron.IpcMainEvent,
    messageId: string,
  ): Promise<void> {
    try {
      await this.messageDbService.deleteMessage(messageId);
      Logger.info("deleteMessage success ---->", { messageId });
    } catch (error) {
      Logger.error("deleteMessage error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getMessagesByThreadId(
    _event: Electron.IpcMainEvent,
    threadId: string,
  ): Promise<Message[]> {
    try {
      const messages =
        await this.messageDbService.getMessagesByThreadId(threadId);
      Logger.info("getMessagesByThreadId success ---->", {
        threadId,
        messages,
      });
      return messages;
    } catch (error) {
      Logger.error("getMessagesByThreadId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getMessageById(
    _event: Electron.IpcMainEvent,
    messageId: string,
  ): Promise<Message | null> {
    try {
      const message = await this.messageDbService.getMessageById(messageId);
      Logger.info("getMessageById success ---->", { messageId, message });
      return message;
    } catch (error) {
      Logger.error("getMessageById error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async cleanMessagesByThreadId(
    _event: Electron.IpcMainEvent,
    threadId: string,
  ): Promise<void> {
    try {
      await this.messageDbService.cleanMessagesByThreadId(threadId);
      Logger.info("cleanMessagesByThreadId success ---->", { threadId });
    } catch (error) {
      Logger.error("cleanMessagesByThreadId error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteAllMessages(): Promise<void> {
    try {
      await this.messageDbService.deleteAllMessages();
      Logger.info("deleteAllMessages success");
    } catch (error) {
      Logger.error("deleteAllMessages error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async insertMessages(
    _event: Electron.IpcMainEvent,
    messages: CreateMessageData[],
  ): Promise<void> {
    try {
      await this.messageDbService.insertMessages(messages);
      Logger.info("insertMessages success ---->", { messages });
    } catch (error) {
      Logger.error("insertMessages error ---->", error);
      throw error;
    }
  }
}
