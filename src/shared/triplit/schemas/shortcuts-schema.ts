import { Schema as S } from "@triplit/client";

export const shortcutsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    action: S.String({
      enum: [
        "send-message",
        "new-chat",
        "clear-messages",
        "close-current-tab",
        "close-other-tabs",
        "delete-current-thread",
        "open-settings",
        "toggle-sidebar",
      ],
    }),
    keys: S.Set(S.String()),
    scope: S.String({
      enum: ["global", "app"],
      default: "app",
    }),
    createdAt: S.Date({ default: S.Default.now() }),
    updatedAt: S.Date({ default: S.Default.now() }),
  }),
};
