import { triplitClient } from "@main/triplit/client";
import type {
  CreateMessageData,
  Message,
  UpdateMessageData,
} from "@shared/triplit/types";
import { BaseDbService } from "./base-db-service";

export class MessageDbService extends BaseDbService {
  constructor() {
    super("messages");
  }

  async insertMessage(message: CreateMessageData): Promise<Message> {
    return await triplitClient.insert("messages", message);
  }

  async insertMessages(messages: CreateMessageData[]): Promise<void> {
    await triplitClient.transact(async (tx) => {
      const insertPromises = messages.map((message) =>
        tx.insert("messages", message),
      );

      await Promise.all(insertPromises);
    });
  }

  async updateMessage(
    messageId: string,
    updateData: UpdateMessageData,
  ): Promise<Message> {
    await triplitClient.update("messages", messageId, async (message) => {
      Object.assign(message, updateData);
    });
    const updatedMessage = await this.getMessageById(messageId);
    if (!updatedMessage) {
      throw new Error("Message not found");
    }
    return updatedMessage;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await triplitClient.delete("messages", messageId);
  }

  async getMessagesByThreadId(threadId: string): Promise<Message[]> {
    const query = triplitClient
      .query("messages")
      .Where("threadId", "=", threadId)
      .Order("createdAt", "ASC");

    return await triplitClient.fetch(query);
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    return await triplitClient.fetchById("messages", messageId);
  }

  async deleteMessagesByThreadId(threadId: string): Promise<void> {
    const messages = await this.getMessagesByThreadId(threadId);
    const deletePromises = messages.map((message) =>
      triplitClient.delete("messages", message.id),
    );

    await Promise.all(deletePromises);
  }

  async deleteAllMessages(): Promise<void> {
    const messagesQuery = triplitClient.query("messages");
    const messages = await triplitClient.fetch(messagesQuery);

    await triplitClient.transact(async (tx) => {
      const deletePromises = messages.map((message) =>
        tx.delete("messages", message.id),
      );

      await Promise.all(deletePromises);
    });
  }
}
