import { ThemeMode } from "@types";
import { titleBarOverlayLight, titleBarOverlayDark } from "@main/config";
import { BrowserWindow } from "electron";
import { ServiceHandler } from "../shared/reflect";
import { CommunicationWay } from "../shared/reflect";
import { ServiceRegister } from "../shared/reflect";

@ServiceRegister("windowService")
export default class WindowService {
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setTitleBarOverlay(_event: Electron.IpcMainEvent, theme: ThemeMode) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setTitleBarOverlay(
        theme === ThemeMode.Dark ? titleBarOverlayDark : titleBarOverlayLight
      );
    });
  }
}
