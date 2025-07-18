import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BaseFileAdapter } from "./BaseFileAdapter";
import logger from "@shared/logger/main-logger";

export class ImageFileAdapter extends BaseFileAdapter {
  private maxFileSize: number;
  imageMetadata: {
    width?: number;
    height?: number;
    format?: string;
    compressWidth?: number;
    compressHeight?: number;
  } = {};

  constructor(filePath: string, maxFileSize: number) {
    super(filePath);
    this.maxFileSize = maxFileSize;
  }

  protected getFileDescription(): string | undefined {
    return "Image File";
  }

  /**
   * 提取图片的基本信息
   */
  private async extractImageMetadata(): Promise<void> {
    try {
      const metadata = await sharp(this.filePath).metadata();
      this.imageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      };
    } catch (error) {
      logger.error("ImageFileAdapter: Error extracting image metadata", {
        error,
      });
      // 如果 sharp 失败，至少从文件扩展名获取格式
      this.imageMetadata.format = path
        .extname(this.filePath)
        .substring(1)
        .toLowerCase();
    }
  }

  public async getThumbnail(): Promise<string | undefined> {
    // 压缩图片并转换为JPG格式
    const compressedImage = await sharp(this.filePath)
      .resize(256, 256, {
        // 限制最大尺寸
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        // 统一转换为JPG
        quality: 70, // 压缩质量
        mozjpeg: true, // 使用mozjpeg优化
      });

    const buffer = await compressedImage.toBuffer();

    const base64ImageString = buffer.toString("base64");
    return `data:image/jpeg;base64,${base64ImageString}`;
  }

  public async getLLMContent(): Promise<string | undefined> {
    const stats = await fs.stat(this.filePath);
    if (stats.size > this.maxFileSize) {
      return undefined;
    }

    // 提取图片元数据
    await this.extractImageMetadata();

    // 压缩图片并转换为JPG格式
    const compressedImage = await sharp(this.filePath)
      .resize(1200, 1200, {
        // 限制最大尺寸
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        // 统一转换为JPG
        quality: 70, // 压缩质量
        mozjpeg: true, // 使用mozjpeg优化
      });
    this.imageMetadata.compressWidth =
      (await compressedImage.metadata()).width ?? this.imageMetadata.width;
    this.imageMetadata.compressHeight =
      (await compressedImage.metadata()).height ?? this.imageMetadata.height;

    const buffer = await compressedImage.toBuffer();

    const base64ImageString = buffer.toString("base64");
    return `data:image/jpeg;base64,${base64ImageString}`;
  }

  async getContent(): Promise<string | undefined> {
    return "";
  }
}
