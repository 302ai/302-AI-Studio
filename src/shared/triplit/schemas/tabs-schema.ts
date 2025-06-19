import { Schema as S } from "@triplit/client";

export const tabsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    title: S.String(),
    type: S.String({
      enum: ["thread", "setting"],
    }),
    inputValue: S.String({
      nullable: true,
    }),
    files: S.String({ nullable: true }),
    threadId: S.String({
      nullable: true,
    }),
    order: S.Number({ default: 0 }),
  }),
  relationships: {
    threads: S.RelationById("threads", "$threadId"),
  },
};
