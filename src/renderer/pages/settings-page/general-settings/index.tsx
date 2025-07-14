import { LanguageSelector } from "./language";
import { ThemeSwitcher } from "./theme";

export function GeneralSettings() {
  return (
    <div className="flex h-full flex-col gap-4 px-4 pt-[18px]">
      <LanguageSelector />

      <ThemeSwitcher />
    </div>
  );
}
