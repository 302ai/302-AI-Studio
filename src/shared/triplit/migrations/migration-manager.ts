/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import type { TriplitClient } from "@triplit/client";

import type { BaseMigration } from "./base-migration";
import {
  type IMigrationStore,
  type MigrationContext,
  type MigrationRecord,
  MigrationStatus,
  type MigrationVersion,
} from "./types";

export interface MigrationManagerConfig {
  autoRun: boolean;
  timeout: number;
  continueOnError: boolean;
  logger?: Console | any;
}

export interface MigrationResult {
  success: boolean;
  executedCount: number;
  failures: Array<{
    version: MigrationVersion;
    error: string;
  }>;
  duration: number;
}

export class MigrationManager {
  private migrations: Map<MigrationVersion, BaseMigration> = new Map();
  private config: MigrationManagerConfig;
  private migrationStore: IMigrationStore;
  private logger: Console | any;

  constructor(
    migrationStore: IMigrationStore,
    config: Partial<MigrationManagerConfig> = {},
  ) {
    this.migrationStore = migrationStore;
    this.config = {
      autoRun: true,
      timeout: 300000, // 5分钟
      continueOnError: false,
      logger: console,
      ...config,
    };
    this.logger = this.config.logger || console;
  }

  registerMigration(migration: BaseMigration): void {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration ${migration.version} is already registered`);
    }

    this.migrations.set(migration.version, migration);
    this.logger.debug(
      `Registered migration: ${migration.version} - ${migration.description}`,
    );
  }

  registerMigrations(migrations: BaseMigration[]): void {
    for (const migration of migrations) {
      this.registerMigration(migration);
    }
  }

  async runMigrations(
    client: TriplitClient<any>,
    schema: any,
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      executedCount: 0,
      failures: [],
      duration: 0,
    };

    try {
      this.logger.info("Starting migration process...");

      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        this.logger.info("No pending migrations found");
        return result;
      }

      this.logger.info(`Found ${pendingMigrations.length} pending migrations`);

      const sortedMigrations = this.sortMigrationsByVersion(pendingMigrations);

      for (const migration of sortedMigrations) {
        try {
          await this.executeMigration(migration, client, schema);
          result.executedCount++;
          this.logger.info(
            `Migration ${migration.version} completed successfully`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.failures.push({
            version: migration.version,
            error: errorMessage,
          });

          this.logger.error(
            `Migration ${migration.version} failed:`,
            errorMessage,
          );

          await this.migrationStore.updateMigration(migration.version, {
            status: MigrationStatus.FAILED,
            error: errorMessage,
            completedAt: new Date(),
          });

          if (!this.config.continueOnError) {
            result.success = false;
            break;
          }
        }
      }

      result.success = result.failures.length === 0;
      result.duration = Date.now() - startTime;

      if (result.success) {
        this.logger.info(
          `All migrations completed successfully in ${result.duration}ms`,
        );
      } else {
        this.logger.warn(
          `Migration process completed with ${result.failures.length} failures`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error("Migration process failed:", errorMessage);

      result.success = false;
      result.duration = Date.now() - startTime;

      return result;
    }
  }

  private async getPendingMigrations(): Promise<BaseMigration[]> {
    const completedVersions = await (
      this.migrationStore as any
    ).getCompletedMigrations();

    const pendingMigrations: BaseMigration[] = [];

    for (const [version, migration] of this.migrations) {
      if (!completedVersions.includes(version)) {
        pendingMigrations.push(migration);
      }
    }

    return pendingMigrations;
  }

  private sortMigrationsByVersion(
    migrations: BaseMigration[],
  ): BaseMigration[] {
    return migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  private async executeMigration(
    migration: BaseMigration,
    client: TriplitClient<any>,
    schema: any,
  ): Promise<void> {
    const context: MigrationContext = {
      client,
      schema,
      migrationStore: this.migrationStore,
      logger: this.logger,
    };

    const canExecute = await migration.canExecute(context);
    if (!canExecute) {
      throw new Error(
        `Migration ${migration.version} dependencies not satisfied`,
      );
    }

    const migrationRecord: MigrationRecord = {
      version: migration.version,
      status: MigrationStatus.IN_PROGRESS,
      startedAt: new Date(),
    };

    await this.migrationStore.saveMigration(migrationRecord);

    try {
      await this.executeWithTimeout(migration.up(context), this.config.timeout);

      await this.migrationStore.updateMigration(migration.version, {
        status: MigrationStatus.COMPLETED,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.migrationStore.updateMigration(migration.version, {
        status: MigrationStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  async getMigrationStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
  }> {
    const completedMigrations = await (
      this.migrationStore as any
    ).getCompletedMigrations();
    const failedMigrations = await (
      this.migrationStore as any
    ).getFailedMigrations();

    return {
      total: this.migrations.size,
      completed: completedMigrations.length,
      failed: failedMigrations.length,
      pending:
        this.migrations.size -
        completedMigrations.length -
        failedMigrations.length,
    };
  }
}
