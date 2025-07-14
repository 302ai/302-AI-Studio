import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import { Select } from "@renderer/components/ui/select";
import { ShortcutRecorder } from "@renderer/components/ui/shortcut-recorder";
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
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

interface ShortcutSetting {
  id: string;
  action: ShortcutAction;
  keys: string[];
  scope: ShortcutScope;
  mode: "preset" | "record";
  options: ShortcutOption[];
  hint?: string;
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
    };

    return (allShortcuts || []).map((shortcut) => ({
      id: shortcut.id,
      action: shortcut.action,
      keys: Array.from(shortcut.keys),
      scope: shortcut.scope,
      mode: SHORTCUT_MODES[shortcut.action],
      options: SHORTCUT_OPTIONS[shortcut.action],
      hint: shortcutHints[shortcut.action],
    }));
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
    <div className="flex h-full flex-col gap-4 overflow-hidden py-[18px]">
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
                    selectedKey={getSelectedOptionId(shortcut)}
                    onSelectionChange={(optionId) =>
                      handleShortcutChange(shortcut.action, optionId as string)
                    }
                  >
                    <Select.Trigger />
                    <Select.List popover={{ className: "min-w-md" }}>
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
