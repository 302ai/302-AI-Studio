import { BaseFileAdapter } from './BaseFileAdapter'

export class AudioFileAdapter extends BaseFileAdapter {
  public async getLLMContent(): Promise<string | undefined> {
    // 只返回文件路径信息，不读取内容
    return `音频文件路径: ${this.filePath}`
  }

  constructor(filePath: string) {
    super(filePath)
  }

  protected getFileDescription(): string | undefined {
    return '音频文件'
  }

  async getContent(): Promise<string | undefined> {
    // 对于音频文件，只返回路径信息，不读取内容
    return `音频文件路径: ${this.filePath}`
  }

  async getThumbnail(): Promise<string | undefined> {
    return ''
  }
}
