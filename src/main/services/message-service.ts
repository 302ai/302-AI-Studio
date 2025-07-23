import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type {
  CreateMessageData,
  Message,
  UpdateMessageData,
} from "@shared/triplit/types";
import { inject, injectable } from "inversify";
import type { MessageDbService } from "./db-service/message-db-service";
import { EventNames, sendToThread } from "./event-service";

@injectable()
@ServiceRegister(TYPES.MessageService)
export class MessageService {
  constructor(
    @inject(TYPES.MessageDbService) private messageDbService: MessageDbService,
  ) {
    this.updatePendingMessagesToStop();
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
      logger.error("MessageService: insertMessage error", { error });
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
      logger.error("MessageService: updateMessage error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async editMessage(
    _event: Electron.IpcMainEvent,
    messageId: string,
    editData: {
      threadId: string;
    } & Pick<Message, "content">,
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
      logger.error("MessageService: editMessage error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteMessage(
    _event: Electron.IpcMainEvent,
    messageId: string,
    threadId: string,
  ): Promise<void> {
    try {
      // Get message before deleting for event notification
      const messageToDelete =
        await this.messageDbService.getMessageById(messageId);

      await this.messageDbService.deleteMessage(messageId);

      if (messageToDelete) {
        sendToThread(threadId, EventNames.MESSAGE_ACTIONS, {
          threadId,
          actions: {
            type: "delete-single",
            message: messageToDelete,
          },
        });
      }
    } catch (error) {
      logger.error("MessageService: deleteMessage error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteMessagesByIds(
    _event: Electron.IpcMainEvent,
    messageIds: string[],
    threadId: string,
  ): Promise<void> {
    try {
      const messagesToDelete = await Promise.all(
        messageIds.map((messageId) =>
          this.messageDbService.getMessageById(messageId),
        ),
      );

      await this.messageDbService.deleteMessagesByIds(messageIds);

      if (messagesToDelete.length > 0) {
        sendToThread(threadId, EventNames.MESSAGE_ACTIONS, {
          threadId,
          actions: {
            type: "delete-multiple",
            messages: messagesToDelete as Message[],
          },
        });
      }
    } catch (error) {
      logger.error("MessageService: deleteMessagesByIds error", { error });
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
      logger.error("MessageService: getMessagesByThreadId error", { error });
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
      logger.error("MessageService: getMessageById error", { error });
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
      logger.error("MessageService: deleteMessagesByThreadId error", {
        error,
      });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteAllMessages(
    _event: Electron.IpcMainEvent,
    threadIds?: string[],
  ): Promise<void> {
    try {
      if (threadIds) {
        await Promise.all(
          threadIds.map((threadId) =>
            this.messageDbService.deleteMessagesByThreadId(threadId),
          ),
        );
      } else {
        await this.messageDbService.deleteAllMessages();
      }
    } catch (error) {
      logger.error("MessageService: deleteAllMessages error", { error });
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
    } catch (error) {
      logger.error("MessageService: insertMessages error", { error });
      throw error;
    }
  }

  async updatePendingMessagesToStop(): Promise<void> {
    try {
      await this.messageDbService.updatePendingMessagesToStop();
    } catch (error) {
      logger.error("MessageService: updatePendingMessagesToStop error", {
        error,
      });
      throw error;
    }
  }
}
