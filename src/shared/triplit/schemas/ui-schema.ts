import { Schema as S } from "@triplit/client";

export const uiSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    activeProviderId: S.Optional(S.String({ default: "" })),
    activeThreadId: S.Optional(S.String({ default: "" })),
    activeTabId: S.Optional(S.String({ default: "" })),
    activeTabHistory: S.Optional(S.Set(S.String(), { default: new Set() })),
    theme: S.Optional(
      S.String({
        enum: ["light", "dark", "system"],
        default: "system",
      }),
    ),
    language: S.Optional(
      S.String({
        enum: ["zh", "en", "ja"],
        default: "zh",
      }),
    ),
  }),
};
