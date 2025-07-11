import type { CreateShortcutData, ShortcutAction } from "./triplit/types";

export const ENVIRONMENT = {
  IS_DEV: process.env.NODE_ENV === "development",
};

export const PLATFORM = {
  IS_MAC: process.platform === "darwin",
  IS_WINDOWS: process.platform === "win32",
  IS_LINUX: process.platform === "linux",
};

export const WINDOW_SIZE = {
  MIN_HEIGHT: 720,
  MIN_WIDTH: 1080,
};

export const DEFAULT_SHORTCUTS: CreateShortcutData[] = [
  { order: 0, action: "send-message", keys: new Set(["Enter"]), scope: "app" },
  { order: 1, action: "new-chat", keys: new Set(["Cmd", "T"]), scope: "app" },
  {
    order: 2,
    action: "clear-messages",
    keys: new Set(["Cmd", "L"]),
    scope: "app",
  },
  {
    order: 3,
    action: "close-current-tab",
    keys: new Set(["Cmd", "W"]),
    scope: "app",
  },
  {
    order: 4,
    action: "close-other-tabs",
    keys: new Set(["Cmd", "Shift", "W"]),
    scope: "app",
  },
  {
    order: 5,
    action: "delete-current-thread",
    keys: new Set([]),
    scope: "app",
  },
  {
    order: 6,
    action: "open-settings",
    keys: new Set(["Cmd", ","]),
    scope: "app",
  },
  {
    order: 7,
    action: "toggle-sidebar",
    keys: new Set(["Cmd", "B"]),
    scope: "app",
  },
];

export const SHORTCUT_MODES: Record<ShortcutAction, "preset" | "record"> = {
  "send-message": "preset",
  "new-chat": "record",
  "clear-messages": "record",
  "close-current-tab": "record",
  "close-other-tabs": "record",
  "delete-current-thread": "record",
  "open-settings": "record",
  "toggle-sidebar": "record",
};

export interface ShortcutOption {
  id: string;
  label: string;
  keys: string[];
}

export const SHORTCUT_OPTIONS: Record<ShortcutAction, ShortcutOption[]> = {
  "send-message": [
    { id: "enter", label: "Enter", keys: ["Enter"] },
    { id: "shift-enter", label: "Shift+Enter", keys: ["Shift", "Enter"] },
    {
      id: "cmd-enter",
      label: "Cmd+Enter",
      keys: ["Cmd", "Enter"],
    },
  ],
  "new-chat": [],
  "clear-messages": [],
  "close-current-tab": [],
  "close-other-tabs": [],
  "delete-current-thread": [],
  "open-settings": [],
  "toggle-sidebar": [],
};
