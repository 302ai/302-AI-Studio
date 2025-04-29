import { LanguageSwitcher } from "./language";
import { Label } from "@renderer/components/ui/field";

export function GeneralSettings() {
  return (
    <div className="flex flex-col gap-4">
      <Label>Language</Label>
      <LanguageSwitcher />
    </div>
  );
}
