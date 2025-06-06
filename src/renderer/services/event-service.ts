import type { Thread } from "@shared/triplit/types";
import mitt from "mitt";

export enum EventNames {
  // * Thread events
  THREAD_RENAME = "thread:rename",
  THREAD_DELETE = "thread:delete",
  THREAD_SELECT = "thread:select",

  // * Tab events
  TAB_CLOSE = "tab:close",
  TAB_CLOSE_ALL = "tab:close-all",
  TAB_SELECT = "tab:select",
}

type Events = {
  [EventNames.THREAD_RENAME]: {
    threadId: string;
    newTitle: string;
  };
  [EventNames.THREAD_DELETE]: {
    threadId: string;
  };
  [EventNames.THREAD_SELECT]: {
    thread: Thread;
  };
  [EventNames.TAB_SELECT]: {
    tabId: string;
  };
  [EventNames.TAB_CLOSE]: {
    tabId: string;
    nextActiveId: string;
  };
  [EventNames.TAB_CLOSE_ALL]: null;
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
  _mittInstance: mittInstance,
};
