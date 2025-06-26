import { triplitClient } from "@renderer/client";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import langs from "@renderer/i18n/langs";
import type { Language } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";

const { configService } = window.service;

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const uiQuery = triplitClient.query("ui");
  const { result: uiResult } = useQueryOne(triplitClient, uiQuery);
  const lang = uiResult?.language ?? "zh";
  const currentLang = langs.find((l) => l.key === lang) ?? langs[0];

  const handleLanguageChange = async (key: Key | null) => {
    const newLang = key?.toString() ?? "";
    await Promise.all([
      configService.setAppLanguage(newLang as Language),
      i18n.changeLanguage(newLang),
    ]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>{t("settings.general-settings.language.label")}</div>
      <Select
        className="w-[240px]"
        selectedKey={currentLang.key}
        onSelectionChange={handleLanguageChange}
        aria-label="Select language"
      >
        <SelectTrigger
          className="h-9 cursor-pointer rounded-xl text-secondary-fg"
          // prefix={<Earth className="mr-1 size-4" />}
        />
        <SelectList popoverClassName="min-w-[240px]" items={langs}>
          {({ key, prefix, nativeName }) => (
            <SelectOption
              className="flex cursor-pointer justify-between"
              key={key}
              id={key}
              textValue={nativeName}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{prefix}</span>
                <span>{nativeName}</span>
              </span>
            </SelectOption>
          )}
        </SelectList>
      </Select>
    </div>
  );
}
