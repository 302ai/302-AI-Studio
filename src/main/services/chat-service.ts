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
import type { MessageService } from "./message-service";

@ServiceRegister(TYPES.ChatService)
@injectable()
export class ChatService {
  constructor(
    @inject(TYPES.MessageService) private messageService: MessageService,
  ) {}

  async createAssistantMessage(
    message: Omit<
      CreateMessageData,
      "orderSeq" | "role" | "status" | "tokenCount"
    >,
  ): Promise<Message> {
    try {
      const existingMessages = await this.messageService._getMessagesByThreadId(
        message.threadId,
      );
      const nextOrderSeq = existingMessages.length + 1;

      const newMessage = await this.messageService._insertMessage({
        ...message,
        orderSeq: nextOrderSeq,
        role: "assistant",
        status: "pending",
        tokenCount: 0,
      });
      return newMessage;
    } catch (error) {
      logger.error("ChatService:createAssistantMessage error", { error });
      throw error;
    }
  }

  async updateMessage(
    messageId: string,
    updateData: UpdateMessageData,
  ): Promise<void> {
    try {
      await this.messageService._updateMessage(messageId, updateData);
    } catch (error) {
      logger.error("ChatService:updateMessage error", { error });
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
        await this.messageService._getMessagesByThreadId(threadId);
      return messages;
    } catch (error) {
      logger.error("ChatService:getMessagesByThreadId error", { error });
      throw error;
    }
  }
}
