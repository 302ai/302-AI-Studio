import { Schema as S } from "@triplit/client";
import {
  messagesSchema,
  modelsSchema,
  providersSchema,
  tabsSchema,
  threadsSchema,
  uiSchema,
} from "./schemas";

export const schema = S.Collections({
  providers: providersSchema,
  models: modelsSchema,
  tabs: tabsSchema,
  threads: threadsSchema,
  messages: messagesSchema,
  ui: uiSchema,
});

export type Schema = typeof schema;
