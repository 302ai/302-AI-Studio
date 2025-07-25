import { Schema as S } from "@triplit/client";

export const tabsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    title: S.String(),
    type: S.String({
      enum: ["thread", "setting", "302ai-tool"],
    }),
    path: S.String({
      nullable: true,
    }),
    inputValue: S.String({
      nullable: true,
    }),
    files: S.String({ nullable: true }),
    threadId: S.String({
      nullable: true,
    }),
    order: S.Number({ default: 0 }),
    isPrivate: S.Boolean({ default: false }),
  }),
  relationships: {
    threads: S.RelationById("threads", "$threadId"),
  },
};
