import { Schema as S } from "@triplit/client";

export const providersSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    name: S.String(),
    avatar: S.String({ nullable: true }),
    apiType: S.String(),
    apiKey: S.String(),
    baseUrl: S.String(),
    enabled: S.Boolean({ default: true }),
    custom: S.Boolean({ default: false }),
    order: S.Number({ default: 0 }),
    status: S.String({
      enum: ["success", "pending", "error"],
      default: "pending",
    }),
    websites: S.Optional(
      S.Record({
        official: S.String(),
        apiKey: S.String(),
        docs: S.String(),
        models: S.String(),
        defaultBaseUrl: S.String(),
      }),
    ),
  }),
  relationships: {
    models: S.RelationMany("models", {
      where: [["providerId", "=", "$id"]],
    }),
  },
};
