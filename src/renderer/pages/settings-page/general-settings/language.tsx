import { useTranslation } from "react-i18next";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import langs from "@renderer/i18n/langs";
import { Label } from "react-aria-components";
import { BsGlobe } from "react-icons/bs";
import { useSettingsStore } from "@/src/renderer/store/settings-store";

export function LanguageSelector({
  ...props
}: React.ComponentProps<typeof Select>) {
  const { t, i18n } = useTranslation();

  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const handleLanguageChange = (key: React.Key) => {
    const newLang = key.toString();
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const currentLang = langs.find((lang) => lang.key === language) ?? langs[0];

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("settings.general-settings.language.label")}</Label>
      <Select
        className="w-[240px]"
        selectedKey={currentLang.key}
        onSelectionChange={handleLanguageChange}
        aria-label="Select language"
        {...props}
      >
        <SelectTrigger
          className="h-9 cursor-pointer rounded-[10px] text-secondary-fg"
          prefix={<BsGlobe className="mr-1 size-4" />}
        />
        <SelectList popoverClassName="min-w-[240px]">
          {langs.map(({ key, prefix, nativeName }) => (
            <SelectOption
              className="flex cursor-pointer justify-between focus:bg-hover-primary"
              key={key}
              id={key}
              textValue={nativeName}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{prefix}</span>
                <span>{nativeName}</span>
              </span>
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}
