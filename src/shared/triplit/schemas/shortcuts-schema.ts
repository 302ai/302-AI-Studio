import { Schema as S } from "@triplit/client";

export const shortcutsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    action: S.String({
      enum: [
        // Existing actions
        "send-message",
        "new-chat",
        "clear-messages",
        "close-current-tab",
        "close-other-tabs",
        "delete-current-thread",
        "open-settings",
        "toggle-sidebar",
        // New navigation actions
        // "quick-navigation",
        // "command-palette",
        "stop-generation",
        "new-tab",
        // "new-session",
        "regenerate-response",
        "search",
        "create-branch",
        "restore-last-tab",
        "screenshot",
        "next-tab",
        "previous-tab",
        "toggle-model-panel",
        "toggle-incognito-mode",
        "branch-and-send",
        // Tab navigation (1-9)
        "switch-to-tab-1",
        "switch-to-tab-2",
        "switch-to-tab-3",
        "switch-to-tab-4",
        "switch-to-tab-5",
        "switch-to-tab-6",
        "switch-to-tab-7",
        "switch-to-tab-8",
        "switch-to-tab-9",
      ],
    }),
    keys: S.Set(S.String()),
    scope: S.String({
      enum: ["global", "app"],
      default: "app",
    }),
    order: S.Number({ default: 0 }),
    createdAt: S.Date({ default: S.Default.now() }),
    updatedAt: S.Date({ default: S.Default.now() }),
  }),
};
