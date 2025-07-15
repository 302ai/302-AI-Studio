import { LanguageSelector } from "./language";
import { ThemeSwitcher } from "./theme";
import { VersionUpdate } from "./version-update";

export function GeneralSettings() {
  return (
    <div className="mx-auto flex h-full flex-col gap-4 px-4 pt-[18px]">
      <LanguageSelector />

      <ThemeSwitcher />

      <VersionUpdate />
    </div>
  );
}
