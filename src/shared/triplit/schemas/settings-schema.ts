import { Schema as S } from "@triplit/client";

export const settingsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    enableWebSearch: S.Boolean({ default: false }),
    enableReason: S.Boolean({ default: false }),
  }),
};
