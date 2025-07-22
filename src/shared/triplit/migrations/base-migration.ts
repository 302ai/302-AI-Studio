/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import type {
  CollectionMigrationConfig,
  MigrationContext,
  MigrationVersion,
} from "./types";
import { MigrationStatus } from "./types";

export abstract class BaseMigration {
  public abstract readonly version: MigrationVersion;
  public abstract readonly description: string;
  public abstract readonly dependencies: MigrationVersion[];

  public abstract up(context: MigrationContext): Promise<void>;

  public async canExecute(context: MigrationContext): Promise<boolean> {
    for (const dep of this.dependencies) {
      const depRecord = await context.migrationStore.getMigration(dep);
      if (!depRecord || depRecord.status !== MigrationStatus.COMPLETED) {
        context.logger.warn(
          `Migration ${this.version}: dependency ${dep} not completed`,
        );
        return false;
      }
    }
    return true;
  }

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [];
  }

  protected async executeCollectionMigration(
    context: MigrationContext,
    config: CollectionMigrationConfig,
  ): Promise<void> {
    const { logger } = context;
    const { collectionName, fields, customMigration } = config;

    logger.info(`Migrating collection: ${collectionName}`);

    for (const fieldConfig of fields) {
      await this.executeFieldMigration(context, collectionName, fieldConfig);
    }

    if (customMigration) {
      logger.info(
        `Executing custom migration for collection: ${collectionName}`,
      );
      await customMigration(context);
    }
  }

  private async executeFieldMigration(
    context: MigrationContext,
    collectionName: string,
    fieldConfig: any,
  ): Promise<void> {
    const { client, logger } = context;
    const { fieldName, fillFunction } = fieldConfig;

    if (!fillFunction) return;

    logger.info(`Migrating field: ${collectionName}.${fieldName}`);

    try {
      const query = client.query(collectionName);
      const result = await client.fetch(query);

      logger.debug(
        `Query result type: ${typeof result}, is Map: ${result instanceof Map}, is Array: ${Array.isArray(result)}`,
      );
      logger.debug(`Query result:`, result);

      let entities: [string, any][] = [];

      if (result instanceof Map) {
        entities = Array.from(result.entries()).map(([key, value]) => [
          String(key),
          value,
        ]);
      } else if (Array.isArray(result)) {
        entities = result.map((entity) => [String(entity.id), entity]);
      } else if (result && typeof result === "object") {
        entities = Object.entries(result).map(([key, value]) => [
          String(key),
          value,
        ]);
      } else {
        logger.warn(
          `Unexpected result type for collection ${collectionName}:`,
          typeof result,
        );
        return;
      }

      logger.info(
        `Found ${entities.length} entities to migrate in ${collectionName}`,
      );

      for (const [id, entity] of entities) {
        try {
          const updates = await fillFunction(client, entity, context);

          if (updates && Object.keys(updates).length > 0) {
            await client.update(collectionName, id, (e: any) => {
              Object.assign(e, updates);
            });
            logger.debug(`Updated entity ${id} in ${collectionName}`);
          }
        } catch (error) {
          logger.error(
            `Failed to migrate entity ${id} in ${collectionName}:`,
            error,
          );
          throw error;
        }
      }

      logger.info(`Completed field migration: ${collectionName}.${fieldName}`);
    } catch (error) {
      logger.error(
        `Failed to migrate field ${collectionName}.${fieldName}:`,
        error,
      );
      throw error;
    }
  }
}

export abstract class FieldMigration extends BaseMigration {
  protected abstract getMigrationConfig(): CollectionMigrationConfig[];

  public async up(context: MigrationContext): Promise<void> {
    const configs = this.getMigrationConfig();

    for (const config of configs) {
      await this.executeCollectionMigration(context, config);
    }
  }
}
