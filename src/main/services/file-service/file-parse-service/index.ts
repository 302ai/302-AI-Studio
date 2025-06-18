import { app } from "electron";
import Logger from "electron-log";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";
import { approximateTokenSize } from "tokenx";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../../shared/reflect";
import type {
  BaseFileAdapter,
  FileAdapterConstructor,
  ImageFileAdapter,
} from "./adapters";
import { DirectoryAdapter, UnsupportFileAdapter } from "./adapters";
import { detectMimeType, getMimeTypeAdapterMap } from "./mime";
import type { FileOperation, IFilePresenter, MessageFile } from "./type";

// Local type definition for attachment parsing
interface AttachmentForParsing {
  id: string;
  name: string;
  type: string;
  fileData: string;
}

/**
 * 统一的文件解析服务
 * 合并了 FilePresenter 和 FileParseService 的功能
 * 既提供业务逻辑实现，也提供 IPC 服务接口
 */
@ServiceRegister("fileParseService")
export class FileParseService implements IFilePresenter {
  private userDataPath: string;
  private maxFileSize: number = 1024 * 1024 * 30; // 30 MB
  private tempDir: string;

  constructor() {
    this.userDataPath = app.getPath("userData");
    this.tempDir = path.join(this.userDataPath, "temp");
    // Ensure temp directory exists
    fs.mkdir(this.tempDir, { recursive: true }).catch(console.error);
  }

  // ========== IPC Service Methods ==========

  /**
   * Get MIME type of a file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getMimeTypeIPC(
    _event: Electron.IpcMainInvokeEvent,
    filePath: string,
  ): Promise<string> {
    return this.getMimeType(filePath);
  }

  /**
   * Prepare a file for processing
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async prepareFileIPC(
    _event: Electron.IpcMainInvokeEvent,
    absPath: string,
    typeInfo?: string,
  ): Promise<MessageFile> {
    return this.prepareFile(absPath, typeInfo);
  }

  /**
   * Prepare a directory for processing
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async prepareDirectoryIPC(
    _event: Electron.IpcMainInvokeEvent,
    absPath: string,
  ): Promise<MessageFile> {
    return this.prepareDirectory(absPath);
  }

  /**
   * Write temporary file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async writeTempIPC(
    _event: Electron.IpcMainInvokeEvent,
    file: {
      name: string;
      content: string | Buffer | ArrayBuffer;
    },
  ): Promise<string> {
    return this.writeTemp(file);
  }

  /**
   * Write base64 image to temporary file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async writeImageBase64IPC(
    _event: Electron.IpcMainInvokeEvent,
    file: { name: string; content: string },
  ): Promise<string> {
    return this.writeImageBase64(file);
  }

  /**
   * Check if path is a directory
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async isDirectoryIPC(
    _event: Electron.IpcMainInvokeEvent,
    absPath: string,
  ): Promise<boolean> {
    return this.isDirectory(absPath);
  }

  /**
   * Read file content
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async readFileIPC(
    _event: Electron.IpcMainInvokeEvent,
    relativePath: string,
  ): Promise<string> {
    return this.readFile(relativePath);
  }

  /**
   * Write file content
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async writeFileIPC(
    _event: Electron.IpcMainInvokeEvent,
    operation: { path: string; content?: string },
  ): Promise<void> {
    return this.writeFile(operation);
  }

  /**
   * Delete file
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async deleteFileIPC(
    _event: Electron.IpcMainInvokeEvent,
    relativePath: string,
  ): Promise<void> {
    return this.deleteFile(relativePath);
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
      const tempFilePath = await this.writeTemp({
        name: attachment.name,
        content: attachment.fileData,
      });

      // Use FilePresenter to prepare and parse the file
      const messageFile = await this.prepareFile(tempFilePath, attachment.type);

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

  // ========== Business Logic Methods ==========

  async getMimeType(filePath: string): Promise<string> {
    return detectMimeType(filePath);
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.userDataPath, relativePath);
    return fs.readFile(fullPath, "utf-8");
  }

  async writeFile(operation: FileOperation): Promise<void> {
    const fullPath = path.join(this.userDataPath, operation.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, operation.content || "", "utf-8");
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.userDataPath, relativePath);
    await fs.unlink(fullPath);
  }

  async createFileAdapter(
    filePath: string,
    typeInfo?: string,
  ): Promise<BaseFileAdapter> {
    // Use the refined getMimeType method
    // Prioritize provided typeInfo if available
    const mimeType = typeInfo ?? (await this.getMimeType(filePath));

    if (!mimeType) {
      // This case should be less likely now, but handle it defensively
      throw new Error(`Could not determine MIME type for file: ${filePath}`);
    }

    console.log(`Using MIME type: ${mimeType} for file: ${filePath}`);

    const adapterMap = getMimeTypeAdapterMap();
    const AdapterConstructor = this.findAdapterForMimeType(
      mimeType,
      adapterMap,
    );
    if (!AdapterConstructor) {
      // If no specific or wildcard adapter found, maybe use a generic default?
      // For now, we throw an error as before, but with the determined type.
      throw new Error(
        `No adapter found for file "${filePath}" with determined mime type "${mimeType}"`,
      );
    }

    return new AdapterConstructor(filePath, this.maxFileSize);
  }

  async prepareDirectory(absPath: string): Promise<MessageFile> {
    const fullPath = path.join(absPath);
    const adapter = new DirectoryAdapter(fullPath);
    await adapter.processDirectory();
    return {
      name: adapter.dirMetaData?.dirName ?? "",
      token: approximateTokenSize(adapter.dirMetaData?.dirName ?? ""),
      path: adapter.dirPath,
      mimeType: "directory",
      metadata: {
        fileName: adapter.dirMetaData?.dirName ?? "",
        fileSize: 0,
        fileDescription: "directory",
        fileCreated: adapter.dirMetaData?.dirCreated ?? new Date(),
        fileModified: adapter.dirMetaData?.dirModified ?? new Date(),
      },
      thumbnail: "",
      content: "",
    };
  }

  async prepareFile(absPath: string, typeInfo?: string): Promise<MessageFile> {
    const fullPath = path.join(absPath);
    try {
      const adapter = await this.createFileAdapter(fullPath, typeInfo);
      console.log("adapter", adapter);
      if (adapter) {
        await adapter.processFile();
        const content = (await adapter.getLLMContent()) ?? "";
        const result = {
          name: adapter.fileMetaData?.fileName ?? "",
          token: adapter.mimeType?.startsWith("image")
            ? calculateImageTokens(adapter as ImageFileAdapter)
            : adapter.mimeType?.startsWith("audio")
              ? approximateTokenSize(`音频文件路径: ${adapter.filePath}`)
              : approximateTokenSize(content || ""),
          path: adapter.filePath,
          mimeType: adapter.mimeType ?? "",
          metadata: adapter.fileMetaData ?? {
            fileName: "",
            fileSize: 0,
            fileDescription: "",
            fileCreated: new Date(),
            fileModified: new Date(),
          },
          content: content || "",
        };
        return result;
      } else {
        throw new Error(`Can not create file adapter: ${fullPath}`);
      }
    } catch (error) {
      // Clean up temp file in case of error
      console.error(error);
      throw new Error(`Can not read file: ${fullPath}`);
    }
  }

  private findAdapterForMimeType(
    mimeType: string,
    adapterMap: Map<string, FileAdapterConstructor>,
  ): FileAdapterConstructor | undefined {
    // 首先尝试精确匹配，一定要先精确匹配，比如text/*默认是 Text Adapter，但是text/csv并不是
    const exactMatch = adapterMap.get(mimeType);
    if (exactMatch) {
      return exactMatch;
    }

    // 尝试通配符匹配
    const type = mimeType.split("/")[0];
    const wildcardMatch = adapterMap.get(`${type}/*`);

    if (wildcardMatch) {
      return wildcardMatch;
    }

    return UnsupportFileAdapter;
  }

  async writeTemp(file: {
    name: string;
    content: string | Buffer | ArrayBuffer;
  }): Promise<string> {
    const ext = path.extname(file.name);
    const tempName = `${nanoid()}${ext || ".tmp"}`; // Add .tmp extension if original name has none
    const tempPath = path.join(this.tempDir, tempName);

    // Check if content is binary (Buffer or ArrayBuffer) or string
    if (typeof file.content === "string") {
      // Check if the string is a data URI (e.g., data:text/plain;base64,...)
      if (file.content.startsWith("data:")) {
        // Parse data URI and extract the actual content
        const matches = file.content.match(/^data:[^;]+;base64,(.+)$/);
        if (matches) {
          // It's a base64 data URI, decode it
          const base64Data = matches[1];
          const buffer = Buffer.from(base64Data, "base64");
          await fs.writeFile(tempPath, buffer);
        } else {
          // It's a data URI but not base64, extract content after comma
          const commaIndex = file.content.indexOf(",");
          if (commaIndex !== -1) {
            const actualContent = file.content.substring(commaIndex + 1);
            await fs.writeFile(tempPath, actualContent, "utf-8");
          } else {
            // Fallback: write as-is
            await fs.writeFile(tempPath, file.content, "utf-8");
          }
        }
      } else {
        // Regular string content
        await fs.writeFile(tempPath, file.content, "utf-8");
      }
    } else if (Buffer.isBuffer(file.content)) {
      // If it's already a Buffer, write it directly
      await fs.writeFile(tempPath, file.content);
    } else {
      // Otherwise, assume it's ArrayBuffer and convert to Buffer
      await fs.writeFile(tempPath, Buffer.from(file.content));
    }

    return tempPath;
  }

  async writeImageBase64(file: {
    name: string;
    content: string;
  }): Promise<string> {
    // 检查是否是base64格式的图片数据
    if (!file.content.startsWith("data:image/")) {
      throw new Error("Invalid image base64 data");
    }

    // 从base64字符串中提取实际的图片数据
    const base64Data = file.content.split(",")[1];
    if (!base64Data) {
      throw new Error("Invalid base64 image format");
    }

    // 将base64转换为二进制数据
    const binaryData = Buffer.from(base64Data, "base64");

    // 获取文件扩展名
    const mimeMatch = file.content.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    const ext = mimeMatch ? `.${mimeMatch[1].toLowerCase()}` : ".png";

    // 生成临时文件名
    const tempName = `${nanoid()}${ext}`;
    const tempPath = path.join(this.tempDir, tempName);

    // 写入文件
    await fs.writeFile(tempPath, binaryData);

    return tempPath;
  }

  async isDirectory(absPath: string): Promise<boolean> {
    try {
      const fullPath = path.join(absPath);
      const stats = await fs.stat(fullPath);
      return stats.isDirectory();
    } catch (error) {
      Logger.error("isDirectory error ---->", error);
      // If the path doesn't exist or there's any other error, return false
      return false;
    }
  }
}

function calculateImageTokens(adapter: ImageFileAdapter): number {
  // 方法1：基于图片尺寸
  const pixelBasedTokens = Math.round(
    ((adapter.imageMetadata.compressWidth ?? adapter.imageMetadata.width ?? 1) *
      (adapter.imageMetadata.compressHeight ??
        adapter.imageMetadata.height ??
        1)) /
      750,
  );
  return pixelBasedTokens;
}

// Export for backward compatibility
export { FileParseService as FilePresenter };
