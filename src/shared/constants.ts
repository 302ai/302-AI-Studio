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
  // Message and Chat Actions
  {
    order: 0,
    action: "send-message",
    keys: new Set(["Enter"]),
    scope: "app",
  },
  // {
  //   order: 1,
  //   action: "new-chat",
  //   keys: new Set([]),
  //   scope: "app",
  // },
  {
    order: 2,
    action: "clear-messages",
    keys: new Set(["Cmd", "L"]),
    scope: "app",
  },
  {
    order: 3,
    action: "new-session",
    keys: new Set(["Cmd", "N"]),
    scope: "app",
  },
  {
    order: 4,
    action: "regenerate-response",
    keys: new Set(["Cmd", "R"]),
    scope: "app",
  },
  {
    order: 5,
    action: "create-branch",
    keys: new Set(["Cmd", "Shift", "N"]),
    scope: "app",
  },
  {
    order: 6,
    action: "branch-and-send",
    keys: new Set(["Cmd", "Shift", "Enter"]),
    scope: "app",
  },

  // Navigation Actions
  {
    order: 10,
    action: "quick-navigation",
    keys: new Set(["Cmd", "P"]),
    scope: "app",
  },
  {
    order: 11,
    action: "command-palette",
    keys: new Set(["Cmd", "K"]),
    scope: "app",
  },
  {
    order: 12,
    action: "search",
    keys: new Set(["Cmd", "F"]),
    scope: "app",
  },

  // Tab Management
  {
    order: 20,
    action: "new-tab",
    keys: new Set(["Cmd", "T"]),
    scope: "app",
  },
  {
    order: 21,
    action: "close-current-tab",
    keys: new Set(["Cmd", "W"]),
    scope: "app",
  },
  {
    order: 22,
    action: "close-other-tabs",
    keys: new Set(["Cmd", "Option", "W"]),
    scope: "app",
  },
  {
    order: 23,
    action: "close-all-tabs",
    keys: new Set([]),
    scope: "app",
  },
  {
    order: 24,
    action: "restore-last-tab",
    keys: new Set(["Cmd", "Shift", "T"]),
    scope: "app",
  },
  {
    order: 25,
    action: "next-tab",
    keys: new Set(["Ctrl", "Tab"]),
    scope: "app",
  },
  {
    order: 26,
    action: "previous-tab",
    keys: new Set(["Ctrl", "Shift", "Tab"]),
    scope: "app",
  },

  // Quick Tab Switching (1-9)
  {
    order: 30,
    action: "switch-to-tab-1",
    keys: new Set(["Cmd", "1"]),
    scope: "app",
  },
  {
    order: 31,
    action: "switch-to-tab-2",
    keys: new Set(["Cmd", "2"]),
    scope: "app",
  },
  {
    order: 32,
    action: "switch-to-tab-3",
    keys: new Set(["Cmd", "3"]),
    scope: "app",
  },
  {
    order: 33,
    action: "switch-to-tab-4",
    keys: new Set(["Cmd", "4"]),
    scope: "app",
  },
  {
    order: 34,
    action: "switch-to-tab-5",
    keys: new Set(["Cmd", "5"]),
    scope: "app",
  },
  {
    order: 35,
    action: "switch-to-tab-6",
    keys: new Set(["Cmd", "6"]),
    scope: "app",
  },
  {
    order: 36,
    action: "switch-to-tab-7",
    keys: new Set(["Cmd", "7"]),
    scope: "app",
  },
  {
    order: 37,
    action: "switch-to-tab-8",
    keys: new Set(["Cmd", "8"]),
    scope: "app",
  },
  {
    order: 38,
    action: "switch-to-tab-9",
    keys: new Set(["Cmd", "9"]),
    scope: "app",
  },

  // UI Actions
  {
    order: 40,
    action: "toggle-sidebar",
    keys: new Set(["Cmd", "B"]),
    scope: "app",
  },
  {
    order: 41,
    action: "toggle-model-panel",
    keys: new Set(["Ctrl", "M"]),
    scope: "app",
  },
  {
    order: 42,
    action: "toggle-incognito-mode",
    keys: new Set(["Cmd", "E"]),
    scope: "app",
  },

  // System Actions
  {
    order: 50,
    action: "open-settings",
    keys: new Set(["Cmd", ","]),
    scope: "app",
  },
  {
    order: 51,
    action: "stop-generation",
    keys: new Set(["Cmd", "D"]),
    scope: "app",
  },
  {
    order: 52,
    action: "delete-current-thread",
    keys: new Set([]),
    scope: "app",
  },

  // Global Actions
  {
    order: 60,
    action: "screenshot",
    keys: new Set(["Shift", "Cmd", "E"]),
    scope: "global",
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
  "quick-navigation": "record",
  "command-palette": "record",
  "stop-generation": "record",
  "new-tab": "record",
  "new-session": "record",
  "regenerate-response": "record",
  search: "record",
  "create-branch": "record",
  "close-all-tabs": "record",
  "restore-last-tab": "record",
  screenshot: "record",
  "next-tab": "record",
  "previous-tab": "record",
  "toggle-model-panel": "record",
  "toggle-incognito-mode": "record",
  "branch-and-send": "record",
  // Tab navigation (1-9)
  "switch-to-tab-1": "record",
  "switch-to-tab-2": "record",
  "switch-to-tab-3": "record",
  "switch-to-tab-4": "record",
  "switch-to-tab-5": "record",
  "switch-to-tab-6": "record",
  "switch-to-tab-7": "record",
  "switch-to-tab-8": "record",
  "switch-to-tab-9": "record",
};

export interface ShortcutOption {
  id: string;
  label: string;
  keys: string[];
}

export const SHORTCUT_OPTIONS: Record<ShortcutAction, ShortcutOption[]> = {
  // Existing actions
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
  // New navigation actions
  "quick-navigation": [],
  "command-palette": [],
  "stop-generation": [],
  "new-tab": [],
  "new-session": [],
  "regenerate-response": [],
  search: [],
  "create-branch": [],
  "close-all-tabs": [],
  "restore-last-tab": [],
  screenshot: [],
  "next-tab": [],
  "previous-tab": [],
  "toggle-model-panel": [],
  "toggle-incognito-mode": [],
  "branch-and-send": [],
  // Tab navigation (1-9)
  "switch-to-tab-1": [],
  "switch-to-tab-2": [],
  "switch-to-tab-3": [],
  "switch-to-tab-4": [],
  "switch-to-tab-5": [],
  "switch-to-tab-6": [],
  "switch-to-tab-7": [],
  "switch-to-tab-8": [],
  "switch-to-tab-9": [],
};
