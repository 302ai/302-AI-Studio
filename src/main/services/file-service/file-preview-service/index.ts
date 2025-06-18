import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shell } from "electron";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../../shared/reflect";

/**
 * 统一的文件预览服务
 * 支持图片和其他文件类型的预览，使用系统默认应用程序打开
 */
@ServiceRegister("fileService")
export class FilePreviewService {
  private tempFiles: Set<string> = new Set();

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
    return this.previewFile(_event, fileName, base64Data, "image/*");
  }

  /**
   * 预览任意文件 - 使用系统默认应用程序
   * @param fileName 文件名
   * @param fileData 文件数据 (base64 格式，可能包含 data: 前缀)
   * @param mimeType 文件的 MIME 类型 (可选)
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async previewFile(
    _event: Electron.IpcMainInvokeEvent,
    fileName: string,
    fileData: string,
    mimeType?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Main process received previewFile call:");
      console.log("  fileName:", fileName);
      console.log("  mimeType:", mimeType);

      const buffer = this.parseFileData(fileData);
      if (!buffer.success) {
        return buffer;
      }

      return await this.saveAndOpenTempFile(fileName, buffer.data);
    } catch (error) {
      console.error("Error previewing file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 解析文件数据，支持多种格式
   * @param fileData 文件数据
   * @returns 解析结果
   */
  private parseFileData(
    fileData: string,
  ): { success: true; data: Buffer } | { success: false; error: string } {
    if (!fileData) {
      return { success: false, error: "Empty file data" };
    }

    let buffer: Buffer;

    try {
      if (fileData.startsWith("data:")) {
        // 处理 data URL 格式 (如: data:application/pdf;base64,... 或 data:image/png;base64,...)
        const matches = fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!matches) {
          return { success: false, error: "Invalid data URL format" };
        }
        buffer = Buffer.from(matches[1], "base64");
      } else {
        // 处理纯 base64 数据
        buffer = Buffer.from(fileData, "base64");
      }

      if (buffer.length === 0) {
        return { success: false, error: "Empty file buffer" };
      }

      return { success: true, data: buffer };
    } catch (error) {
      return {
        success: false,
        error: `Invalid base64 data: ${error instanceof Error ? error.message : "Unknown error"}`,
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
