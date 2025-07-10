export const TYPES = {
  // * Core Db Services
  AttachmentDbService: Symbol.for("attachmentDbService"),
  ConfigDbService: Symbol.for("ConfigDbService"),
  MessageDbService: Symbol.for("MessageDbService"),
  TabDbService: Symbol.for("TabDbService"),
  ThreadDbService: Symbol.for("ThreadDbService"),
  UiDbService: Symbol.for("UiDbService"),
  SettingsDbService: Symbol.for("SettingsDbService"),
  ShortcutsDbService: Symbol.for("ShortcutsDbService"),

  // * Business Services
  ConfigService: Symbol.for("ConfigService"),
  ThreadService: Symbol.for("ThreadService"),
  MessageService: Symbol.for("MessageService"),
  AttachmentService: Symbol.for("AttachmentService"),
  UiService: Symbol.for("UiService"),
  TabService: Symbol.for("TabService"),
  ChatService: Symbol.for("ChatService"),
  ProviderService: Symbol.for("ProviderService"),
  ShortcutsService: Symbol.for("ShortcutsService"),

  // * Utility Services
  FileParseService: Symbol.for("FileParseService"),
  FilePreviewService: Symbol.for("FilePreviewService"),
  ShellService: Symbol.for("ShellService"),
  WindowService: Symbol.for("WindowService"),
  TriplitService: Symbol.for("TriplitService"),
  SettingsService: Symbol.for("SettingsService"),
} as const;
