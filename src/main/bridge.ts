/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
import { ipcMain, ipcRenderer } from "electron";
import { services } from "./services";
import { container, initBindings } from "./shared/bindings";
import { CommunicationWay, getMetadata } from "./shared/reflect";
import { TYPES } from "./shared/types";

export function initMainBridge(): void {
  try {
    initBindings();

    services?.forEach((service) => {
      const metadata = getMetadata(service.name);
      if (!metadata) {
        console.warn(`No metadata found for service: ${service.name}`);
        return;
      }

      let serviceInstance: any;

      const { serviceSymbol, handlers } = metadata;

      if (serviceSymbol) {
        serviceInstance = container.get(serviceSymbol);
      }

      if (!handlers) {
        console.warn(`No handlers found for service: ${service.name}`);
        return;
      }

      if (container.isBound(serviceSymbol)) {
        const name = Symbol.keyFor(serviceSymbol);
        if (!name) {
          console.error(`❌ Failed to get key of Symbol '${service.name}'`);
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
        console.error(`❌ Failed to resolve service '${service.name}'`);
        return;
      }
    });

    if (process.env.NODE_ENV === "development") {
      printContainerStatus();
    }
  } catch (error) {
    console.error("❌ Failed to initialize main bridge:", error);
    throw error;
  }
}

function printContainerStatus(): void {
  console.log("📊 Inversify Container Status:");

  Object.entries(TYPES).forEach(([name, symbol]) => {
    const isBound = container.isBound(symbol);
    console.log(`  ${isBound ? "✅" : "❌"} ${name}: ${Symbol.keyFor(symbol)}`);
  });
}

// biome-ignore lint/complexity/noBannedTypes: ignore any
export function initPreloadBridge(): { [key: string]: Function } {
  const api = {};

  services?.forEach((service) => {
    const metadata = getMetadata(service.name);

    if (!metadata) {
      console.warn(`No metadata found for service: ${service.name}`);
      return;
    }

    const { serviceSymbol, handlers } = metadata;

    const symbolName = Symbol.keyFor(serviceSymbol);

    if (!symbolName) {
      console.error(`❌ Failed to get key of Symbol '${service.name}'`);
      return;
    }

    // * Convert the first letter to lowercase
    const name = symbolName.charAt(0).toLowerCase() + symbolName.slice(1);

    if (!handlers || !name) {
      console.warn(`No handlers found for service: ${service.name}`);
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
