import { Schema as S } from "@triplit/client";

export const threadsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    title: S.String(),
    modelId: S.String(),
    providerId: S.String(),
    createdAt: S.Date({ default: S.Default.now() }),
    updatedAt: S.Date({ default: S.Default.now() }),
    collected: S.Boolean({ default: false }),
  }),
  relationships: {
    model: S.RelationById("models", "$modelId"),
    messages: S.RelationMany("messages", {
      where: [["threadId", "=", "$id"]],
    }),
  },
};
