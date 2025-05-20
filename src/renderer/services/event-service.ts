import mitt from "mitt";

export enum EventNames {
  THREAD_RENAME = "thread:rename",
  THREAD_DELETE = "thread:delete",
  THREAD_OPEN = "thread:open",

  TAB_ACTIVE = "tab:active",
}

type Events = {
  [EventNames.THREAD_RENAME]: {
    threadId: string;
    newTitle: string;
  };
  [EventNames.THREAD_DELETE]: {
    threadId: string;
  };
  [EventNames.THREAD_OPEN]: {
    id: string;
    title: string;
    favicon: string;
  };
  [EventNames.TAB_ACTIVE]: {
    tabId: string;
  };
};

const mittInstance = mitt<Events>();

export const emitter = {
  ...mittInstance,
  on<Key extends keyof Events>(
    type: Key,
    handler: (event: Events[Key]) => void
  ): () => void {
    mittInstance.on(type, handler);
    return () => mittInstance.off(type, handler);
  },
  // Original mitt instance
  _mittInstance: mittInstance,
};
