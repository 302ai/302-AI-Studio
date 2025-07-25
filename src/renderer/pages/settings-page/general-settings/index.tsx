import { LanguageSelector } from "./language";
import { PrivacyModeSettings } from "./privacy-mode";
import { ThemeSwitcher } from "./theme";
import { VersionUpdate } from "./version-update";

export function GeneralSettings() {
  return (
    <div className="mx-auto flex h-full flex-col gap-4 px-4 pt-[18px]">
      <LanguageSelector />

      <ThemeSwitcher />

      <PrivacyModeSettings />

      <VersionUpdate />
    </div>
  );
}
