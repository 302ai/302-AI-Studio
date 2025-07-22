/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import { FieldMigration } from "@shared/triplit/migrations/base-migration";
import type {
  CollectionMigrationConfig,
  DataFillFunction,
  MigrationContext,
} from "@shared/triplit/migrations/types";

export class AddStreamSettingsMigration extends FieldMigration {
  public readonly version = "1.2.0";
  public readonly description = "Add stream smoother settings to settings collection";
  public readonly dependencies: string[] = [];

  private fillStreamSettings: DataFillFunction = async (
    _client,
    entity,
    context,
  ) => {
    const { logger } = context;

    // Set default values for stream settings
    const streamSmootherEnabled = true;  // Default to enabled
    const streamSpeed = "normal";        // Default to normal speed

    logger.debug(`Setting default stream settings for settings entity ${entity.id}`);

    return {
      streamSmootherEnabled,
      streamSpeed,
    };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "settings",
        fields: [
          {
            fieldName: "streamSmootherEnabled",
            fillFunction: this.fillStreamSettings,
          },
          {
            fieldName: "streamSpeed", 
            fillFunction: this.fillStreamSettings,
          },
        ],
        customMigration: async (context: MigrationContext) => {
          const { logger } = context;
          logger.info("Running custom migration logic for stream settings");
          logger.info("Stream smoother will be enabled by default with normal speed");
        },
      },
    ];
  }
}