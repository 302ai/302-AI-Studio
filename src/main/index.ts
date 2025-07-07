import "reflect-metadata";
import { makeAppWithSingleInstanceLock } from "@lib/electron-app/factories/app/instance";
import { makeAppSetup } from "@lib/electron-app/factories/app/setup";
import { app } from "electron";
import { initMainBridge } from "./bridge";
import { MainWindow } from "./windows/main";

// Logger initialization is handled automatically by the new logger system

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  await makeAppSetup(MainWindow);
  initMainBridge();
});
