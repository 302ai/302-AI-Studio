import { useTranslation } from "react-i18next";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import langs from "@renderer/i18n/langs";
import { IconTranslate } from "@intentui/icons";

export function LanguageSwitcher({
  ...props
}: React.ComponentProps<typeof Select>) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (key: React.Key) => {
    const newLang = key.toString();

    // Change the language
    void i18n.changeLanguage(newLang);
  };

  const currentLang =
    langs.find((lang) => lang.key === i18n.language) ?? langs[0];

  return (
    <Select
      selectedKey={currentLang.key}
      onSelectionChange={handleLanguageChange}
      aria-label="Select language"
      className="w-auto min-w-0"
      {...props}
    >
      <SelectTrigger
        prefix={<IconTranslate className="mr-1 size-4 text-muted-fg" />}
      />
      <SelectList className="min-w-32">
        {langs.map((lang) => (
          <SelectOption
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
  );
}
