import { ThemeMode } from "@types";
import { titleBarOverlayLight, titleBarOverlayDark } from "../config";
import { BrowserWindow } from "electron";

export class WindowService {
  setTitleBarOverlay(window: BrowserWindow, theme: ThemeMode) {
    window.setTitleBarOverlay(
      theme === ThemeMode.Dark ? titleBarOverlayDark : titleBarOverlayLight
    );
  }
}

export const windowService = new WindowService();
