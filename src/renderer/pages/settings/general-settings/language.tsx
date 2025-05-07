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
import { useAtom } from "jotai";
import {
  settingsAtom,
  setLanguage,
} from "~/src/renderer/store/settings/general-settings-store";

export function LanguageSelector({
  ...props
}: React.ComponentProps<typeof Select>) {
  const { t, i18n } = useTranslation();

  const [settings] = useAtom(settingsAtom);
  const [, applyLanguage] = useAtom(setLanguage);

  const handleLanguageChange = (key: React.Key) => {
    const newLang = key.toString();
    applyLanguage(newLang);
    i18n.changeLanguage(newLang);
    window.api.setLanguage(newLang);
  };

  const currentLang =
    langs.find((lang) => lang.key === settings.language) ?? langs[0];

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("settings.general-settings.language.label")}</Label>
      <Select
        className="w-[240px] min-w-0"
        selectedKey={currentLang.key}
        onSelectionChange={handleLanguageChange}
        aria-label="Select language"
        {...props}
      >
        <SelectTrigger
          className="h-9 cursor-pointer border-border text-secondary-fg"
          prefix={<BsGlobe className="mr-1 size-5" />}
        />
        <SelectList className="min-w-32">
          {langs.map((lang) => (
            <SelectOption
              className="cursor-pointer"
              key={lang.key}
              id={lang.key}
              textValue={lang.nativeName}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{lang.prefix}</span>
                <span>{lang.nativeName}</span>
              </span>
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}
