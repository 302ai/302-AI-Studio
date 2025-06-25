/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
import "reflect-metadata";

// Define a metadata to collect all metadata
const _metadata = {};

export enum CommunicationWay {
  RENDERER_TO_MAIN__ONE_WAY = "RENDERER_TO_MAIN__ONE_WAY",
  RENDERER_TO_MAIN__TWO_WAY = "RENDERER_TO_MAIN__TWO_WAY",
}

export function ServiceRegister(serviceSymbol: symbol) {
  return (target: any) => {
    const targetName = target.name;

    const data = {
      serviceSymbol,
      ...Reflect.getMetadata(`${targetName}`, _metadata),
    };

    Reflect.defineMetadata(`${targetName}`, data, _metadata);
  };
}

export function ServiceHandler(communicationWay?: CommunicationWay) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    const targetName = target.constructor.name;

    const existingMetadata =
      Reflect.getMetadata(`${targetName}`, _metadata) || {};

    if (!existingMetadata.handlers) {
      existingMetadata.handlers = {};
    }

    existingMetadata.handlers[methodName] = {
      handle: descriptor.value,
      way: communicationWay || CommunicationWay.RENDERER_TO_MAIN__TWO_WAY,
    };

    Reflect.defineMetadata(`${targetName}`, existingMetadata, _metadata);
  };
}

export function getMetadata(className: string) {
  return Reflect.getMetadata(`${className}`, _metadata);
}
