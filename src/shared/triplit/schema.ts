import { Schema as S } from "@triplit/client";

export const schema = S.Collections({
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
  },
});

export type Schema = typeof schema;
