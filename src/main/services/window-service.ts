import { titleBarOverlayDark, titleBarOverlayLight } from "@main/config";
import { BrowserWindow, nativeTheme } from "electron";
import { isLinux, isWin } from "../constant";
import { ServiceRegister } from "../shared/reflect";
import { TYPES } from "../shared/types";
import { EventNames, emitter } from "./event-service";

@ServiceRegister(TYPES.WindowService)
export class WindowService {
  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    nativeTheme.on("updated", () => {
      this.updateTitleBarOverlay();
    });

    emitter.on(EventNames.WINDOW_TITLE_BAR_OVERLAY_UPDATE, () => {
      this.updateTitleBarOverlay();
    });
  }

  private updateTitleBarOverlay() {
    // * setTitleBarOverlay is available on Windows and Linux
    if (!isWin && !isLinux) return;

    BrowserWindow.getAllWindows().forEach((window) => {
      window.setTitleBarOverlay(
        nativeTheme.shouldUseDarkColors
          ? titleBarOverlayDark
          : titleBarOverlayLight,
      );
    });
  }
}
