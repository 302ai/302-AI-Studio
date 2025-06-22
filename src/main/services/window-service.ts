import { titleBarOverlayDark, titleBarOverlayLight } from "@main/config";
import { BrowserWindow, nativeTheme } from "electron";
import { isWin } from "../constant";
import { ServiceRegister } from "../shared/reflect";
import { EventNames, emitter } from "./event-service";

@ServiceRegister("windowService")
export class WindowService {
  constructor() {
    nativeTheme.on("updated", () => {
      this.updateTitleBarOverlay();
    });

    emitter.on(EventNames.WINDOW_TITLE_BAR_OVERLAY_UPDATE, () => {
      this.updateTitleBarOverlay();
    });
  }

  private updateTitleBarOverlay() {
    // * setTitleBarOverlay is only available on Windows
    if (!isWin) {
      return;
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      window.setTitleBarOverlay(
        nativeTheme.shouldUseDarkColors
          ? titleBarOverlayDark
          : titleBarOverlayLight,
      );
    });
  }
}
