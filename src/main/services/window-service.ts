import { titleBarOverlayDark, titleBarOverlayLight } from "@main/config";
import { BrowserWindow } from "electron";
import { ThemeMode } from "@/src/shared/types/settings";
import { isWin } from "../constant";
import { ServiceRegister } from "../shared/reflect";

@ServiceRegister("windowService")
export class WindowService {
  setTitleBarOverlay(theme: ThemeMode) {
    // setTitleBarOverlay is only available on Windows
    if (!isWin) {
      return;
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      window.setTitleBarOverlay(
        theme === ThemeMode.Dark ? titleBarOverlayDark : titleBarOverlayLight
      );
    });
  }
}
