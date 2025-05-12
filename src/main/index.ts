import { app } from "electron";
import { registerIpc } from "./ipc";
import { makeAppWithSingleInstanceLock } from "@lib/electron-app/factories/app/instance";
import { makeAppSetup } from "@lib/electron-app/factories/app/setup";
import { MainWindow } from "./windows/main";
import { dbConnect } from "./db";

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  await dbConnect();
  const mainWindow = await makeAppSetup(MainWindow);
  registerIpc(mainWindow, app);
});
