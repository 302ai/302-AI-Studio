import { Schema as S } from "@triplit/client";

export const attachmentsSchema = {
  schema: S.Schema({
    id: S.Id({ format: "nanoid" }),
    messageId: S.String(),
    name: S.String(),
    size: S.Number(),
    type: S.String(),
    preview: S.String({ nullable: true }),
    fileData: S.String({ nullable: true }),
    fileContent: S.String({ nullable: true }),
    createdAt: S.Date({ default: S.Default.now() }),
  }),
  relationships: {
    message: S.RelationById("messages", "$messageId"),
  },
};
