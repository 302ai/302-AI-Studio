import { app } from "electron";
import { makeAppWithSingleInstanceLock } from "@lib/electron-app/factories/app/instance";
import { makeAppSetup } from "@lib/electron-app/factories/app/setup";
import { MainWindow } from "./windows/main";
import { dbConnect } from "./db";
import { initMainBridge } from "./bridge";
import Logger from "electron-log";

Logger.initialize();

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  initMainBridge();
  await makeAppSetup(MainWindow);
  await dbConnect();
});
