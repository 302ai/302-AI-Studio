import { useTranslation } from "react-i18next";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import {
  INITIAL_PROVIDERS,
  PROVIDER_TYPES,
  getProviderIcon,
} from "@renderer/config/providers";
import { Key } from "react-aria-components";
import { TextField } from "@renderer/components/ui/text-field";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { Button } from "@renderer/components/ui/button";
import { IoKeyOutline } from "react-icons/io5";
import { useState } from "react";
import { RadioGroup, Radio } from "@renderer/components/ui/radio-group";

interface AddProviderProps {
  onValidate: () => void;
}

export function AddProvider({ onValidate }: AddProviderProps) {
  const { t } = useTranslation();
  const [provider, setProvider] = useState<Key | null>("");
  const [providerType, setProviderType] = useState("openai-compatible");

  const isCustomProvider = provider === "custom";

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Select */}
      <div className="flex flex-col gap-2">
        <Select
          className="w-[300px]"
          label={t(
            "settings.model-settings.model-provider.add-provider-form.provider-select"
          )}
          aria-label="Select provider"
          placeholder={t(
            "settings.model-settings.model-provider.add-provider-form.placeholder"
          )}
          onSelectionChange={(key) => setProvider(key)}
        >
          <SelectTrigger className="h-9 cursor-pointer rounded-xl text-secondary-fg" />
          <SelectList
            popoverClassName="min-w-[300px]"
            items={INITIAL_PROVIDERS}
          >
            {INITIAL_PROVIDERS.map((provider) => (
              <SelectOption
                className="flex cursor-pointer justify-between"
                key={provider.id}
                id={provider.id}
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
              key="custom"
              id="custom"
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
      <div className="flex flex-row items-center gap-2">
        <TextField
          className="flex-1"
          label="API Key"
          aria-label="API Key"
          type="password"
          placeholder={t(
            "settings.model-settings.model-provider.add-provider-form.placeholder-2"
          )}
          isRevealable
        />
        <Button intent="outline">
          <IoKeyOutline className="size-4" />
          {t(
            "settings.model-settings.model-provider.add-provider-form.check-key"
          )}
        </Button>
      </div>

      {/* Provider Base URL Input */}
      <TextField
        aria-label="Base URL"
        label="Base URL"
        placeholder={t(
          "settings.model-settings.model-provider.add-provider-form.placeholder-3"
        )}
      />

      <RadioGroup
        className={isCustomProvider ? "block" : "hidden"}
        orientation="horizontal"
        label={t(
          "settings.model-settings.model-provider.add-provider-form.provider-type"
        )}
        value={providerType}
        onChange={(value) => setProviderType(value)}
      >
        {PROVIDER_TYPES.map((provider) => (
          <Radio key={provider.value} value={provider.value}>
            {provider.label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
