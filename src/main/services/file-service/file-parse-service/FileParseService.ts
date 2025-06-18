import Logger from "electron-log";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../../shared/reflect";
import { FilePresenter } from "./FilePresenter";
import type { MessageFile } from "./index";

// Local type definition for attachment parsing
interface AttachmentForParsing {
  id: string;
  name: string;
  type: string;
  fileData: string;
}

/**
 * File Parse Service using reflection pattern
 * This service exposes file parsing functionality through the IPC bridge
 */
@ServiceRegister("fileParseService")
export class FileParseService {
  private filePresenter: FilePresenter;

  constructor() {
    this.filePresenter = new FilePresenter();
  }

  /**
   * Get MIME type of a file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getMimeType(
    _event: Electron.IpcMainInvokeEvent,
    filePath: string,
  ): Promise<string> {
    return this.filePresenter.getMimeType(filePath);
  }

  /**
   * Prepare a file for processing
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async prepareFile(
    _event: Electron.IpcMainInvokeEvent,
    absPath: string,
    typeInfo?: string,
  ): Promise<MessageFile> {
    return this.filePresenter.prepareFile(absPath, typeInfo);
  }

  /**
   * Prepare a directory for processing
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async prepareDirectory(
    _event: Electron.IpcMainInvokeEvent,
    absPath: string,
  ): Promise<MessageFile> {
    return this.filePresenter.prepareDirectory(absPath);
  }

  /**
   * Write temporary file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async writeTemp(
    _event: Electron.IpcMainInvokeEvent,
    file: {
      name: string;
      content: string | Buffer | ArrayBuffer;
    },
  ): Promise<string> {
    return this.filePresenter.writeTemp(file);
  }

  /**
   * Write base64 image to temporary file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async writeImageBase64(
    _event: Electron.IpcMainInvokeEvent,
    file: { name: string; content: string },
  ): Promise<string> {
    return this.filePresenter.writeImageBase64(file);
  }

  /**
   * Check if path is a directory
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async isDirectory(
    _event: Electron.IpcMainInvokeEvent,
    absPath: string,
  ): Promise<boolean> {
    return this.filePresenter.isDirectory(absPath);
  }

  /**
   * Read file content
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async readFile(
    _event: Electron.IpcMainInvokeEvent,
    relativePath: string,
  ): Promise<string> {
    return this.filePresenter.readFile(relativePath);
  }

  /**
   * Write file content
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async writeFile(
    _event: Electron.IpcMainInvokeEvent,
    operation: { path: string; content?: string },
  ): Promise<void> {
    return this.filePresenter.writeFile(operation);
  }

  /**
   * Delete file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async deleteFile(
    _event: Electron.IpcMainInvokeEvent,
    relativePath: string,
  ): Promise<void> {
    return this.filePresenter.deleteFile(relativePath);
  }

  /**
   * Parse file content using local file adapters
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async parseFileContent(
    _event: Electron.IpcMainInvokeEvent,
    attachment: AttachmentForParsing,
  ): Promise<string> {
    try {
      Logger.info("Starting file parsing for:", {
        fileName: attachment.name,
      });

      // Write attachment data to temporary file
      const tempFilePath = await this.filePresenter.writeTemp({
        name: attachment.name,
        content: attachment.fileData,
      });

      // Use FilePresenter to prepare and parse the file
      const messageFile = await this.filePresenter.prepareFile(
        tempFilePath,
        attachment.type,
      );

      Logger.info("File parsed successfully using local adapters");

      return messageFile.content;
    } catch (error) {
      Logger.error("File parsing failed:", error);
      throw new Error(
        `Failed to parse file ${attachment.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if a file type should be parsed
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async shouldParseFile(
    _event: Electron.IpcMainInvokeEvent,
    type: string,
  ): Promise<boolean> {
    // Don't parse images as they are handled differently
    if (type.startsWith("image/")) {
      return false;
    }

    // Parse text files and documents
    return (
      type.startsWith("text/") ||
      type.startsWith("application/") ||
      type.startsWith("audio/")
    );
  }
}
