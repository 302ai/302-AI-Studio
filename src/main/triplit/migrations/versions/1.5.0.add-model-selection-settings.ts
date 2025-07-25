/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import { FieldMigration } from "@shared/triplit/migrations/base-migration";
import type {
  CollectionMigrationConfig,
  DataFillFunction,
  MigrationContext,
} from "@shared/triplit/migrations/types";

export class AddModelSelectionSettingsMigration extends FieldMigration {
  public readonly version = "1.5.0";
  public readonly description = "Add model selection settings (newChatModelId and titleModelId) to settings collection";
  public readonly dependencies: string[] = [];

  private fillModelSelectionSettings: DataFillFunction = async (
    _client,
    entity,
    context,
  ) => {
    const { logger } = context;

    // Set default values for model selection settings
    const newChatModelId = "use-last-model";        // Default to use last used model
    const titleModelId = "use-current-chat-model";  // Default to use current chat model

    logger.debug(`Setting default model selection settings for settings entity ${entity.id}`);

    return {
      newChatModelId,
      titleModelId,
    };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "settings",
        fields: [
          {
            fieldName: "newChatModelId",
            fillFunction: this.fillModelSelectionSettings,
          },
          {
            fieldName: "titleModelId", 
            fillFunction: this.fillModelSelectionSettings,
          },
        ],
        customMigration: async (context: MigrationContext) => {
          const { logger } = context;
          logger.info("Running custom migration logic for model selection settings");
          logger.info("New chat will use last model by default and title generation will use current chat model");
        },
      },
    ];
  }
}
