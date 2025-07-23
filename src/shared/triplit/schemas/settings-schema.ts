import { Schema as S } from "@triplit/client";

export const settingsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    enableWebSearch: S.Boolean({ default: false }),
    enableReason: S.Boolean({ default: false }),
    searchService: S.String({
      enum: ["search1api", "tavily", "exa", "bochaai"],
      default: "search1api",
    }),
    theme: S.String({
      enum: ["light", "dark", "system"],
      default: "system",
    }),
    language: S.String({
      enum: ["zh", "en", "ja"],
      default: "zh",
    }),
    selectedModelId: S.String({ default: "" }),
    autoUpdate: S.Boolean({ default: true }),
    displayAppStore: S.Boolean({ default: true }),
    defaultPrivacyMode: S.Boolean({ default: false }),
    isPrivate: S.Boolean({ default: false }),
    feedUrl: S.String({
      default:
        "https://github.com/302ai/302-AI-Studio/releases/latest/download",
    }),
    // Streaming output configuration
    streamSmootherEnabled: S.Optional(S.Boolean({ default: true })),
    streamSpeed: S.Optional(
      S.String({
        enum: ["slow", "normal", "fast"],
        default: "normal",
      }),
    ),
    collapseCodeBlock: S.Optional(S.Boolean({ default: false })),
    hideReason: S.Optional(S.Boolean({ default: false })),
  }),
};
