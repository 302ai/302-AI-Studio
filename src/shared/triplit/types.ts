import type { Entity } from "@triplit/client";
import type { Schema } from "./schema";

// * Providers
export type Provider = Entity<Schema, "providers">;
export type CreateProviderData = Omit<Provider, "id" | "order">;
export type UpdateProviderData = Partial<Omit<Provider, "id">>;

// * Models
export type Model = Entity<Schema, "models">;
export type CreateModelData = Omit<Model, "id" | "createdAt">;
export type UpdateModelData = Partial<Omit<Model, "id">>;

// * Tabs
export type Tab = Entity<Schema, "tabs">;
export type CreateTabData = Omit<Tab, "id" | "order">;
export type UpdateTabData = Partial<Omit<Tab, "id">>;

// * Threads
export type Thread = Entity<Schema, "threads">;
export type CreateThreadData = Omit<
  Thread,
  "id" | "createdAt" | "updatedAt" | "collected"
>;
export type UpdateThreadData = Partial<Omit<Thread, "id">>;

// * Messages
export type Message = Entity<Schema, "messages">;
export type CreateMessageData = Omit<Message, "id" | "createdAt">;
export type UpdateMessageData = Partial<Omit<Message, "id">>;

// * Attachments
export type Attachment = Entity<Schema, "attachments">;
export type CreateAttachmentData = Omit<Attachment, "id" | "createdAt">;
export type UpdateAttachmentData = Partial<Omit<Attachment, "id">>;

// * UI
export type Ui = Entity<Schema, "ui">;
export type Theme = "light" | "dark" | "system";
export type Language = "zh" | "en" | "ja";
