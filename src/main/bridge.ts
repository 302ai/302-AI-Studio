/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
import { ipcMain, ipcRenderer } from "electron";
import { services } from "./services";
import { container, initBindings } from "./shared/bindings";
import { CommunicationWay, getMetadata } from "./shared/reflect";
import { TYPES } from "./shared/types";
import logger from "@shared/logger/main-logger";

export function initMainBridge(): void {
  try {
    initBindings();

    services?.forEach((service) => {
      const metadata = getMetadata(service.name);
      if (!metadata) {
        logger.warn("MainBridge: No metadata found for service", {
          serviceName: service.name,
        });
        return;
      }

      let serviceInstance: any;

      const { serviceSymbol, handlers } = metadata;

      if (serviceSymbol) {
        serviceInstance = container.get(serviceSymbol);
      }

      if (!handlers) {
        logger.warn("MainBridge: No handlers found for service", {
          serviceName: service.name,
        });
        return;
      }

      if (container.isBound(serviceSymbol)) {
        const name = Symbol.keyFor(serviceSymbol);
        if (!name) {
          logger.error("MainBridge: Failed to get key of Symbol", {
            serviceName: service.name,
          });
          return;
        }

        Object.entries(handlers).forEach(([methodName, handlerInfo]) => {
          const { handle, way } = handlerInfo as {
            handle: (...args: any[]) => Promise<any> | any;
            way: CommunicationWay;
          };

          const boundHandler = handle.bind(serviceInstance);

          if (way === CommunicationWay.RENDERER_TO_MAIN__ONE_WAY) {
            ipcMain.on(`${name}:${methodName}`, boundHandler);
          } else if (way === CommunicationWay.RENDERER_TO_MAIN__TWO_WAY) {
            ipcMain.handle(`${name}:${methodName}`, boundHandler);
          }
        });
      } else {
        logger.error("MainBridge: Failed to resolve service", {
          serviceName: service.name,
        });
        return;
      }
    });

    if (process.env.NODE_ENV === "development") {
      printContainerStatus();
    }
  } catch (error) {
    logger.error("MainBridge: Failed to initialize main bridge", { error });
    throw error;
  }
}

function printContainerStatus(): void {
  logger.info("📊 Inversify Container Status:");

  Object.entries(TYPES).forEach(([name, symbol]) => {
    const isBound = container.isBound(symbol);
    logger.info(`  ${isBound ? "✅" : "❌"} ${name}: ${Symbol.keyFor(symbol)}`);
  });
}

// biome-ignore lint/complexity/noBannedTypes: ignore any
export function initPreloadBridge(): { [key: string]: Function } {
  const api = {};

  services?.forEach((service) => {
    const metadata = getMetadata(service.name);

    if (!metadata) {
      logger.warn("PreloadBridge: No metadata found for service", {
        serviceName: service.name,
      });
      return;
    }

    const { serviceSymbol, handlers } = metadata;

    const symbolName = Symbol.keyFor(serviceSymbol);

    if (!symbolName) {
      logger.error("PreloadBridge: Failed to get key of Symbol", {
        serviceName: service.name,
      });
      return;
    }

    // * Convert the first letter to lowercase
    const name = symbolName.charAt(0).toLowerCase() + symbolName.slice(1);

    if (!handlers || !name) {
      logger.warn("PreloadBridge: No handlers found for service", {
        serviceName: service.name,
      });
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
          ipcRenderer.send(`${symbolName}:${methodName}`, ...args);
        });
      } else if (way === CommunicationWay.RENDERER_TO_MAIN__TWO_WAY) {
        Reflect.set(api[name], `${methodName}`, (...args: any[]) => {
          return ipcRenderer.invoke(`${symbolName}:${methodName}`, ...args);
        });
      }
    });
  });

  return api;
}
