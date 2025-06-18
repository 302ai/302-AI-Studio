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
import { EventNames, sendToThread } from "./event-service";

@ServiceRegister("messageService")
export class MessageService {
  private messageDbService: MessageDbService;

  constructor() {
    this.messageDbService = new MessageDbService();
  }

  async _getMessagesByThreadId(threadId: string): Promise<Message[]> {
    const messages =
      await this.messageDbService.getMessagesByThreadId(threadId);
    return messages;
  }

  async _insertMessage(message: CreateMessageData): Promise<Message> {
    return await this.messageDbService.insertMessage(message);
  }

  async _updateMessage(
    messageId: string,
    updateData: UpdateMessageData,
  ): Promise<void> {
    await this.messageDbService.updateMessage(messageId, updateData);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertMessage(
    _event: Electron.IpcMainEvent,
    message: CreateMessageData,
  ): Promise<Message> {
    try {
      const newMessage = await this.messageDbService.insertMessage(message);
      return newMessage;
    } catch (error) {
      Logger.error("MessageService: insertMessage error ---->", error);
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
    } catch (error) {
      Logger.error("MessageService: updateMessage error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async editMessage(
    _event: Electron.IpcMainEvent,
    messageId: string,
    editData: {
      threadId: string;
    } & Pick<Message, "content" | "attachments">,
  ): Promise<void> {
    try {
      const updatedMessage = await this.messageDbService.updateMessage(
        messageId,
        editData,
      );
      sendToThread(editData.threadId, EventNames.MESSAGE_ACTIONS, {
        threadId: editData.threadId,
        actions: {
          type: "edit",
          message: updatedMessage,
        },
      });
    } catch (error) {
      Logger.error("MessageService: editMessage error ---->", error);
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
    } catch (error) {
      Logger.error("MessageService: deleteMessage error ---->", error);
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
      return messages;
    } catch (error) {
      Logger.error("MessageService: getMessagesByThreadId error ---->", error);
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
      return message;
    } catch (error) {
      Logger.error("MessageService: getMessageById error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteMessagesByThreadId(
    _event: Electron.IpcMainEvent,
    threadId: string,
  ): Promise<void> {
    try {
      await this.messageDbService.deleteMessagesByThreadId(threadId);
      sendToThread(threadId, EventNames.MESSAGE_ACTIONS, {
        threadId,
        actions: {
          type: "delete",
        },
      });
    } catch (error) {
      Logger.error(
        "MessageService: deleteMessagesByThreadId error ---->",
        error,
      );
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteAllMessages(): Promise<void> {
    try {
      await this.messageDbService.deleteAllMessages();
    } catch (error) {
      Logger.error("MessageService: deleteAllMessages error ---->", error);
      throw error;
    }
  }
}
