export interface FileMetaData {
  fileName: string;
  fileSize: number;
  // fileHash: string
  fileDescription?: string;
  fileCreated: Date;
  fileModified: Date;
}

export interface DirectoryMetaData {
  dirName: string;
  dirPath: string;
  dirCreated: Date;
  dirModified: Date;
}

export type FileOperation = {
  path: string;
  content?: string;
};

export interface IFilePresenter {
  readFile(relativePath: string): Promise<string>;
  writeFile(operation: FileOperation): Promise<void>;
  deleteFile(relativePath: string): Promise<void>;
  createFileAdapter(filePath: string, typeInfo?: string): Promise<any>; // Return type might need refinement
  prepareFile(absPath: string, typeInfo?: string): Promise<MessageFile>;
  prepareDirectory(absPath: string): Promise<MessageFile>;
  writeTemp(file: {
    name: string;
    content: string | Buffer | ArrayBuffer;
  }): Promise<string>;
  isDirectory(absPath: string): Promise<boolean>;
  getMimeType(filePath: string): Promise<string>;
  writeImageBase64(file: { name: string; content: string }): Promise<string>;
}

export type MessageFile = {
  name: string;
  content: string;
  mimeType: string;
  metadata: FileMetaData;
  token: number;
  path: string;
  thumbnail?: string;
};
