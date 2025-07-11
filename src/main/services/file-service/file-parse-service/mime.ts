import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import * as mime from "mime-types";
import logger from "@shared/logger/main-logger";
import {
  AudioFileAdapter,
  CodeFileAdapter,
  CsvFileAdapter,
  DocFileAdapter,
  ExcelFileAdapter,
  type FileAdapterConstructor,
  ImageFileAdapter,
  PdfFileAdapter,
  PptFileAdapter,
  TextFileAdapter,
  UnsupportFileAdapter,
} from "./adapters";

export const getMimeTypeAdapterMap = (): Map<
  string,
  FileAdapterConstructor
> => {
  const map = new Map<string, FileAdapterConstructor>();

  // Text formats
  map.set("text/plain", TextFileAdapter);
  map.set("text/csv", CsvFileAdapter);
  map.set("text/markdown", TextFileAdapter);
  map.set("application/json", TextFileAdapter);
  map.set("application/x-yaml", TextFileAdapter);
  map.set("application/xml", TextFileAdapter);
  map.set("text/*", TextFileAdapter);

  // Audio formats
  map.set("audio/mp3", AudioFileAdapter);
  map.set("audio/mpeg", AudioFileAdapter);
  map.set("audio/wav", AudioFileAdapter);
  map.set("audio/x-wav", AudioFileAdapter);
  map.set("audio/x-m4a", AudioFileAdapter);
  map.set("audio/m4a", AudioFileAdapter);

  // Code formats
  map.set("application/javascript", CodeFileAdapter);
  map.set("application/typescript", CodeFileAdapter);
  map.set("application/x-typescript", CodeFileAdapter);
  map.set("text/typescript", CodeFileAdapter);
  map.set("text/x-typescript", CodeFileAdapter);
  // On macOS, .ts files are sometimes misidentified as MPEG Transport Stream (video/mp2t)
  // This mapping ensures TypeScript files are still handled correctly in such cases
  map.set("video/mp2t", CodeFileAdapter);
  map.set("application/x-sh", CodeFileAdapter);
  map.set("text/x-python", CodeFileAdapter);
  map.set("text/x-python-script", CodeFileAdapter);
  map.set("text/x-java", CodeFileAdapter);
  map.set("text/x-c", CodeFileAdapter);
  map.set("text/x-cpp", CodeFileAdapter);
  map.set("text/x-csharp", CodeFileAdapter);
  map.set("text/x-go", CodeFileAdapter);
  map.set("text/x-ruby", CodeFileAdapter);
  map.set("text/x-php", CodeFileAdapter);
  map.set("text/x-rust", CodeFileAdapter);
  map.set("text/x-swift", CodeFileAdapter);
  map.set("text/x-kotlin", CodeFileAdapter);
  map.set("text/x-scala", CodeFileAdapter);
  map.set("text/x-perl", CodeFileAdapter);
  map.set("text/x-lua", CodeFileAdapter);

  // Web formats
  map.set("text/html", CodeFileAdapter);
  map.set("text/css", CodeFileAdapter);
  map.set("application/xhtml+xml", CodeFileAdapter);

  // Excel formats
  map.set("application/vnd.ms-excel", ExcelFileAdapter);
  map.set(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ExcelFileAdapter,
  );
  map.set("application/vnd.oasis.opendocument.spreadsheet", ExcelFileAdapter);
  map.set(
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    ExcelFileAdapter,
  );
  map.set("application/vnd.apple.numbers", ExcelFileAdapter);

  // Image formats
  map.set("image/jpeg", ImageFileAdapter);
  map.set("image/jpg", ImageFileAdapter);
  map.set("image/png", ImageFileAdapter);
  map.set("image/gif", ImageFileAdapter);
  map.set("image/webp", ImageFileAdapter);
  map.set("image/bmp", ImageFileAdapter);
  map.set("image/*", ImageFileAdapter);

  // PDF format
  map.set("application/pdf", PdfFileAdapter);

  // Word document formats
  map.set("application/msword", DocFileAdapter);
  map.set(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    DocFileAdapter,
  );

  // PowerPoint formats
  map.set("application/vnd.ms-powerpoint", PptFileAdapter);
  map.set(
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    PptFileAdapter,
  );

  // Additional C/C++ formats
  map.set("text/x-c-header", CodeFileAdapter);
  map.set("text/x-c++hdr", CodeFileAdapter);
  map.set("text/x-h", CodeFileAdapter);
  map.set("text/x-hpp", CodeFileAdapter);

  // 其他格式
  map.set("*/*", UnsupportFileAdapter);
  map.set("", UnsupportFileAdapter);

  return map;
};

export const detectMimeType = async (filePath: string): Promise<string> => {
  try {
    // 1. Try file-type for binary detection
    const fileTypeResult = await fileTypeFromFile(filePath);
    logger.debug("MimeDetection: fileTypeFromFile result", {
      fileName: path.basename(filePath),
      result: fileTypeResult,
    });
    if (fileTypeResult) {
      // Special case: Correct potential misidentification for .ts/.tsx
      // file-type might identify them based on magic numbers if they exist,
      // but mime.lookup is often better for these based on extension.
      // Let's prioritize mime.lookup for .ts/.tsx specifically.
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".ts" || ext === ".tsx") {
        const mimeTypeFromExt = mime.lookup(filePath);
        if (mimeTypeFromExt === "application/typescript") {
          logger.debug("MimeDetection: Prioritizing mime.lookup for .ts/.tsx", {
            mimeType: mimeTypeFromExt,
          });
          return mimeTypeFromExt;
        }
      }

      logger.debug("MimeDetection: Detected by file-type", {
        mimeType: fileTypeResult.mime,
      });
      return fileTypeResult.mime;
    }

    // 2. Fallback to mime.lookup for extension-based detection
    const mimeType = mime.lookup(filePath);
    logger.debug("MimeDetection: mime.lookup result", {
      fileName: path.basename(filePath),
      mimeType,
    });
    if (mimeType) {
      logger.debug("MimeDetection: Detected by mime.lookup", { mimeType });
      return mimeType;
    }

    // 3. If neither works, try the text heuristic
    logger.debug("MimeDetection: Trying text heuristic", {
      fileName: path.basename(filePath),
    });
    const isText = await isLikelyTextFile(filePath);
    logger.debug("MimeDetection: isLikelyTextFile result", {
      fileName: path.basename(filePath),
      isText,
    });
    return isText ? "text/plain" : "application/octet-stream";
  } catch (error) {
    logger.error("MimeDetection: Error before text check", {
      fileName: path.basename(filePath),
      error,
    });
    // If file-type or mime.lookup caused an error, still try basic text check
    // or fall back to octet-stream directly depending on desired robustness.
    // For now, let's try the text check even on error.
    try {
      logger.debug("MimeDetection: Trying text heuristic after error", {
        fileName: path.basename(filePath),
      });
      const isText = await isLikelyTextFile(filePath);
      logger.debug("MimeDetection: isLikelyTextFile result after error", {
        fileName: path.basename(filePath),
        isText,
      });
      return isText ? "text/plain" : "application/octet-stream";
    } catch (textCheckError) {
      logger.error("MimeDetection: Error during text check", {
        filePath,
        error: textCheckError,
      });
      return "application/octet-stream"; // Final fallback on error
    }
  }
};

// Helper function to check if a file is likely text-based
export const isLikelyTextFile = async (
  filePath: string,
  bytesToRead = 1024,
): Promise<boolean> => {
  let fileHandle: fs.FileHandle | undefined;
  const baseName = path.basename(filePath);
  logger.debug("TextFileDetection: Starting file check", {
    fileName: baseName,
  });
  try {
    fileHandle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await fileHandle.read(buffer, 0, bytesToRead, 0);
    await fileHandle.close(); // Close the file handle promptly
    logger.debug("TextFileDetection: Read bytes from file", {
      fileName: baseName,
      bytesRead,
    });

    if (bytesRead === 0) {
      // Empty file, could be considered text or not, default to not-text
      logger.debug("TextFileDetection: File is empty", { fileName: baseName });
      return false;
    }

    const content = buffer.slice(0, bytesRead);

    // Heuristic: Check for null bytes - common in binary, rare in text
    const hasNullByte = content.includes(0);
    logger.debug("TextFileDetection: Null byte check", {
      fileName: baseName,
      hasNullByte,
    });
    if (hasNullByte) {
      // Found null byte, likely binary
      return false;
    }

    // Heuristic: Check if most characters are printable ASCII or valid UTF-8
    // A more robust check would involve full UTF-8 validation, but this is simpler
    let nonTextChars = 0;
    for (let i = 0; i < content.length; i++) {
      const byte = content[i];
      // Allow printable ASCII (32-126), tab (9), newline (10), carriage return (13)
      // Also crude check for potential multi-byte UTF-8 start bytes (>=128)
      if (
        !(
          (byte >= 32 && byte <= 126) ||
          byte === 9 ||
          byte === 10 ||
          byte === 13 ||
          byte >= 128
        )
      ) {
        nonTextChars++;
      }
    }

    const nonTextRatio = bytesRead > 0 ? nonTextChars / bytesRead : 0;
    logger.debug("TextFileDetection: Non-text character analysis", {
      fileName: baseName,
      nonTextChars,
      ratio: nonTextRatio.toFixed(3),
    });

    // If more than, say, 10% of characters are suspicious control characters (excluding tab/newline/cr)
    // it's more likely binary.
    if (nonTextRatio > 0.1) {
      logger.debug("TextFileDetection: Determined as BINARY", {
        fileName: baseName,
        reason: "high non-text ratio",
      });
      return false;
    }

    // If it passes the checks, assume it's likely text
    logger.debug("TextFileDetection: Determined as TEXT", {
      fileName: baseName,
    });
    return true;
  } catch (error) {
    logger.error("TextFileDetection: Failed to read file for text check", {
      fileName: baseName,
      error,
    });
    if (fileHandle) {
      await fileHandle.close(); // Ensure closure even on error
    }
    return false; // Default to not-text on error
  }
};
