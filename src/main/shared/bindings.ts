import { AttachmentService } from "@main/services/attachment-service";
import { ChatService } from "@main/services/chat-service";
import { ConfigService } from "@main/services/config-service";
import { AttachmentDbService } from "@main/services/db-service/attachment-db-service";
import { ConfigDbService } from "@main/services/db-service/config-db-service";
import { MessageDbService } from "@main/services/db-service/message-db-service";
import { ModelDbService } from "@main/services/db-service/model-db-service";
import { SettingsDbService } from "@main/services/db-service/settings-db-service";
import { TabDbService } from "@main/services/db-service/tab-db-service";
import { ThreadDbService } from "@main/services/db-service/thread-db-service";
import { UiDbService } from "@main/services/db-service/ui-db-service";
import { FileParseService } from "@main/services/file-service/file-parse-service";
import { FilePreviewService } from "@main/services/file-service/file-preview-service";
import { MessageService } from "@main/services/message-service";
import { ModelService } from "@main/services/model-service";
import { ProviderService } from "@main/services/provider-service";
import { SettingsService } from "@main/services/settings-service";
import { ShellService } from "@main/services/shell-service";
import { TabService } from "@main/services/tab-service";
import { ThreadService } from "@main/services/thread-service";
import { TriplitService } from "@main/services/triplit-service";
import { UiService } from "@main/services/ui-service";
import { WindowService } from "@main/services/window-service";
import { TYPES } from "@main/shared/types";
import { Container } from "inversify";

export const container = new Container();

export function initBindings() {
  // * Core Db Services
  container
    .bind<AttachmentDbService>(TYPES.AttachmentDbService)
    .to(AttachmentDbService)
    .inSingletonScope();
  container
    .bind<ConfigDbService>(TYPES.ConfigDbService)
    .to(ConfigDbService)
    .inSingletonScope();
  container
    .bind<MessageDbService>(TYPES.MessageDbService)
    .to(MessageDbService)
    .inSingletonScope();
  container
    .bind<TabDbService>(TYPES.TabDbService)
    .to(TabDbService)
    .inSingletonScope();
  container
    .bind<ThreadDbService>(TYPES.ThreadDbService)
    .to(ThreadDbService)
    .inSingletonScope();
  container
    .bind<UiDbService>(TYPES.UiDbService)
    .to(UiDbService)
    .inSingletonScope();
  container
    .bind<SettingsDbService>(TYPES.SettingsDbService)
    .to(SettingsDbService)
    .inSingletonScope();
  container
    .bind<ModelDbService>(TYPES.ModelDbService)
    .to(ModelDbService)
    .inSingletonScope();

  // * Business Services
  container
    .bind<WindowService>(TYPES.WindowService)
    .to(WindowService)
    .inSingletonScope();
  container
    .bind<TriplitService>(TYPES.TriplitService)
    .to(TriplitService)
    .inSingletonScope();
  container
    .bind<ConfigService>(TYPES.ConfigService)
    .to(ConfigService)
    .inSingletonScope();
  container
    .bind<SettingsService>(TYPES.SettingsService)
    .to(SettingsService)
    .inSingletonScope();
  container
    .bind<ThreadService>(TYPES.ThreadService)
    .to(ThreadService)
    .inSingletonScope();
  container
    .bind<MessageService>(TYPES.MessageService)
    .to(MessageService)
    .inSingletonScope();
  container
    .bind<AttachmentService>(TYPES.AttachmentService)
    .to(AttachmentService)
    .inSingletonScope();
  container.bind<UiService>(TYPES.UiService).to(UiService).inSingletonScope();
  container
    .bind<TabService>(TYPES.TabService)
    .to(TabService)
    .inSingletonScope();
  container
    .bind<ChatService>(TYPES.ChatService)
    .to(ChatService)
    .inSingletonScope();
  container
    .bind<ProviderService>(TYPES.ProviderService)
    .to(ProviderService)
    .inSingletonScope();
  container
    .bind<FileParseService>(TYPES.FileParseService)
    .to(FileParseService)
    .inSingletonScope();
  container
    .bind<FilePreviewService>(TYPES.FilePreviewService)
    .to(FilePreviewService)
    .inSingletonScope();
  container
    .bind<ShellService>(TYPES.ShellService)
    .to(ShellService)
    .inSingletonScope();
  container
    .bind<ModelService>(TYPES.ModelService)
    .to(ModelService)
    .inSingletonScope();
}
