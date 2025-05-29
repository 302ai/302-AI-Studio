import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const getNow = () => new Date().toISOString();

export const threads = sqliteTable("threads", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  providerId: text("provider_id").notNull(),
  modelId: text("model_id").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(getNow),
  updatedAt: text("updated_at").notNull().$defaultFn(getNow),
  isCollected: integer("is_collected", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
});

export type Thread = typeof threads.$inferSelect;
export type InsertThread = typeof threads.$inferInsert;
