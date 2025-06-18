import { ChatService } from "./chat-service";
import { ConfigService } from "./config-service";
import { FileService } from "./file-service/index";
import { MessageService } from "./message-service";
import { ProviderService } from "./provider-service";
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
  UiService,
  TabService,
  ChatService,
  ProviderService,
  FileService,
];
