import { ConfigService } from "./config-service";
import { ProviderService } from "./provider-service";
import { ThreadsService } from "./threads-service";
import { WindowService } from "./window-service";

export const services = [
  WindowService,
  ConfigService,
  ThreadsService,
  ProviderService,
];
