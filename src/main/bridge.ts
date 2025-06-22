/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */

import { ipcMain, ipcRenderer } from "electron";
import { services } from "./services";
import { CommunicationWay, getMetadata } from "./shared/reflect";

export function initMainBridge(): void {
  services?.forEach((service) => {
    const metadata = getMetadata(service.name);
    if (!metadata) {
      console.warn(`No metadata found for service: ${service.name}`);
      return;
    }

    const serviceInstance = new service();

    const { service: name, handlers } = metadata;
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
        ipcMain.on(`${name}:${methodName}`, handle.bind(serviceInstance));
      } else if (way === CommunicationWay.RENDERER_TO_MAIN__TWO_WAY) {
        ipcMain.handle(`${name}:${methodName}`, handle.bind(serviceInstance));
      }
    });
  });
}

// biome-ignore lint/complexity/noBannedTypes: ignore any
export function initPreloadBridge(): { [key: string]: Function } {
  const api = {};

  services?.forEach((service) => {
    const metadata = getMetadata(service.name);
    const { service: name, handlers } = metadata;

    if (!handlers) {
      console.warn(`No handlers found for service: ${name}`);
      return;
    }

    // Create object for service
    Reflect.set(api, `${name}`, {});

    // Transform handlers to api
    Object.entries(handlers).forEach(([methodName, handlerInfo]) => {
      const { way } = handlerInfo as {
        way: CommunicationWay;
      };
      if (way === CommunicationWay.RENDERER_TO_MAIN__ONE_WAY) {
        Reflect.set(api[name], `${methodName}`, (...args: any[]) => {
          ipcRenderer.send(`${name}:${methodName}`, ...args);
        });
      } else if (way === CommunicationWay.RENDERER_TO_MAIN__TWO_WAY) {
        Reflect.set(api[name], `${methodName}`, (...args: any[]) => {
          return ipcRenderer.invoke(`${name}:${methodName}`, ...args);
        });
      }
    });
  });

  return api;
}
