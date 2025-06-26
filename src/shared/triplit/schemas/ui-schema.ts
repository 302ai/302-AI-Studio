import { Schema as S } from "@triplit/client";

export const uiSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    activeProviderId: S.String({ default: "" }),
    activeThreadId: S.String({ default: "" }),
    activeTabId: S.String({ default: "" }),
    activeTabHistory: S.Set(S.String(), { default: new Set() }),
    theme: S.String({
      enum: ["light", "dark", "system"],
      default: "system",
    }),

    language: S.String({
      enum: ["zh", "en", "ja"],
      default: "zh",
    }),

    searchProvider: S.String({
      enum: ["search1api", "tavily", "exa", "bochaai"],
      default: "search1api",
    }),

    selectedModelId: S.String({ default: "" }),
  }),
};
