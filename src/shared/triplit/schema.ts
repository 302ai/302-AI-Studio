import { Schema as S } from "@triplit/client";
import {
  messagesSchema,
  modelsSchema,
  providersSchema,
  tabsSchema,
  threadsSchema,
} from "./schemas";

export const schema = S.Collections({
  providers: providersSchema,
  models: modelsSchema,
  tabs: tabsSchema,
  threads: threadsSchema,
  messages: messagesSchema,
});

export type Schema = typeof schema;
