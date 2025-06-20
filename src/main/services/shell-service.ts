import { shell } from "electron";
import Logger from "electron-log";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";

@ServiceRegister("shellService")
export class ShellService {
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async openExternal(_event: Electron.IpcMainEvent, url: string) {
    try {
      await shell.openExternal(url);
    } catch (error) {
      Logger.error("ShellService:openExternal error ---->", error);
      throw error;
    }
  }
}
