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
    const query = triplitClient
      .query("messages")
      .Where("id", "=", messageId)
      .Include("attachments");

    const messages = await triplitClient.fetchOne(query);

    if (messages?.attachments) {
      await triplitClient.transact(async (tx) => {
        const deleteAttachmentPromises = messages.attachments.map((attachment) =>
          tx.delete("attachments", attachment.id)
        );
        const deleteMessagePromise = tx.delete("messages", messageId);

        await Promise.all([...deleteAttachmentPromises, deleteMessagePromise]);
      });
    } else {
      await triplitClient.delete("messages", messageId);
    }
  }

  async getMessagesByThreadId(threadId: string): Promise<Message[]> {
    const query = triplitClient
      .query("messages")
      .Where("threadId", "=", threadId)
      .Order("createdAt", "ASC");
    const messages = await triplitClient.fetch(query);

    return messages;
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    return await triplitClient.fetchById("messages", messageId);
  }

  async deleteMessagesByThreadId(threadId: string): Promise<void> {
    // 使用 Include 获取消息及其关联的附件
    const query = triplitClient
      .query("messages")
      .Where("threadId", "=", threadId)
      .Include("attachments")
      .Order("createdAt", "ASC");

    const messagesWithAttachments = await triplitClient.fetch(query);

    await triplitClient.transact(async (tx) => {
      // 收集所有需要删除的附件
      const allAttachments = messagesWithAttachments.flatMap(message =>
        message.attachments || []
      );

      // 删除所有附件
      const deleteAttachmentPromises = allAttachments.map((attachment) =>
        tx.delete("attachments", attachment.id)
      );

      // 删除所有消息
      const deleteMessagePromises = messagesWithAttachments.map((message) =>
        tx.delete("messages", message.id)
      );

      await Promise.all([...deleteAttachmentPromises, ...deleteMessagePromises]);
    });
  }

  async deleteAllMessages(): Promise<void> {
    // 使用 Include 获取所有消息及其关联的附件
    const messagesQuery = triplitClient
      .query("messages")
      .Include("attachments");
    const messagesWithAttachments = await triplitClient.fetch(messagesQuery);

    await triplitClient.transact(async (tx) => {
      // 收集所有需要删除的附件
      const allAttachments = messagesWithAttachments.flatMap(message =>
        message.attachments || []
      );

      // 删除所有附件
      const deleteAttachmentPromises = allAttachments.map((attachment) =>
        tx.delete("attachments", attachment.id)
      );

      // 删除所有消息
      const deleteMessagePromises = messagesWithAttachments.map((message) =>
        tx.delete("messages", message.id)
      );

      await Promise.all([...deleteAttachmentPromises, ...deleteMessagePromises]);
    });
  }

  async updatePendingMessagesToStop(): Promise<number> {
    const pendingMessagesQuery = triplitClient
      .query("messages")
      .Where("status", "=", "pending");

    const pendingMessages = await triplitClient.fetch(pendingMessagesQuery);

    if (pendingMessages.length > 0) {
      await triplitClient.transact(async (tx) => {
        const updatePromises = pendingMessages.map((message) => {
          return tx.update("messages", message.id, async (msg) => {
            msg.status = "stop";
          });
        });

        await Promise.all(updatePromises);
      });
    }

    return pendingMessages.length;
  }
}
