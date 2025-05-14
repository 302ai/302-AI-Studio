/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import services from "./services";
import { CommunicationWay, getMetadata } from "./shared/reflect";
import { ipcMain, ipcRenderer } from "electron";

export function initMainBridge(): void {
  services?.forEach((service) => {
    const { service: name, handlers } = getMetadata(service.name);

    if (!handlers) {
      console.warn(`No handlers found for service: ${name}`);
      return;
    }

    Object.entries(handlers).forEach(([methodName, handlerInfo]) => {
      const { handle, way } = handlerInfo as {
        handle: (...args: any[]) => Promise<any> | any;
        way: CommunicationWay;
      };

      if (way === CommunicationWay.RENDERER_TO_MAIN__ONE_WAY) {
        ipcMain.on(`${name}:${methodName}`, handle);
      } else if (way === CommunicationWay.RENDERER_TO_MAIN__TWO_WAY) {
        ipcMain.handle(`${name}:${methodName}`, handle);
      }
    });
  });
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export function initPreloadBridge(): { [key: string]: Function } {
  const api = {};

  services?.forEach((service) => {
    const metadata = getMetadata(service.name);
    const { service: name, handlers } = metadata;

    if (!handlers) {
      console.warn(`No handlers found for service: ${name}`);
      return;
    }

    // 为服务创建对象
    Reflect.set(api, `${name}`, {});

    // 遍历所有处理程序
    Object.entries(handlers).forEach(([methodName, handlerInfo]) => {
      const { way } = handlerInfo as {
        way: CommunicationWay;
      };
      if (way === CommunicationWay.RENDERER_TO_MAIN__ONE_WAY) {
        Reflect.set(api[name], `${methodName}`, (...args) => {
          ipcRenderer.send(`${name}:${methodName}`, ...args);
        });
      } else if (way === CommunicationWay.RENDERER_TO_MAIN__TWO_WAY) {
        Reflect.set(api[name], `${methodName}`, (...args) => {
          return ipcRenderer.invoke(`${name}:${methodName}`, ...args);
        });
      }
    });
  });

  return api;
}
