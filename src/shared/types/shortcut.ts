import type { ShortcutAction, ShortcutScope } from "@shared/triplit/types";

export interface ShortcutRegistration {
  action: ShortcutAction;
  keys: string[];
  accelerator: string;
  scope: ShortcutScope;
}
