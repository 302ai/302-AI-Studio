import { makeAppWithSingleInstanceLock } from "@lib/electron-app/factories/app/instance";
import { makeAppSetup } from "@lib/electron-app/factories/app/setup";
import { app } from "electron";
import Logger from "electron-log";
import { initMainBridge } from "./bridge";
import { dbConnect } from "./db";
import { MainWindow } from "./windows/main";

Logger.initialize();

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  initMainBridge();
  await makeAppSetup(MainWindow);
  await dbConnect();
});
