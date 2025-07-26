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
import { EventNames, emitter, sendToThread } from "./event-service";
import type { MessageService } from "./message-service";

@ServiceRegister(TYPES.ChatService)
@injectable()
export class ChatService {
  constructor(
    @inject(TYPES.MessageService) private messageService: MessageService,
  ) {
    this.setupConversationEventListeners();
  }

  private setupConversationEventListeners() {
    emitter.on(EventNames.PROVIDER_CONVERSATION_CREATED, ({ threadId }) =>
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "pending",
      }),
    );

    emitter.on(
      EventNames.PROVIDER_CONVERSATION_IN_PROGRESS,
      ({ threadId, delta }) =>
        sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
          threadId,
          delta,
          status: "pending",
        }),
    );

    emitter.on(EventNames.PROVIDER_CONVERSATION_COMPLETED, ({ threadId }) =>
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "success",
      }),
    );

    emitter.on(EventNames.PROVIDER_CONVERSATION_FAILED, ({ threadId }) =>
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "error",
      }),
    );

    emitter.on(EventNames.PROVIDER_CONVERSATION_CANCELLED, ({ threadId }) =>
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "stop",
      }),
    );
  }

  async createAssistantMessage(
    message: Omit<
      CreateMessageData,
      | "orderSeq"
      | "role"
      | "status"
      | "tokenCount"
      | "content"
      | "isThinkBlockCollapsed"
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
        content: "",
        isThinkBlockCollapsed: false,
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
