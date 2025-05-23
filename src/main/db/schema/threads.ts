import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const threads = sqliteTable("threads", {
  id: integer().primaryKey(),
});
