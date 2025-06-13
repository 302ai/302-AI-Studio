import { Schema as S } from "@triplit/client";

export const messagesSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    threadId: S.String(),
    parentMessageId: S.String({ nullable: true }),
    role: S.String({
      enum: ["user", "assistant", "system", "function"],
    }),
    content: S.String(),
    attachments: S.String({ nullable: true }),
    createdAt: S.Date({ default: S.Default.now() }),
    orderSeq: S.Number({ default: 0 }),
    tokenCount: S.Number({ default: 0 }),
    status: S.String({
      default: "pending",
      enum: ["pending", "success", "error", "stop"],
    }),
    providerId: S.String({ nullable: true }),
  }),
  relationships: {
    thread: S.RelationById("threads", "$threadId"),
    parentMessage: S.RelationById("messages", "$parentMessageId"),
  },
};
