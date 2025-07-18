import { titleBarOverlayDark, titleBarOverlayLight } from "@main/config";
import { BrowserWindow, nativeTheme } from "electron";
import { isLinux, isMac, isWin } from "../constant";
import { ServiceRegister } from "../shared/reflect";
import { TYPES } from "../shared/types";
import { EventNames, emitter, sendToRenderer } from "./event-service";

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

    if (isMac) {
      BrowserWindow.getAllWindows().forEach((window) => {
        window.on("enter-full-screen", () => {
          this.handleMacFullscreenStatus(true);
        });

        window.on("leave-full-screen", () => {
          this.handleMacFullscreenStatus(false);
        });
      });
    }
  }

  // ! setTitleBarOverlay is available on Windows and Linux
  private updateTitleBarOverlay() {
    if (!isWin && !isLinux) return;

    BrowserWindow.getAllWindows().forEach((window) => {
      window.setTitleBarOverlay(
        nativeTheme.shouldUseDarkColors
          ? titleBarOverlayDark
          : titleBarOverlayLight,
      );
    });
  }

  // ! Only available on Mac
  private handleMacFullscreenStatus(isMaximized: boolean) {
    if (!isMac) return;

    sendToRenderer(EventNames.WINDOW_MAC_FULLSCREEN_STATE_UPDATE, {
      isMaximized,
    });
  }
}
