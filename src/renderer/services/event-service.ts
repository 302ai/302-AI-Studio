// ! This service is only used within the renderer process

import type {
  Message,
  Model,
  ShortcutAction,
  Thread,
} from "@shared/triplit/types";
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
  TAB_RELOAD = "tab:reload",

  // * Message events
  MESSAGE_EDIT = "message:edit",

  // * Model events
  MODEL_EDIT = "model:edit",

  // * Code preview events
  CODE_PREVIEW_OPEN = "code-preview:open",
  CODE_PREVIEW_CLOSE = "code-preview:close",

  // * Shortcut events
  SHORTCUT_TRIGGERED = "shortcut:triggered",

  // * Window events
  WINDOW_MAC_FULLSCREEN_STATE_UPDATE = "window:mac-maximized-state-update",

  // * Privacy mode events
  PRIVACY_MODE_TOGGLE = "privacy-mode:toggle",
  PRIVACY_MODE_CONFIRM = "privacy-mode:confirm",
  PRIVACY_MODE_CANCEL = "privacy-mode:cancel",
  PRIVACY_MODE_CONFIRM_DIALOG = "privacy-mode:confirm-dialog",
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
  [EventNames.TAB_RELOAD]: {
    tabId: string;
  };
  [EventNames.TAB_CLOSE]: {
    tabId: string;
    nextActiveTabId: string;
  };
  [EventNames.TAB_CLOSE_ALL]: null;
  [EventNames.MESSAGE_EDIT]: Message;
  [EventNames.MODEL_EDIT]: {
    model: Model;
  };
  [EventNames.CODE_PREVIEW_OPEN]: {
    code: string;
    language: string;
  };
  [EventNames.CODE_PREVIEW_CLOSE]: null;
  [EventNames.SHORTCUT_TRIGGERED]: {
    action: ShortcutAction;
  };
  [EventNames.WINDOW_MAC_FULLSCREEN_STATE_UPDATE]: {
    isMaximized: boolean;
  };
  [EventNames.PRIVACY_MODE_TOGGLE]: {
    isPrivate: boolean;
    tabId?: string;
    threadId?: string;
  };
  [EventNames.PRIVACY_MODE_CONFIRM]: null;
  [EventNames.PRIVACY_MODE_CANCEL]: null;
  [EventNames.PRIVACY_MODE_CONFIRM_DIALOG]: {
    action: string;
    message: string;
  };
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
