import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import langs from "@renderer/i18n/langs";
import { useSettingsStore } from "@renderer/store/settings-store";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { BsGlobe } from "react-icons/bs";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const handleLanguageChange = (key: Key) => {
    const newLang = key.toString();
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const currentLang = langs.find((lang) => lang.key === language) ?? langs[0];

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
          prefix={<BsGlobe className="mr-1 size-4" />}
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
