import { Schema as S } from "@triplit/client";

export const toolboxSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    name: S.String(),
    description: S.String(),
    category: S.String(),
    categoryId: S.Number(),
    collected: S.Boolean({ default: false }),
    createdAt: S.Date({ default: S.Default.now() }),
  }),
};
