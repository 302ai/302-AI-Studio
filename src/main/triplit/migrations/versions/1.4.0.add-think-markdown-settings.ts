/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import { FieldMigration } from "@shared/triplit/migrations/base-migration";
import type {
  CollectionMigrationConfig,
  DataFillFunction,
  MigrationContext,
} from "@shared/triplit/migrations/types";

export class AddThinkMarkdownSettingsMigration extends FieldMigration {
  public readonly version = "1.4.0";
  public readonly description = "Add think block and markdown settings (collapseThinkBlock and disableMarkdown) to settings collection";
  public readonly dependencies: string[] = [];

  private fillThinkMarkdownSettings: DataFillFunction = async (
    _client,
    entity,
    context,
  ) => {
    const { logger } = context;

    // Set default values for think block and markdown settings
    const collapseThinkBlock = false;  // Default to not collapsed
    const disableMarkdown = false;     // Default to enable markdown

    logger.debug(`Setting default think block and markdown settings for settings entity ${entity.id}`);

    return {
      collapseThinkBlock,
      disableMarkdown,
    };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "settings",
        fields: [
          {
            fieldName: "collapseThinkBlock",
            fillFunction: this.fillThinkMarkdownSettings,
          },
          {
            fieldName: "disableMarkdown", 
            fillFunction: this.fillThinkMarkdownSettings,
          },
        ],
        customMigration: async (context: MigrationContext) => {
          const { logger } = context;
          logger.info("Running custom migration logic for think block and markdown settings");
          logger.info("Think blocks will not be collapsed by default and markdown will be enabled");
        },
      },
    ];
  }
}
