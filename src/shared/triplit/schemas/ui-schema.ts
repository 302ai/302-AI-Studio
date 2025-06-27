import { Schema as S } from "@triplit/client";

export const uiSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    activeProviderId: S.String({ default: "" }),
    activeThreadId: S.String({ default: "" }),
    activeTabId: S.String({ default: "" }),
    activeTabHistory: S.Set(S.String(), { default: new Set() }),
    selectedModelId: S.String({ default: "" }),
  }),
};
