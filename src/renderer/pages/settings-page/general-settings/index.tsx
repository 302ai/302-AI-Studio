import { LanguageSelector } from "./language";
import { ThemeSwitcher } from "./theme";

export function GeneralSettings() {
  return (
    <div className="flex flex-col gap-4">
      <LanguageSelector />
      <ThemeSwitcher />
    </div>
  );
}
