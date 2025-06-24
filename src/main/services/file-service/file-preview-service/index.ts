import { existsSync } from "node:fs";
import { TYPES } from "@main/shared/types";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../../../shared/reflect";
import type { ShellService } from "../../shell-service";

@ServiceRegister(TYPES.FilePreviewService)
@injectable()
export class FilePreviewService {
  constructor(@inject(TYPES.ShellService) private shellService: ShellService) {}

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async previewFileByPath(
    _event: Electron.IpcMainInvokeEvent,
    filePath: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!existsSync(filePath)) {
        return { success: false, error: "file-not-found" };
      }

      // 使用 ShellService 打开文件
      const result = await this.shellService.openPath(_event, filePath);

      if (result) {
        // 如果有错误信息，说明打开失败
        return { success: false, error: result };
      }

      return { success: true };
    } catch (error) {
      console.error("Error previewing file by path:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
