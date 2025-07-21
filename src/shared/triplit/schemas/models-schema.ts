import { Schema as S } from "@triplit/client";

export const modelsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    name: S.String(),
    remark: S.String({ default: "" }),
    providerId: S.String(),
    capabilities: S.Set(S.String()),
    type: S.String({
      enum: ["language", "image-generation", "tts", "embedding", "rerank"],
      default: "language",
    }),
    custom: S.Boolean({ default: false }),
    enabled: S.Boolean({ default: true }),
    collected: S.Boolean({ default: false }),
  }),
  relationships: {
    provider: S.RelationById("providers", "$providerId"),
  },
};
