/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */

import {
  type IMigrationStore,
  type MigrationRecord,
  MigrationStatus,
  type MigrationVersion,
} from "@shared/triplit/migrations/types";
import Store from "electron-store";

interface MigrationStoreData {
  migrations: Record<MigrationVersion, MigrationRecord>;
}

export class MainMigrationStore implements IMigrationStore {
  private store: Store<MigrationStoreData>;

  constructor(storeName = "triplit-migrations") {
    this.store = new Store<MigrationStoreData>({
      name: storeName,
      defaults: {
        migrations: {},
      },
    });
  }

  async getAllMigrations(): Promise<MigrationRecord[]> {
    const migrations = this.store.get("migrations", {});
    return Object.values(migrations);
  }

  async getMigration(
    version: MigrationVersion,
  ): Promise<MigrationRecord | null> {
    const migrations = this.store.get("migrations", {});
    return migrations[version] || null;
  }

  async saveMigration(record: MigrationRecord): Promise<void> {
    const migrations = this.store.get("migrations", {});
    migrations[record.version] = record;
    this.store.set("migrations", migrations);
  }

  async updateMigration(
    version: MigrationVersion,
    updates: Partial<MigrationRecord>,
  ): Promise<void> {
    const migrations = this.store.get("migrations", {});

    if (migrations[version]) {
      migrations[version] = { ...migrations[version], ...updates };
      this.store.set("migrations", migrations);
    } else {
      throw new Error(`Migration record for version ${version} not found`);
    }
  }

  async deleteMigration(version: MigrationVersion): Promise<void> {
    const migrations = this.store.get("migrations", {});
    delete migrations[version];
    this.store.set("migrations", migrations);
  }

  async getCompletedMigrations(): Promise<MigrationVersion[]> {
    const migrations = this.store.get("migrations", {});
    return Object.values(migrations)
      .filter((migration) => migration.status === MigrationStatus.COMPLETED)
      .map((migration) => migration.version)
      .sort();
  }

  async getFailedMigrations(): Promise<MigrationVersion[]> {
    const migrations = this.store.get("migrations", {});
    return Object.values(migrations)
      .filter((migration) => migration.status === MigrationStatus.FAILED)
      .map((migration) => migration.version)
      .sort();
  }

  async clearAllMigrations(): Promise<void> {
    this.store.set("migrations", {});
  }

  async exportMigrationData(): Promise<MigrationStoreData> {
    return {
      migrations: this.store.get("migrations", {}),
    };
  }

  async importMigrationData(data: MigrationStoreData): Promise<void> {
    this.store.set("migrations", data.migrations);
  }

  getStorePath(): string {
    return this.store.path;
  }
}
