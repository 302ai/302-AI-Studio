import "reflect-metadata";
import { makeAppWithSingleInstanceLock } from "@lib/electron-app/factories/app/instance";
import { makeAppSetup } from "@lib/electron-app/factories/app/setup";
import { app } from "electron";
import { initMainBridge } from "./bridge";
import type { ShortcutsService } from "./services/shortcuts-service";
import { container } from "./shared/bindings";
import { TYPES } from "./shared/types";
import { MainWindow } from "./windows/main";

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  await makeAppSetup(MainWindow);
  initMainBridge();

  // Cleanup shortcuts on app quit
  app.on("will-quit", () => {
    try {
      const shortcutsService = container.get<ShortcutsService>(
        TYPES.ShortcutsService,
      );
      shortcutsService.cleanup();
    } catch {
      // Service might not be initialized
    }
  });
});
