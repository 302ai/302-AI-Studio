import { Schema as S } from "@triplit/client";

export const tabsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    title: S.String(),
    type: S.String({
      enum: ["thread", "setting"],
    }),
    threadId: S.String({
      nullable: true,
    }),
  }),
  relationships: {
    threads: S.RelationById("threads", "$threadId"),
  },
};