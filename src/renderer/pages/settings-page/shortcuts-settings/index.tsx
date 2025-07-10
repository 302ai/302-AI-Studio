import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { ShortcutRecorder } from "@renderer/components/ui/shortcut-recorder";
import { useShortcuts } from "@renderer/hooks/use-shortcuts";
import type { ShortcutAction } from "@shared/triplit/types";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  "close-current-tab": "record",
  "close-other-tabs": "record",
  "delete-current-thread": "record",
  "open-settings": "record",
  "toggle-sidebar": "record",
};

const DEFAULT_SHORTCUTS: Record<ShortcutAction, string[]> = {
  "send-message": ["Enter"],
  "new-chat": ["Cmd", "N"],
  "clear-messages": ["Cmd", "L"],
  "close-current-tab": ["Cmd", "Shift", "W"],
  "close-other-tabs": ["Cmd", "W"],
  "delete-current-thread": ["Cmd", "Backspace"],
  "open-settings": ["Cmd", ","],
  "toggle-sidebar": ["Cmd", "B"],
};

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
  "close-current-tab": [],
  "close-other-tabs": [],
  "delete-current-thread": [],
  "open-settings": [],
  "toggle-sidebar": [],
};

export function ShortcutsSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.shortcuts-settings",
  });
  const { initializeShortcuts, updateShortcut, shortcuts } = useShortcuts();
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(
    null,
  );

  useEffect(() => {
    initializeShortcuts();
  }, [initializeShortcuts]);

  const shortcutSettings = useMemo((): ShortcutSetting[] => {
    if (!shortcuts) return [];

    const shortcutsArray = Array.from(shortcuts.values());
    const config: Record<string, { keys: string[] }> = {
      "send-message": { keys: ["Enter"] },
      "new-chat": { keys: ["Cmd", "N"] },
      "clear-messages": { keys: ["Cmd", "L"] },
      "close-current-tab": { keys: ["Cmd", "Shift", "W"] },
      "close-other-tabs": { keys: ["Cmd", "W"] },
      "delete-current-thread": { keys: ["Cmd", "Backspace"] },
      "open-settings": { keys: ["Cmd", ","] },
      "toggle-sidebar": { keys: ["Cmd", "B"] },
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

    const shortcutHints: Record<ShortcutAction, string> = {
      "send-message": t("hints.send-message"),
      "new-chat": t("hints.new-chat"),
      "clear-messages": t("hints.clear-messages"),
      "close-current-tab": t("hints.close-current-tab"),
      "close-other-tabs": t("hints.close-other-tabs"),
      "delete-current-thread": t("hints.delete-current-thread"),
      "open-settings": t("hints.open-settings"),
      "toggle-sidebar": t("hints.toggle-sidebar"),
    };

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

  const handleRecordingChange = (
    action: ShortcutAction,
    isRecording: boolean,
  ) => {
    setRecordingAction(isRecording ? action : null);
  };

  const handleResetShortcut = async (action: ShortcutAction) => {
    const defaultKeys = DEFAULT_SHORTCUTS[action];
    await updateShortcut(action, defaultKeys);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex flex-1 justify-center overflow-y-auto pr-2">
        <div className="w-full max-w-md space-y-6">
          {shortcutSettings.map((shortcut) => (
            <div key={shortcut.id} className="flex flex-col gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">
                    {t(`actions.${shortcut.action}`)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {shortcut.mode === "preset" ? (
                  <Select
                    className="flex-1"
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
                    <SelectList popoverClassName="min-w-md">
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
                    onRecordingChange={(isRecording) =>
                      handleRecordingChange(shortcut.action, isRecording)
                    }
                    disabled={
                      recordingAction !== null &&
                      recordingAction !== shortcut.action
                    }
                    className="flex-1"
                  />
                )}

                <ButtonWithTooltip
                  type="button"
                  intent="outline"
                  size="small"
                  onClick={() => handleResetShortcut(shortcut.action)}
                  className="h-9 px-2"
                  title={t("recorder.reset")}
                >
                  <RefreshCw className="h-4 w-4" />
                </ButtonWithTooltip>
              </div>

              {shortcut.hint && (
                <p className="mt-1 text-left text-muted-fg text-xs">
                  {shortcut.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
