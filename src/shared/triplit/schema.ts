import { Schema as S } from "@triplit/client";

export const schema = S.Collections({
  providers: {
    schema: S.Schema({
      id: S.Id({ format: "nanoid" }),
      name: S.String(),
      apiType: S.String(),
      apiKey: S.String(),
      baseUrl: S.String(),
      enabled: S.Boolean({ default: true }),
      custom: S.Boolean({ default: false }),
      websites: S.Optional(
        S.Record({
          official: S.String(),
          apiKey: S.String(),
          docs: S.String(),
          models: S.String(),
          defaultBaseUrl: S.String(),
        })
      ),
    }),
    relationships: {
      models: S.RelationMany("models", {
        where: [["providerId", "=", "$id"]],
      }),
    },
  },
  models: {
    schema: S.Schema({
      id: S.Id({ format: "nanoid" }),
      name: S.String(),
      providerId: S.String(),
      capabilities: S.Set(S.String()),
      custom: S.Boolean({ default: false }),
      enabled: S.Boolean({ default: true }),
      collected: S.Boolean({ default: false }),
    }),
    relationships: {
      providers: S.RelationById("providers", "$providerId"),
    },
  },
  threads: {
    schema: S.Schema({
      id: S.Id({ format: "nanoid" }),
      title: S.String(),
      providerId: S.String(),
      modelId: S.String(),
      createdAt: S.Date({ default: S.Default.now() }),
      updatedAt: S.Date({ default: S.Default.now() }),
      collected: S.Boolean({ default: false }),
    }),
    relationships: {
      provider: S.RelationById("providers", "$providerId"),
      messages: S.RelationMany("messages", {
        where: [["threadId", "=", "$id"]],
      }),
    },
  },
  messages: {
    schema: S.Schema({
      id: S.Id({ format: "nanoid" }),
      threadId: S.String(),
      parentMessageId: S.String({ nullable: true }),
      role: S.String({
        enum: ["user", "assistant", "system", "function"],
      }),
      content: S.String(),
      createdAt: S.Date({ default: S.Default.now() }),
      orderSeq: S.Number({ default: 0 }),
      tokenCount: S.Number({ default: 0 }),
      status: S.String({
        default: "pending",
        enum: ["pending", "success", "error"],
      }),
    }),
    relationships: {
      thread: S.RelationById("threads", "$threadId"),
      parentMessage: S.RelationById("messages", "$parentMessageId"),
    },
  },
});

export type Schema = typeof schema;
