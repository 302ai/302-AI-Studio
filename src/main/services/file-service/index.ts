import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type AttachmentForParsing,
  type FileParsingOptions,
  uploadAndParseFile,
} from "@main/api/file-parsing";
import { shell } from "electron";
import Logger from "electron-log";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../shared/reflect";

/**
 * Unified file service for both parsing and preview functionality
 */
@ServiceRegister("fileService")
export class FileService {
  private tempFiles: Set<string> = new Set();

  async parseFileContent(
    attachment: AttachmentForParsing,
    options: FileParsingOptions,
  ): Promise<string> {
    try {
      Logger.info("Starting file parsing for:", {
        fileName: attachment.name,
      });

      const fileContent = await uploadAndParseFile(attachment, options);

      Logger.info("File parsed successfully");

      return fileContent;
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
  static shouldParseFile(type: string): boolean {
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

  /**
   * 预览图片文件 - 使用系统默认的图片查看器
   * @param fileName 文件名
   * @param base64Data base64 格式的图片数据 (包含 data:image/xxx;base64, 前缀)
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async previewImage(
    _event: Electron.IpcMainInvokeEvent,
    fileName: string,
    base64Data: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 解析 base64 数据 - 更宽松的正则表达式
      const matches = base64Data.match(
        /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/,
      );
      if (!matches) {
        // 如果没有 data: 前缀，尝试直接解析为 base64
        try {
          const buffer = Buffer.from(base64Data, "base64");
          if (buffer.length === 0) {
            return {
              success: false,
              error: "Invalid base64 image data - empty buffer",
            };
          }
          return await this.saveAndOpenTempFile(fileName, buffer);
        } catch {
          return {
            success: false,
            error: `Invalid base64 image data format. Expected data:image/type;base64,data or plain base64. Received: ${base64Data.substring(0, 50)}...`,
          };
        }
      }

      const [, , data] = matches;
      const buffer = Buffer.from(data, "base64");

      return await this.saveAndOpenTempFile(fileName, buffer);
    } catch (error) {
      console.error("Error previewing image:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 预览任意文件 - 使用系统默认应用程序
   * @param fileName 文件名
   * @param fileData 文件数据 (base64 格式，可能包含 data: 前缀)
   * @param mimeType 文件的 MIME 类型
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async previewFile(
    _event: Electron.IpcMainInvokeEvent,
    fileName: string,
    fileData: string,
    mimeType: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Main process received previewFile call:");
      console.log("  fileName:", fileName);
      console.log("  mimeType:", mimeType);

      let buffer: Buffer;

      // 处理不同格式的文件数据
      if (fileData.startsWith("data:")) {
        // 处理 data URL 格式 (如: data:application/pdf;base64,...)
        const matches = fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!matches) {
          return {
            success: false,
            error: "Invalid data URL format",
          };
        }
        buffer = Buffer.from(matches[1], "base64");
      } else {
        // 处理纯 base64 数据
        try {
          buffer = Buffer.from(fileData, "base64");
        } catch {
          return {
            success: false,
            error: "Invalid base64 data",
          };
        }
      }

      if (buffer.length === 0) {
        return {
          success: false,
          error: "Empty file data",
        };
      }

      return await this.saveAndOpenTempFile(fileName, buffer);
    } catch (error) {
      console.error("Error previewing file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 清理所有临时文件
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  cleanupAllTempFiles(_event: Electron.IpcMainEvent): void {
    for (const filePath of this.tempFiles) {
      this.cleanupTempFile(filePath);
    }
    this.tempFiles.clear();
  }

  /**
   * 保存临时文件并打开
   */
  private async saveAndOpenTempFile(
    fileName: string,
    buffer: Buffer,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 创建临时目录
      const tempDir = join(tmpdir(), "chat-app-previews");
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // 生成临时文件路径
      const timestamp = Date.now();
      const tempFileName = `${timestamp}_${fileName}`;
      const tempFilePath = join(tempDir, tempFileName);

      // 写入临时文件
      writeFileSync(tempFilePath, buffer);
      this.tempFiles.add(tempFilePath);

      // 使用系统默认程序打开文件
      const result = await shell.openPath(tempFilePath);

      if (result) {
        // 如果有错误信息，说明打开失败
        return { success: false, error: result };
      }

      // 设置定时清理临时文件 (30分钟后)
      setTimeout(
        () => {
          this.cleanupTempFile(tempFilePath);
        },
        30 * 60 * 1000,
      );

      return { success: true };
    } catch (error) {
      console.error("Error saving and opening temp file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 清理单个临时文件
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.tempFiles.delete(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }
}

// Export individual services for backward compatibility
export { FileParsingService } from "./file-parsing-service";
export { FilePreviewService } from "./file-preview-service";
