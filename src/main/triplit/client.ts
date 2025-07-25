/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import logger from "@shared/logger/main-logger";
import { TriplitLogHandler } from "@shared/triplit/log-handler";
import { schema } from "@shared/triplit/schema";
import { TriplitClient } from "@triplit/client";
import { Logger } from "@triplit/logger";
import { createMainMigrationManager } from "./migrations";
import { AddStreamSettingsMigration } from "./migrations/versions/1.2.0.add-stream-settings";
import { AddUISettingsMigration } from "./migrations/versions/1.3.0.add-ui-settings";
import { AddThinkMarkdownSettingsMigration } from "./migrations/versions/1.4.0.add-think-markdown-settings";
import { AddModelSelectionSettingsMigration } from "./migrations/versions/1.5.0.add-model-selection-settings";

// Create custom logger instance for triplit
const triplitLogger = new Logger([new TriplitLogHandler(logger)]);

// Create migration manager for main process
const migrationManager = createMainMigrationManager({
  autoRun: true,
  timeout: 300000, // 5 minutes
  continueOnError: false,
  logger: logger,
});

// Register migrations
migrationManager.registerMigration(new AddStreamSettingsMigration());
migrationManager.registerMigration(new AddUISettingsMigration());
migrationManager.registerMigration(new AddThinkMarkdownSettingsMigration());
migrationManager.registerMigration(new AddModelSelectionSettingsMigration());

export const triplitClient = new TriplitClient({
  storage: "memory",
  schema,
  serverUrl: "http://localhost:9000", // * 在生产环境中使用本地起的服务器端口
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6InNlY3JldCIsIngtdHJpcGxpdC1wcm9qZWN0LWlkIjoiY2hhdC1hcHAtdHJpcGxpdCIsImlhdCI6MTc0OTgwMjQyOH0.ju3YiF8-SUmzl8CG8Pmtp_RAqkorOjr3jrW-NOGe2zc",
  autoConnect: false,
  logger: triplitLogger,
});

export const initTriplitClient = async () => {
  logger.info("TriplitClient: Initializing in main process");

  try {
    logger.info("Running database migrations...");
    const migrationResult = await migrationManager.runMigrations(
      triplitClient,
      schema,
    );

    if (migrationResult.success) {
      logger.info(
        `Migrations completed successfully. Executed ${migrationResult.executedCount} migrations in ${migrationResult.duration}ms`,
      );
    } else {
      logger.warn(
        `Migrations completed with errors. ${migrationResult.failures.length} migrations failed`,
      );
      for (const failure of migrationResult.failures) {
        logger.error(`Migration ${failure.version} failed: ${failure.error}`);
      }
    }

    const stats = await migrationManager.getMigrationStats();
    logger.info(
      `Migration status: ${stats.completed}/${stats.total} completed, ${stats.failed} failed, ${stats.pending} pending`,
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Failed to run migrations:", { error: errorMsg });
  }

  logger.info("TriplitClient: Initialized in main process");
  return triplitClient;
};

export { migrationManager };
