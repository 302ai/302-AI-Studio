export interface FileMetaData {
  fileName: string;
  fileSize: number;
  // fileHash: string
  fileDescription?: string;
  fileCreated: Date;
  fileModified: Date;
}



export interface IFilePresenter {
  // biome-ignore lint/suspicious/noExplicitAny: <type is undetermined>
  createFileAdapter(filePath: string, typeInfo?: string): Promise<any>; // Return type might need refinement
  prepareFile(absPath: string, typeInfo?: string): Promise<MessageFile>;
  writeTemp(file: {
    name: string;
    content: string | Buffer | ArrayBuffer;
  }): Promise<string>;
  getMimeType(filePath: string): Promise<string>;
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
