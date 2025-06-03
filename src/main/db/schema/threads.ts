import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const getNow = () => new Date().toISOString();

export const threads = sqliteTable("threads", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  threadId: text("thread_id").notNull().unique(),
  title: text("title").notNull(),
  providerId: text("provider_id").notNull(),
  modelId: text("model_id").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(getNow),
  updatedAt: text("updated_at").notNull().$defaultFn(getNow),
  collected: integer("is_collected", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
});

export type Thread = typeof threads.$inferSelect;
export type InsertThread = typeof threads.$inferInsert;
