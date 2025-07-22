/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import { FieldMigration } from "@shared/triplit/migrations/base-migration";
import type {
  CollectionMigrationConfig,
  DataFillFunction,
  MigrationContext,
} from "@shared/triplit/migrations/types";

export class AddMessagePriorityMigration extends FieldMigration {
  public readonly version = "1.1.0";
  public readonly description = "Add priority field to messages collection";
  public readonly dependencies: string[] = [];

  private fillMessagePriority: DataFillFunction = async (
    _client,
    entity,
    context,
  ) => {
    const { logger } = context;

    let priority = "normal";

    if (entity.content) {
      const content = entity.content.toLowerCase();

      const urgentKeywords = [
        "urgent",
        "asap",
        "emergency",
        "critical",
        "紧急",
        "急",
        "重要",
      ];
      const lowKeywords = ["fyi", "note", "reminder", "信息", "备注"];

      if (urgentKeywords.some((keyword) => content.includes(keyword))) {
        priority = "high";
      } else if (lowKeywords.some((keyword) => content.includes(keyword))) {
        priority = "low";
      }
    }

    logger.debug(`Setting priority "${priority}" for message ${entity.id}`);

    return {
      priority,
    };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "messages",
        fields: [
          {
            fieldName: "priority",
            fillFunction: this.fillMessagePriority,
          },
        ],
        customMigration: async (context: MigrationContext) => {
          const { logger } = context;
          logger.info("Running custom migration logic for messages priority");
        },
      },
    ];
  }
}
