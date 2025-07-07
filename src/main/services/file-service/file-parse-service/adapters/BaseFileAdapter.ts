import * as fs from "node:fs";
import path from "node:path";
import { detectMimeType } from "../mime";
import type { FileMetaData } from "../type";
import logger from "@shared/logger/main-logger";

export abstract class BaseFileAdapter {
  filePath: string;
  mimeType: string | null = null;
  fileMetaData: FileMetaData | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  protected async extractBasicInfo(): Promise<{
    fileSize: number;
    fileCreated: Date;
    fileModified: Date;
  }> {
    const stat = await fs.promises.stat(this.filePath);
    return {
      fileSize: stat.size,
      fileCreated: stat.birthtime,
      fileModified: stat.mtime,
    };
  }

  protected async preprocessFile(): Promise<void> {
    this.mimeType = await detectMimeType(this.filePath);
  }

  public async processFile(): Promise<FileMetaData | null> {
    if (!this.mimeType) {
      await this.preprocessFile();
    }

    if (!this.fileMetaData) {
      try {
        // const fileBuffer = await this.readFile()
        // const fileHash = await this.calculateFileHash(fileBuffer)
        const { fileSize, fileCreated, fileModified } =
          await this.extractBasicInfo();
        this.fileMetaData = {
          fileName: path.basename(this.filePath),
          fileSize,
          // fileHash,
          fileDescription: this.getFileDescription(),
          fileCreated,
          fileModified,
        };
      } catch (error) {
        logger.error("BaseFileAdapter: Error processing file", { error });
        return null;
      }
    }

    return this.fileMetaData;
  }

  protected abstract getFileDescription(): string | undefined;
  protected abstract getContent(): Promise<string | undefined>;
  public abstract getLLMContent(): Promise<string | undefined>;
  public abstract getThumbnail(): Promise<string | undefined>;
}
