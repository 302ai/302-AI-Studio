// ! This service can be used within the main process
// ! Support main process to main process communication of main process to renderer process communication

import type {
  Message,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import { BrowserWindow } from "electron";
import mitt from "mitt";

export enum RendererTarget {
  ALL_WINDOWS = "all-windows",
}

export enum EventNames {
  // * Provider Events
  PROVIDER_ADD = "provider:add",
  PROVIDER_DELETE = "provider:delete",
  PROVIDER_UPDATE = "provider:update",

  // * Chat Events
  CHAT_STREAM_STATUS_UPDATE = "chat:stream-status-update",

  // * Message Events
  MESSAGE_ACTIONS = "message:actions",

  // * Window Events
  WINDOW_TITLE_BAR_OVERLAY_UPDATE = "window:title-bar-overlay-update",
}

type Events = {
  [EventNames.PROVIDER_ADD]: {
    provider: Provider;
  };
  [EventNames.PROVIDER_DELETE]: {
    providerId: string;
  };
  [EventNames.PROVIDER_UPDATE]: {
    providerId: string;
    updateData: UpdateProviderData;
  };
  [EventNames.CHAT_STREAM_STATUS_UPDATE]: {
    threadId: string;
    status: "pending" | "success" | "error" | "stop";
    delta?: string;
    userMessageId?: string;
  };
  [EventNames.MESSAGE_ACTIONS]: {
    threadId: string;
    actions: {
      type: "edit" | "delete" | "delete-single" | "delete-multiple";
      message?: Message;
      messages?: Message[];
    };
  };
  [EventNames.WINDOW_TITLE_BAR_OVERLAY_UPDATE]: null;
};

const oriMittInstance = mitt<Events>();

export const emitter = {
  ...oriMittInstance,
  on<Key extends keyof Events>(
    type: Key,
    handler: (event: Events[Key]) => void,
  ): () => void {
    oriMittInstance.on(type, handler);
    return () => oriMittInstance.off(type, handler);
  },
  // Original mitt instance
  _mittInstance: oriMittInstance,
};

export function sendToMain(type: keyof Events, data: Events[keyof Events]) {
  emitter.emit(type, data);
}

export function sendToRenderer(
  type: keyof Events,
  data: Events[keyof Events],
  target: RendererTarget = RendererTarget.ALL_WINDOWS,
) {
  switch (target) {
    case RendererTarget.ALL_WINDOWS:
      sendToAllWindows(type, data);
      break;
    default:
      sendToAllWindows(type, data);
      break;
  }
}

export function sendToThread(
  threadId: string,
  type: keyof Events,
  data: Events[keyof Events],
) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(`${type}-${threadId}`, data);
  });
}

function sendToAllWindows(type: keyof Events, data: Events[keyof Events]) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(type, data);
  });
}
