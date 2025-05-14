import { ThemeMode } from "@types";
import { titleBarOverlayLight, titleBarOverlayDark } from "@main/config";
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
