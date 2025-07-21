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
export type SearchServices = "search1api" | "tavily" | "exa" | "bochaai";

// * Settings
export type Settings = Entity<Schema, "settings">;
export type CreateSettingsData = Omit<Settings, "id" | "createdAt">;
export type UpdateSettingsData = Partial<Omit<Settings, "id">>;

// * Shortcuts
export type Shortcut = Entity<Schema, "shortcuts">;
export type CreateShortcutData = Omit<
  Shortcut,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateShortcutData = Partial<
  Omit<Shortcut, "id" | "createdAt" | "updatedAt">
>;
export type ShortcutAction =
  | "send-message"
  | "new-chat"
  | "clear-messages"
  | "close-current-tab"
  | "close-other-tabs"
  | "delete-current-thread"
  | "open-settings"
  | "toggle-sidebar"
  // | "quick-navigation"
  // | "command-palette"
  | "stop-generation"
  | "new-tab"
  //  | "new-session"
  | "regenerate-response"
  | "search"
  | "create-branch"
  | "restore-last-tab"
  | "screenshot"
  | "next-tab"
  | "previous-tab"
  | "toggle-model-panel"
  | "toggle-incognito-mode"
  | "branch-and-send"
  // Tab navigation (1-9)
  | "switch-to-tab-1"
  | "switch-to-tab-2"
  | "switch-to-tab-3"
  | "switch-to-tab-4"
  | "switch-to-tab-5"
  | "switch-to-tab-6"
  | "switch-to-tab-7"
  | "switch-to-tab-8"
  | "switch-to-tab-9";

export type ShortcutScope = "global" | "app";

// * Toolbox
export type Tool = Entity<Schema, "toolbox">;
export type CreateToolData = Omit<Tool, "id" | "createdAt">;
export type UpdateToolData = Partial<Omit<Tool, "id">>;
