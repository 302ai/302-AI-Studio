/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */

import type { MigrationManagerConfig } from "@shared/triplit/migrations/migration-manager";
import { MigrationManager } from "@shared/triplit/migrations/migration-manager";

import { MainMigrationStore } from "./main-migration-store";

export function createMainMigrationManager(
  config: Partial<MigrationManagerConfig> = {},
): MigrationManager {
  const store = new MainMigrationStore();
  return new MigrationManager(store, config);
}

export { MainMigrationStore };
export * from "@shared/triplit/migrations";
