import { ConfigService } from "./config-service";
import { FilePreviewService } from "./file-preview-service";
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
  UiService,
  TabService,
  ProviderService,
  FilePreviewService,
];
