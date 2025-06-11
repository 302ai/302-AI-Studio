import type { Provider } from "@shared/triplit/types";
import mitt from "mitt";

export enum EventNames {
  PROVIDER_ADD = "provider:add",
  PROVIDER_DELETE = "provider:delete",
}

type Events = {
  [EventNames.PROVIDER_ADD]: {
    provider: Provider;
  };
  [EventNames.PROVIDER_DELETE]: {
    providerId: string;
  };
};

const mainMittInstance = mitt<Events>();

export const emitter = {
  ...mainMittInstance,
  on<Key extends keyof Events>(
    type: Key,
    handler: (event: Events[Key]) => void
  ): () => void {
    mainMittInstance.on(type, handler);
    return () => mainMittInstance.off(type, handler);
  },
  // Original mitt instance
  _mittInstance: mainMittInstance,
};
