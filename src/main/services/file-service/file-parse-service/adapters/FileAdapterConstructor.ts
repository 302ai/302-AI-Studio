import type { AudioFileAdapter } from "./AudioFileAdapter";
import type { CodeFileAdapter } from "./CodeFileAdapter";
import type { CsvFileAdapter } from "./CsvFileAdapter";
import type { DocFileAdapter } from "./DocFileAdapter";
import type { ExcelFileAdapter } from "./ExcelFileAdapter";
import type { ImageFileAdapter } from "./ImageFileAdapter";
import type { PdfFileAdapter } from "./PdfFileAdapter";
import type { PptFileAdapter } from "./PptFileAdapter";
import type { TextFileAdapter } from "./TextFileAdapter";
import type { UnsupportFileAdapter } from "./UnsupportFileAdapter";

export type FileAdapterConstructor = new (
  filePath: string,
  maxFileSize: number,
) =>
  | CsvFileAdapter
  | TextFileAdapter
  | ExcelFileAdapter
  | ImageFileAdapter
  | PdfFileAdapter
  | DocFileAdapter
  | PptFileAdapter
  | CodeFileAdapter
  | AudioFileAdapter
  | UnsupportFileAdapter;
