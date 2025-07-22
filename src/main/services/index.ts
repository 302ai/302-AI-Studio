import { AttachmentService } from "./attachment-service";
import { ChatService } from "./chat-service";
import { ConfigService } from "./config-service";
import { FileParseService } from "./file-service/file-parse-service";
import { FilePreviewService } from "./file-service/file-preview-service/index";
import { MessageService } from "./message-service";
import { ModelService } from "./model-service";
import { ProviderService } from "./provider-service";
import { SettingsService } from "./settings-service";
import { ShellService } from "./shell-service";
import { ShortcutsService } from "./shortcuts-service";
import { TabService } from "./tab-service";
import { ThreadService } from "./thread-service";
import { ToolboxService } from "./toolbox-service";
import { TriplitService } from "./triplit-service";
import { UiService } from "./ui-service";
import { UpdaterService } from "./updater-service";
import { WindowService } from "./window-service";

export const services = [
  SettingsService,
  WindowService,
  TriplitService,
  ConfigService,
  ThreadService,
  MessageService,
  AttachmentService,
  UiService,
  TabService,
  ChatService,
  ProviderService,
  ShortcutsService,
  FileParseService,
  FilePreviewService,
  ShellService,
  ModelService,
  UpdaterService,
  ToolboxService,
];
