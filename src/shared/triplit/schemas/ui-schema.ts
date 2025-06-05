import { Schema as S } from "@triplit/client";

export const uiSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    activeProviderId: S.String({ default: "" }),
  }),
}