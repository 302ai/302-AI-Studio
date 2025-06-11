import { ConfigService } from "./config-service";
import { FilePreviewService } from "./file-preview-service";
import { ProviderService } from "./provider-service";
import { ThreadService } from "./thread-service";
import { TriplitService } from './triplit-service';
import { WindowService } from "./window-service";

export const services = [
  WindowService,
  TriplitService,
  ConfigService,
  ThreadService,
  ProviderService,
  FilePreviewService,
];
