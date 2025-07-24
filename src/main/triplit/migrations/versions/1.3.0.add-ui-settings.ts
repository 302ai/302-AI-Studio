/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import { FieldMigration } from "@shared/triplit/migrations/base-migration";
import type {
  CollectionMigrationConfig,
  DataFillFunction,
  MigrationContext,
} from "@shared/triplit/migrations/types";

export class AddUISettingsMigration extends FieldMigration {
  public readonly version = "1.3.0";
  public readonly description = "Add UI settings (collapseCodeBlock and hideReason) to settings collection";
  public readonly dependencies: string[] = [];

  private fillUISettings: DataFillFunction = async (
    _client,
    entity,
    context,
  ) => {
    const { logger } = context;

    // Set default values for UI settings
    const collapseCodeBlock = false;  // Default to not collapsed
    const hideReason = false;         // Default to show reason

    logger.debug(`Setting default UI settings for settings entity ${entity.id}`);

    return {
      collapseCodeBlock,
      hideReason,
    };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "settings",
        fields: [
          {
            fieldName: "collapseCodeBlock",
            fillFunction: this.fillUISettings,
          },
          {
            fieldName: "hideReason", 
            fillFunction: this.fillUISettings,
          },
        ],
        customMigration: async (context: MigrationContext) => {
          const { logger } = context;
          logger.info("Running custom migration logic for UI settings");
          logger.info("Code blocks will not be collapsed by default and reason will be shown");
        },
      },
    ];
  }
}
