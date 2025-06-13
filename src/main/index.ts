import { makeAppWithSingleInstanceLock } from "@lib/electron-app/factories/app/instance";
import { makeAppSetup } from "@lib/electron-app/factories/app/setup";
import { app } from "electron";
import Logger from "electron-log";
import { initMainBridge } from "./bridge";
import { MainWindow } from "./windows/main";

Logger.initialize();
Logger.transports.ipc.level = false;

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  await makeAppSetup(MainWindow);
  initMainBridge();
});
