import { ConfigService } from "./config-service";
import { ProviderService } from "./provider-service";
import { ThreadsService } from "./threads-service";
import { TriplitService } from './triplit-service';
import { WindowService } from "./window-service";

export const services = [
  WindowService,
  TriplitService,
  ConfigService,
  ThreadsService,
  ProviderService,
];
