import { titleBarOverlayDark, titleBarOverlayLight } from "@main/config";
import { ThemeMode } from "@renderer/types/settings";
import { BrowserWindow } from "electron";
import { ServiceRegister } from "../shared/reflect";

@ServiceRegister("windowService")
export class WindowService {
  setTitleBarOverlay(theme: ThemeMode) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setTitleBarOverlay(
        theme === ThemeMode.Dark ? titleBarOverlayDark : titleBarOverlayLight
      );
    });
  }
}
