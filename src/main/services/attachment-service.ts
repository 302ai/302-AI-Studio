import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type {
  Attachment,
  CreateAttachmentData,
  UpdateAttachmentData,
} from "@shared/triplit/types";
import Logger from "electron-log";
import { AttachmentDbService } from "./db-service/attachment-db-service";

@ServiceRegister("attachmentService")
export class AttachmentService {
  private attachmentDbService: AttachmentDbService;

  constructor() {
    this.attachmentDbService = new AttachmentDbService();
  }

  async _getAttachmentsByMessageId(messageId: string): Promise<Attachment[]> {
    const attachments =
      await this.attachmentDbService.getAttachmentsByMessageId(messageId);
    return attachments;
  }

  async _updateAttachment(
    attachmentId: string,
    updateData: UpdateAttachmentData,
  ): Promise<void> {
    await this.attachmentDbService.updateAttachment(attachmentId, updateData);
  }

  async _deleteAttachmentsByMessageId(messageId: string): Promise<void> {
    await this.attachmentDbService.deleteAttachmentsByMessageId(messageId);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async insertAttachments(
    _event: Electron.IpcMainEvent,
    attachments: CreateAttachmentData[],
  ): Promise<void> {
    try {
      await this.attachmentDbService.insertAttachments(attachments);
    } catch (error) {
      Logger.error("AttachmentService: insertAttachments error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateAttachment(
    _event: Electron.IpcMainEvent,
    attachmentId: string,
    updateData: UpdateAttachmentData,
  ): Promise<void> {
    try {
      await this.attachmentDbService.updateAttachment(attachmentId, updateData);
    } catch (error) {
      Logger.error("AttachmentService: updateAttachment error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getAttachmentsByMessageId(
    _event: Electron.IpcMainEvent,
    messageId: string,
  ): Promise<Attachment[]> {
    try {
      const attachments =
        await this.attachmentDbService.getAttachmentsByMessageId(messageId);
      return attachments;
    } catch (error) {
      Logger.error(
        "AttachmentService: getAttachmentsByMessageId error ---->",
        error,
      );
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteAttachmentsByMessageId(
    _event: Electron.IpcMainEvent,
    messageId: string,
  ): Promise<void> {
    try {
      await this.attachmentDbService.deleteAttachmentsByMessageId(messageId);
    } catch (error) {
      Logger.error(
        "AttachmentService: deleteAttachmentsByMessageId error ---->",
        error,
      );
      throw error;
    }
  }
}
