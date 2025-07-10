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

      for (const shortcut of existingShortcuts) {
        await triplitClient.delete("shortcuts", shortcut.id);
      }

      await triplitClient.insert("shortcuts", {
        action,
        keys: new Set(keys),
        scope,
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
