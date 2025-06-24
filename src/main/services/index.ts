import { AttachmentService } from "./attachment-service";
import { ChatService } from "./chat-service";
import { ConfigService } from "./config-service";
import { FileParseService } from "./file-service/file-parse-service";
import { FilePreviewService } from "./file-service/file-preview-service/index";
import { MessageService } from "./message-service";
import { ProviderService } from "./provider-service";
import { ShellService } from "./shell-service";
import { TabService } from "./tab-service";
import { ThreadService } from "./thread-service";
import { TriplitService } from "./triplit-service";
import { UiService } from "./ui-service";
import { WindowService } from "./window-service";

export const services = [
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
  FileParseService,
  FilePreviewService,
  ShellService,
];
