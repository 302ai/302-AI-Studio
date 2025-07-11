import { triplitClient } from "@main/triplit/client";
import { DEFAULT_SHORTCUTS } from "@shared/constants";
import logger from "@shared/logger/main-logger";
import type {
  CreateShortcutData,
  Shortcut,
  ShortcutAction,
  ShortcutScope,
} from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class ShortcutsDbService extends BaseDbService {
  constructor() {
    super("shortcuts");
    this.initShortcuts();
  }

  private async initShortcuts() {
    const existingShortcuts = await this.getShortcuts();

    if (existingShortcuts.length === 0) {
      for (const shortcut of DEFAULT_SHORTCUTS) {
        await this.insertShortcut(shortcut);
      }
    }
  }

  async getShortcuts(): Promise<Shortcut[]> {
    try {
      const query = triplitClient.query("shortcuts");
      const shortcuts = await triplitClient.fetch(query);
      return shortcuts;
    } catch (error) {
      logger.error("ShortcutsDbService:getShortcuts error", { error });
      throw error;
    }
  }

  async updateShortcut(
    action: ShortcutAction,
    keys: string[],
    scope: ShortcutScope,
  ): Promise<void> {
    try {
      const query = triplitClient
        .query("shortcuts")
        .Where("action", "=", action);
      const existingShortcuts = await triplitClient.fetch(query);

      if (existingShortcuts.length === 0) {
        await triplitClient.insert("shortcuts", {
          order: 0,
          action,
          keys: new Set(keys),
          scope,
        });
        return;
      }
      const [first, ...duplicates] = existingShortcuts;

      await triplitClient.transact(async (tx) => {
        await tx.update("shortcuts", first.id, async (shortcut) => {
          shortcut.keys = new Set(keys);
          shortcut.scope = scope;
        });

        if (duplicates.length > 0) {
          await Promise.all(
            duplicates.map((shortcut) => tx.delete("shortcuts", shortcut.id)),
          );
        }
      });
    } catch (error) {
      logger.error("ShortcutsDbService:updateShortcut error", {
        error,
        action,
        keys,
        scope,
      });
      throw error;
    }
  }

  async insertShortcut(shortcut: CreateShortcutData): Promise<Shortcut> {
    try {
      const result = await triplitClient.insert("shortcuts", shortcut);
      return result;
    } catch (error) {
      logger.error("ShortcutsDbService:insertShortcut error", {
        error,
        shortcut,
      });
      throw error;
    }
  }
}
