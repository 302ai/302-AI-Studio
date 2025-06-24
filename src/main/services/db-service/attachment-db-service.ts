import { triplitClient } from "@main/triplit/client";
import type {
  Attachment,
  CreateAttachmentData,
  UpdateAttachmentData,
} from "@shared/triplit/types";
import { BaseDbService } from "./base-db-service";

export class AttachmentDbService extends BaseDbService {
  constructor() {
    super("attachments");
  }

  async insertAttachment(
    attachment: CreateAttachmentData,
  ): Promise<Attachment> {
    return await triplitClient.insert("attachments", attachment);
  }

  async insertAttachments(attachments: CreateAttachmentData[]): Promise<void> {
    await triplitClient.transact(async (tx) => {
      const insertPromises = attachments.map((attachment) =>
        tx.insert("attachments", attachment),
      );

      await Promise.all(insertPromises);
    });
  }

  async updateAttachment(
    attachmentId: string,
    updateData: UpdateAttachmentData,
  ): Promise<Attachment> {
    await triplitClient.update(
      "attachments",
      attachmentId,
      async (attachment) => {
        Object.assign(attachment, updateData);
      },
    );
    const updatedAttachment = await this.getAttachmentById(attachmentId);
    if (!updatedAttachment) {
      throw new Error("Attachment not found");
    }
    return updatedAttachment;
  }

  async getAttachmentsByMessageId(messageId: string): Promise<Attachment[]> {
    const query = triplitClient
      .query("attachments")
      .Where("messageId", "=", messageId)
      .Order("createdAt", "ASC");

    return await triplitClient.fetch(query);
  }

  async getAttachmentById(attachmentId: string): Promise<Attachment | null> {
    return await triplitClient.fetchById("attachments", attachmentId);
  }

  async deleteAttachmentsByMessageId(messageId: string): Promise<void> {
    const attachments = await this.getAttachmentsByMessageId(messageId);
    const deletePromises = attachments.map((attachment) =>
      triplitClient.delete("attachments", attachment.id),
    );

    await Promise.all(deletePromises);
  }
}
