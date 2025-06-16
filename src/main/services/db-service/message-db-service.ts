import { triplitClient } from "@main/triplit/client";
import type {
  CreateMessageData,
  Message,
  UpdateMessageData,
} from "@shared/triplit/types";

export class MessageDbService {
  constructor() {
    triplitClient.connect();
  }

  async insertMessage(message: CreateMessageData): Promise<Message> {
    return await triplitClient.insert("messages", message);
  }

  async updateMessage(
    messageId: string,
    updateData: UpdateMessageData,
  ): Promise<void> {
    const existingMessage = await this.getMessageById(messageId);
    if (!existingMessage) {
      console.warn(`Message with id ${messageId} not found, skipping update`);
      return;
    }

    await triplitClient.update("messages", messageId, async (message) => {
      Object.assign(message, updateData);
    });
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

  async cleanMessagesByThreadId(threadId: string): Promise<void> {
    const messages = await this.getMessagesByThreadId(threadId);
    const deletePromises = messages.map((message) =>
      triplitClient.delete("messages", message.id),
    );

    await Promise.all(deletePromises);
  }
}
