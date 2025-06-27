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
    selectedModelId: S.String({ nullable: true }),
  }),
};
