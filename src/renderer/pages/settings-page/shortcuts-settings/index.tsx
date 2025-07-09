import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { ShortcutRecorder } from "@renderer/components/ui/shortcut-recorder";
import { useShortcuts } from "@renderer/hooks/use-shortcuts";
import type { ShortcutAction } from "@shared/triplit/types";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface ShortcutOption {
  id: string;
  label: string;
  keys: string[];
}

interface ShortcutSetting {
  id: string;
  action: ShortcutAction;
  keys: string[];
  options: ShortcutOption[];
  mode: "preset" | "record";
  hint?: string;
}

const SHORTCUT_MODES: Record<ShortcutAction, "preset" | "record"> = {
  "send-message": "preset",
  "new-chat": "preset",
  "clear-messages": "record",
  "close-all-tabs": "record",
};

const getShortcutHints = (
  t: (key: string) => string,
): Record<ShortcutAction, string> => ({
  "send-message": t("hints.send-message"),
  "new-chat": t("hints.new-chat"),
  "clear-messages": t("hints.clear-messages"),
  "close-all-tabs": t("hints.close-all-tabs"),
});

const SHORTCUT_OPTIONS: Record<ShortcutAction, ShortcutOption[]> = {
  "send-message": [
    { id: "enter", label: "Enter", keys: ["Enter"] },
    { id: "shift-enter", label: "Shift+Enter", keys: ["Shift", "Enter"] },
    {
      id: "cmd-enter",
      label: "Cmd+Enter/Ctrl+Enter",
      keys: ["Cmd", "Enter"],
    },
  ],
  "new-chat": [{ id: "cmd-n", label: "Cmd+N/Ctrl+N", keys: ["Cmd", "N"] }],
  "clear-messages": [],
  "close-all-tabs": [],
};

export function ShortcutsSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.shortcuts-settings",
  });
  const { initializeShortcuts, updateShortcut, shortcuts } = useShortcuts();

  useEffect(() => {
    initializeShortcuts();
  }, [initializeShortcuts]);

  const shortcutSettings = useMemo((): ShortcutSetting[] => {
    if (!shortcuts) return [];

    const shortcutsArray = Array.from(shortcuts.values());
    const config: Record<string, { keys: string[] }> = {
      "send-message": { keys: ["Enter"] },
      "new-chat": { keys: ["Cmd", "N"] },
      "clear-messages": { keys: [] },
      "close-all-tabs": { keys: [] },
    };

    const sortedShortcuts = shortcutsArray.sort((a, b) => {
      const aTime = a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
      const bTime = b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    const processedActions = new Set<string>();
    for (const shortcut of sortedShortcuts) {
      if (
        shortcut.action &&
        shortcut.keys &&
        !processedActions.has(shortcut.action)
      ) {
        config[shortcut.action] = {
          keys: Array.from(shortcut.keys),
        };
        processedActions.add(shortcut.action);
      }
    }

    const shortcutHints = getShortcutHints(t);

    return Object.entries(config).map(([action, shortcutConfig]) => ({
      id: action,
      action: action as ShortcutAction,
      keys: shortcutConfig.keys,
      options: SHORTCUT_OPTIONS[action as ShortcutAction] || [],
      mode: SHORTCUT_MODES[action as ShortcutAction],
      hint: shortcutHints[action as ShortcutAction],
    }));
  }, [shortcuts, t]);

  const handleShortcutChange = async (
    action: ShortcutAction,
    optionId: string,
  ) => {
    const options = SHORTCUT_OPTIONS[action];
    const selectedOption = options.find((opt) => opt.id === optionId);

    if (selectedOption) {
      await updateShortcut(action, selectedOption.keys);
    }
  };

  const handleRecordedShortcut = async (
    action: ShortcutAction,
    keys: string[],
  ) => {
    await updateShortcut(action, keys);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-6">
        {shortcutSettings.map((shortcut) => (
          <div key={shortcut.id} className="flex flex-col gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">
                  {t(`actions.${shortcut.action}`)}
                </span>
              </div>
            </div>

            {shortcut.mode === "preset" ? (
              <Select
                className="w-[240px]"
                selectedKey={
                  shortcut.options.find(
                    (opt) =>
                      JSON.stringify(opt.keys) ===
                      JSON.stringify(shortcut.keys),
                  )?.id
                }
                onSelectionChange={(optionId) =>
                  handleShortcutChange(shortcut.action, optionId as string)
                }
              >
                <SelectTrigger />
                <SelectList popoverClassName="min-w-[240px]">
                  {shortcut.options.map((option) => (
                    <SelectOption
                      key={option.id}
                      id={option.id}
                      className="flex cursor-pointer justify-between"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span>{option.label}</span>
                      </div>
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            ) : (
              <ShortcutRecorder
                value={shortcut.keys}
                onValueChange={(keys) =>
                  handleRecordedShortcut(shortcut.action, keys)
                }
                placeholder="Click to set shortcut"
                className="w-[240px]"
              />
            )}

            {shortcut.hint && (
              <p className="mt-1 text-muted-foreground text-xs">
                {shortcut.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
