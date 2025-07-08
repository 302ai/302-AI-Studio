import { LanguageSelector } from "./language";
import { SearchProvider } from "./search-provider";
import { ThemeSwitcher } from "./theme";

export function GeneralSettings() {
  return (
    <div className="flex h-full flex-col gap-4 px-4 pt-[18px]">
      <LanguageSelector />

      <ThemeSwitcher />

      <SearchProvider />
    </div>
  );
}
