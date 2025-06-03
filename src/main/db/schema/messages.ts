import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const getNow = () => new Date().toISOString();

export const messages = sqliteTable("messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  messageId: text("message_id").notNull().unique(),
  threadId: text("thread_id").notNull(),
  parentMessageId: text("parent_message_id"),
  role: text("role")
    .notNull()
    .$type<"user" | "assistant" | "system" | "function">(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(getNow),
  orderSeq: integer("order_seq", { mode: "number" })
    .notNull()
    .$defaultFn(() => 0),
  tokenCount: integer("token_count", { mode: "number" })
    .notNull()
    .$defaultFn(() => 0),
  status: text("status")
    .notNull()
    .$type<"pending" | "success" | "error">()
    .$defaultFn(() => "pending"),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
