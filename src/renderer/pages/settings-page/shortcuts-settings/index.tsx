import { ShortcutRecorder } from "@renderer/components/business/shortcut-recorder";
import { Label } from "@renderer/components/ui/field";
import { Select } from "@renderer/components/ui/select";
import { formatShortcutLabel } from "@renderer/config/constant";
import { useShortcuts } from "@renderer/hooks/use-shortcuts";
import { cn } from "@renderer/lib/utils";

import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_MODES,
  SHORTCUT_OPTIONS,
  type ShortcutOption,
} from "@shared/constants";
import type { ShortcutAction, ShortcutScope } from "@shared/triplit/types";
import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

interface ShortcutSetting {
  id: string;
  action: ShortcutAction;
  keys: string[];
  scope: ShortcutScope;
  mode: "preset" | "record" | "display";
  options: ShortcutOption[];
  hint?: string;
  isGroup?: boolean;
  groupedShortcuts?: ShortcutSetting[];
}

export function ShortcutsSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.shortcuts-settings",
  });
  const { updateShortcut, allShortcuts } = useShortcuts();
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(
    null,
  );

  const getSelectedOptionId = (
    shortcut: ShortcutSetting,
  ): string | undefined => {
    const currentKeys = shortcut.keys;
    const matchingOption = shortcut.options.find((opt) => {
      const optionKeysStr = opt.keys.slice().sort().join(",");
      const currentKeysStr = currentKeys.slice().sort().join(",");

      return optionKeysStr === currentKeysStr;
    });

    return matchingOption?.id;
  };

  const shortcutSettings = useMemo((): ShortcutSetting[] => {
    const shortcutHints: Record<ShortcutAction, string> = {
      "send-message": t("hints.send-message"),
      "new-chat": t("hints.new-chat"),
      "clear-messages": t("hints.clear-messages"),
      "close-current-tab": t("hints.close-current-tab"),
      "close-other-tabs": t("hints.close-other-tabs"),
      "delete-current-thread": t("hints.delete-current-thread"),
      "open-settings": t("hints.open-settings"),
      "toggle-sidebar": t("hints.toggle-sidebar"),
      // "quick-navigation": t("hints.quick-navigation"),
      // "command-palette": t("hints.command-palette"),
      "stop-generation": t("hints.stop-generation"),
      "new-tab": t("hints.new-tab"),
      // "new-session": t("hints.new-session"),
      "regenerate-response": t("hints.regenerate-response"),
      search: t("hints.search"),
      "create-branch": t("hints.create-branch"),
      "restore-last-tab": t("hints.restore-last-tab"),
      screenshot: t("hints.screenshot"),
      "next-tab": t("hints.next-tab"),
      "previous-tab": t("hints.previous-tab"),
      "toggle-model-panel": t("hints.toggle-model-panel"),
      "toggle-incognito-mode": t("hints.toggle-incognito-mode"),
      "branch-and-send": t("hints.branch-and-send"),
      "switch-to-tab-1": t("hints.switch-to-tab-1"),
      "switch-to-tab-2": t("hints.switch-to-tab-2"),
      "switch-to-tab-3": t("hints.switch-to-tab-3"),
      "switch-to-tab-4": t("hints.switch-to-tab-4"),
      "switch-to-tab-5": t("hints.switch-to-tab-5"),
      "switch-to-tab-6": t("hints.switch-to-tab-6"),
      "switch-to-tab-7": t("hints.switch-to-tab-7"),
      "switch-to-tab-8": t("hints.switch-to-tab-8"),
      "switch-to-tab-9": t("hints.switch-to-tab-9"),
    };

    const allSettings = (allShortcuts || []).map((shortcut) => ({
      id: shortcut.id,
      action: shortcut.action,
      keys: Array.from(shortcut.keys),
      scope: shortcut.scope,
      mode: SHORTCUT_MODES[shortcut.action],
      options: SHORTCUT_OPTIONS[shortcut.action],
      hint: shortcutHints[shortcut.action],
    }));

    // Group tab switching shortcuts
    const tabSwitchActions = [
      "switch-to-tab-1",
      "switch-to-tab-2",
      "switch-to-tab-3",
      "switch-to-tab-4",
      "switch-to-tab-5",
      "switch-to-tab-6",
      "switch-to-tab-7",
      "switch-to-tab-8",
      "switch-to-tab-9",
    ];

    const tabSwitchSettings = allSettings.filter((setting) =>
      tabSwitchActions.includes(setting.action),
    );

    const otherSettings = allSettings.filter(
      (setting) => !tabSwitchActions.includes(setting.action),
    );

    // Create grouped tab switching display
    if (tabSwitchSettings.length > 0) {
      const groupedTabSwitch: ShortcutSetting = {
        id: "tab-switching-group",
        action: "switch-to-tab-1" as ShortcutAction, // Use first action as reference
        keys: [],
        scope: "app",
        mode: "display",
        options: [],
        hint: t("hints.tab-switching-group"),
        isGroup: true,
        groupedShortcuts: tabSwitchSettings,
      };

      return [...otherSettings, groupedTabSwitch];
    }

    return otherSettings;
  }, [allShortcuts, t]);

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
    const defaultConfig = DEFAULT_SHORTCUTS.find((s) => s.action === action);
    if (defaultConfig) {
      await updateShortcut(action, Array.from(defaultConfig.keys));
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto px-4 py-[18px]">
      <div className="mx-auto flex flex-col gap-4">
        {shortcutSettings.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex min-w-[528px] max-w-[528px] flex-col"
          >
            <Label className="mb-2 text-label-fg">
              {shortcut.isGroup
                ? t("actions.tab-switching-group")
                : t(`actions.${shortcut.action}`)}
            </Label>

            {shortcut.isGroup ? (
              <div className="flex items-center gap-2">
                <div className="flex h-11 w-full flex-1 cursor-default items-center rounded-[10px] border border-input bg-setting px-3 py-1 text-setting-fg text-sm">
                  {(() => {
                    const firstTabShortcut = shortcut.groupedShortcuts?.[0];
                    if (firstTabShortcut && firstTabShortcut.keys.length > 0) {
                      const modifierKeys = firstTabShortcut.keys.filter(
                        (key) => !/^[1-9]$/.test(key),
                      );
                      if (modifierKeys.length > 0) {
                        const formattedBase = formatShortcutLabel(modifierKeys);
                        return `${formattedBase}+1~9`;
                      }
                    }
                    return "1~9";
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {shortcut.mode === "preset" ? (
                  <Select
                    className="flex-1"
                    selectedKey={getSelectedOptionId(shortcut)}
                    onSelectionChange={(optionId) =>
                      handleShortcutChange(shortcut.action, optionId as string)
                    }
                  >
                    <Select.Trigger className="inset-ring-transparent h-11 rounded-[10px] bg-setting text-setting-fg transition-none hover:inset-ring-transparent" />
                    <Select.List>
                      {shortcut.options.map((option) => (
                        <Select.Option
                          key={option.id}
                          id={option.id}
                          className={cn(
                            "flex cursor-pointer justify-between",
                            "[&>[data-slot='check-indicator']]:order-last [&>[data-slot='check-indicator']]:mr-0 [&>[data-slot='check-indicator']]:ml-auto",
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span>{formatShortcutLabel(option.keys)}</span>
                          </div>
                        </Select.Option>
                      ))}
                    </Select.List>
                  </Select>
                ) : shortcut.mode === "display" ? (
                  <div className="flex h-11 w-full flex-1 cursor-default items-center rounded-[10px] border border-input bg-setting px-3 py-1 text-setting-fg text-sm">
                    {shortcut.keys.length > 0
                      ? formatShortcutLabel(shortcut.keys)
                      : t("recorder.no-shortcut")}
                  </div>
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
                    allShortcuts={shortcutSettings.map((s) => ({
                      action: s.action,
                      keys: s.keys,
                    }))}
                    onReset={() => handleResetShortcut(shortcut.action)}
                    className="flex-1"
                  />
                )}
              </div>
            )}

            {shortcut.hint && (
              <p className="mt-1 text-left text-muted-fg text-xs">
                {shortcut.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
