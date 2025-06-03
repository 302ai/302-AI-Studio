import type { Entity } from "@triplit/client";
import type { Schema } from "./schema";

export type Thread = Entity<Schema, "threads">;
export type Message = Entity<Schema, "messages">;

export type CreateThreadData = Omit<
  Thread,
  "id" | "createdAt" | "updatedAt" | "collected"
>;
export type UpdateThreadData = Partial<Omit<Thread, "id" | "threadId">>;

export type CreateMessageData = Omit<Message, "id" | "createdAt">;
export type UpdateMessageData = Partial<Omit<Message, "id" | "messageId">>;
