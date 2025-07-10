import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type { ShortcutAction, ShortcutScope } from "@shared/triplit/types";
import { globalShortcut } from "electron";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import type { ShortcutsDbService } from "./db-service/shortcuts-db-service";
import { EventNames, sendToRenderer } from "./event-service";

export interface ShortcutRegistration {
  action: ShortcutAction;
  keys: string[];
  accelerator: string;
  scope: ShortcutScope;
}

@injectable()
@ServiceRegister(TYPES.ShortcutsService)
export class ShortcutsService {
  private registeredShortcuts = new Map<ShortcutAction, string>();

  constructor(
    @inject(TYPES.ShortcutsDbService)
    private shortcutsDbService: ShortcutsDbService,
  ) {
    this.initializeGlobalShortcuts();
  }

  private async initializeGlobalShortcuts(): Promise<void> {
    try {
      this.clearGlobalShortcuts();

      const shortcuts = await this.shortcutsDbService.getShortcuts();

      for (const shortcut of shortcuts) {
        if (shortcut.scope === "global") {
          await this.registerGlobalShortcut(shortcut.action, shortcut.keys);
        }
      }

      logger.info("Shortcuts initialized", { count: shortcuts.length });
    } catch (error) {
      logger.error("ShortcutsService:initializeShortcuts error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async updateShortcut(
    _event: Electron.IpcMainEvent,
    action: ShortcutAction,
    keys: string[],
    scope: ShortcutScope,
  ): Promise<void> {
    try {
      const oldAccelerator = this.registeredShortcuts.get(action);
      if (oldAccelerator) {
        globalShortcut.unregister(oldAccelerator);
        this.registeredShortcuts.delete(action);
      }

      if (scope === "global") {
        await this.registerGlobalShortcut(action, keys);
      }

      await this.shortcutsDbService.updateShortcut(action, keys, scope);

      logger.info("Shortcut updated", { action, keys, scope });
    } catch (error) {
      logger.error("ShortcutsService:updateShortcut error", {
        error,
        action,
        keys,
        scope,
      });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getShortcuts(
    _event: Electron.IpcMainEvent,
  ): Promise<ShortcutRegistration[]> {
    try {
      const shortcuts = await this.shortcutsDbService.getShortcuts();
      return shortcuts.map((shortcut) => ({
        action: shortcut.action,
        keys: Array.from(shortcut.keys),
        accelerator: this.keysToAccelerator(Array.from(shortcut.keys)),
        scope: shortcut.scope,
      }));
    } catch (error) {
      logger.error("ShortcutsService:getShortcuts error", { error });
      throw error;
    }
  }

  private async registerGlobalShortcut(
    action: ShortcutAction,
    keys: string[] | Set<string>,
  ): Promise<void> {
    const keysArray = Array.isArray(keys) ? keys : Array.from(keys);
    const accelerator = this.keysToAccelerator(keysArray);

    try {
      const success = globalShortcut.register(accelerator, () => {
        this.handleShortcutTriggered(action);
      });

      if (success) {
        this.registeredShortcuts.set(action, accelerator);
        logger.debug("Global shortcut registered", { action, accelerator });
      } else {
        logger.warn("Failed to register global shortcut", {
          action,
          accelerator,
        });
      }
    } catch (error) {
      logger.error("Error registering global shortcut", {
        error,
        action,
        accelerator,
      });
    }
  }

  private handleShortcutTriggered(action: ShortcutAction): void {
    logger.debug("Shortcut triggered", { action });

    // Send event to renderer process
    sendToRenderer(EventNames.SHORTCUT_TRIGGERED, { action });
  }

  private keysToAccelerator(keys: string[]): string {
    return keys
      .map((key) => {
        switch (key.toLowerCase()) {
          case "cmd":
          case "meta":
            return "CommandOrControl";
          case "ctrl":
          case "control":
            return "CommandOrControl";
          case "shift":
            return "Shift";
          case "alt":
            return "Alt";
          case "enter":
            return "Return";
          case "backspace":
            return "Backspace";
          case "space":
            return "Space";
          case "tab":
            return "Tab";
          case "escape":
          case "esc":
            return "Escape";
          default:
            return key.toUpperCase();
        }
      })
      .join("+");
  }

  private clearGlobalShortcuts(): void {
    for (const accelerator of this.registeredShortcuts.values()) {
      globalShortcut.unregister(accelerator);
    }
    this.registeredShortcuts.clear();
    logger.debug("All global shortcuts cleared");
  }

  public cleanup(): void {
    this.clearGlobalShortcuts();
    logger.info("ShortcutsService cleanup completed");
  }
}
