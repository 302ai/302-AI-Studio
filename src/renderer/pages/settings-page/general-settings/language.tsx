import { triplitClient } from "@renderer/client";
import { Label } from "@renderer/components/ui/field";
import { Select } from "@renderer/components/ui/select";
import langs from "@renderer/i18n/langs";
import { cn } from "@renderer/lib/utils";
import type { Language } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";

const { configService } = window.service;

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const lang = settingsResult?.language ?? "zh";
  const currentLang = langs.find((l) => l.key === lang) ?? langs[0];

  const handleLanguageChange = async (key: Key | null) => {
    const newLang = key?.toString() ?? "";
    await Promise.all([
      configService.setAppLanguage(newLang as Language),
      i18n.changeLanguage(newLang),
    ]);
  };

  return (
    <div className="flex min-w-[398px] flex-col gap-2">
      <Label className="text-label-fg">
        {t("settings.general-settings.language.label")}
      </Label>
      <Select
        className="min-w-full"
        selectedKey={currentLang.key}
        onSelectionChange={handleLanguageChange}
        aria-label="Select language"
      >
        <Select.Trigger className="inset-ring-transparent h-11 rounded-[10px] bg-setting text-setting-fg transition-none hover:inset-ring-transparent" />
        <Select.List className="min-w-full" items={langs}>
          {({ key, prefix, nativeName }) => (
            <Select.Option
              className={cn(
                "flex cursor-pointer justify-between",
                "[&>[data-slot='check-indicator']]:order-last [&>[data-slot='check-indicator']]:mr-0 [&>[data-slot='check-indicator']]:ml-auto",
              )}
              key={key}
              id={key}
              textValue={nativeName}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{prefix}</span>
                <span>{nativeName}</span>
              </span>
            </Select.Option>
          )}
        </Select.List>
      </Select>
    </div>
  );
}
