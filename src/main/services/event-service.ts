import type { ModelProvider } from "@shared/types/provider";
import mitt from "mitt";

export enum EventNames {
  PROVIDERS_UPDATE = "providers:update",
}

type Events = {
  [EventNames.PROVIDERS_UPDATE]: {
    providers: ModelProvider[];
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
