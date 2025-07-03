// ! This service is only used within the renderer process

import type { Message, Thread } from "@shared/triplit/types";
import mitt from "mitt";

export enum EventNames {
  // * Thread events
  THREAD_RENAME = "thread:rename",
  THREAD_DELETE = "thread:delete",
  THREAD_DELETE_ALL = "thread:delete-all",
  THREAD_SELECT = "thread:select",
  THREAD_ADD = "thread:add",

  // * Tab events
  TAB_CLOSE = "tab:close",
  TAB_CLOSE_ALL = "tab:close-all",
  TAB_SELECT = "tab:select",

  // * Message events
  MESSAGE_EDIT = "message:edit",

  // * Code preview events
  CODE_PREVIEW_OPEN = "code-preview:open",
  CODE_PREVIEW_CLOSE = "code-preview:close",
}

type Events = {
  [EventNames.THREAD_RENAME]: {
    threadId: string;
    newTitle: string;
  };
  [EventNames.THREAD_DELETE]: {
    threadId: string;
  };
  [EventNames.THREAD_DELETE_ALL]: {
    threadIds: string[];
  };
  [EventNames.THREAD_SELECT]: {
    thread: Thread;
  };
  [EventNames.THREAD_ADD]: {
    thread: Thread;
  };
  [EventNames.TAB_SELECT]: {
    tabId: string;
  };
  [EventNames.TAB_CLOSE]: {
    tabId: string;
    nextActiveTabId: string;
  };
  [EventNames.TAB_CLOSE_ALL]: null;
  [EventNames.MESSAGE_EDIT]: Message;
  [EventNames.CODE_PREVIEW_OPEN]: {
    code: string;
    language: string;
  };
  [EventNames.CODE_PREVIEW_CLOSE]: null;
};

const mittInstance = mitt<Events>();

export const emitter = {
  ...mittInstance,
  on<Key extends keyof Events>(
    type: Key,
    handler: (event: Events[Key]) => void,
  ): () => void {
    mittInstance.on(type, handler);
    return () => mittInstance.off(type, handler);
  },
  _mittInstance: mittInstance,
};
