import { useTranslation } from "react-i18next";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { INITIAL_PROVIDERS, getProviderIcon } from "@renderer/config/providers";
import { Label } from "react-aria-components";
import { TextField } from "@renderer/components/ui/text-field";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { Button } from "@renderer/components/ui/button";

interface AddProviderProps {
  onValidate: () => void;
}

export function AddProvider({ onValidate }: AddProviderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Select */}
      <div className="flex flex-col gap-2">
        <Label>
          {t("settings.model-settings.model-provider.add-provider-form.label")}
        </Label>
        <Select className="w-[300px]" aria-label="Select provider">
          <SelectTrigger className="h-9 cursor-pointer rounded-xl text-secondary-fg" />
          <SelectList popoverClassName="min-w-[300px]">
            {INITIAL_PROVIDERS.map((provider) => (
              <SelectOption
                className="flex cursor-pointer justify-between"
                key={provider.id}
                textValue={provider.name}
              >
                <span className="flex items-center gap-2">
                  <img
                    src={getProviderIcon(provider.id)}
                    alt={provider.name}
                    className="size-4 rounded-full"
                  />
                  <span className="text-base">{provider.name}</span>
                </span>
              </SelectOption>
            ))}

            {/* Custom Provider */}
            <SelectOption
              className="flex cursor-pointer justify-between"
              textValue="Custom"
            >
              <span className="flex items-center gap-2">
                <MdOutlineDashboardCustomize className="size-4" />
                <span className="text-base">
                  {t(
                    "settings.model-settings.model-provider.add-provider-form.custom-provider"
                  )}
                </span>
              </span>
            </SelectOption>
          </SelectList>
        </Select>
      </div>

      {/* Provider API Key Input */}
      <div className="flex flex-col gap-2">
        <Label>API Key</Label>
        <div className="flex flex-row items-center gap-2">
          <TextField aria-label="API Key" />
          <Button intent="outline" size="small">
            {t(
              "settings.model-settings.model-provider.add-provider-form.check-key"
            )}
          </Button>
        </div>
      </div>

      {/* Provider Base URL Input */}
      <div className="flex flex-col gap-2">
        <Label>Base URL</Label>
        <TextField aria-label="Base URL" />
      </div>
    </div>
  );
}
