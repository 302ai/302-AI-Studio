import { Schema as S } from "@triplit/client";
import {
  attachmentsSchema,
  messagesSchema,
  modelsSchema,
  providersSchema,
  settingsSchema,
  shortcutsSchema,
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
  attachments: attachmentsSchema,
  ui: uiSchema,
  settings: settingsSchema,
  shortcuts: shortcutsSchema,
});

export type Schema = typeof schema;
