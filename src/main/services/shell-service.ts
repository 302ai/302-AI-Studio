import { TYPES } from "@main/shared/types";
import { shell } from "electron";
import logger from "@shared/logger/main-logger";
import { injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";

@ServiceRegister(TYPES.ShellService)
@injectable()
export class ShellService {
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async openExternal(_event: Electron.IpcMainEvent, url: string) {
    try {
      await shell.openExternal(url);
    } catch (error) {
      logger.error("ShellService:openExternal error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async openPath(
    _event: Electron.IpcMainInvokeEvent,
    path: string,
  ): Promise<string> {
    try {
      const result = await shell.openPath(path);
      return result;
    } catch (error) {
      logger.error("ShellService:openPath error", { error });
      throw error;
    }
  }
}
