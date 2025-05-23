import { Button } from "@renderer/components/ui/button";
import { Radio, RadioGroup } from "@renderer/components/ui/radio-group";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { TextField } from "@renderer/components/ui/text-field";
import { PROVIDER_TYPES } from "@renderer/config/providers";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { IoKeyOutline } from "react-icons/io5";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { useAddProvider } from "@/src/renderer/hooks/use-add-provider";
import { ModelIcon } from "../model-icon";

interface AddProviderProps {
  onValidate: () => void;
}

export function AddProvider({ onValidate }: AddProviderProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.add-provider-form",
  });
  const { canSelectProviders, handleCheckKey } = useAddProvider();

  const [provider, setProvider] = useState<Key | null>("");
  const [providerType, setProviderType] = useState("openai-compatible");
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [customProviderName, setCustomProviderName] = useState("");

  const isCustomProvider = provider === "custom";
  const canCheckKey = !!apiKey && !!provider && !!baseURL;

  const handleCheckClick = () => {};

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Select */}
      <div className="flex flex-col gap-2">
        <Select
          className="w-[300px]"
          label={t("provider-select")}
          aria-label={t("provider-select")}
          placeholder={t("placeholder")}
          onSelectionChange={(key) => setProvider(key)}
        >
          <SelectTrigger className="h-9 cursor-pointer rounded-xl text-secondary-fg" />
          <SelectList popoverClassName="min-w-[300px]">
            {canSelectProviders.map(({ id, name }) => (
              <SelectOption
                className="flex cursor-pointer justify-between"
                key={id}
                id={id}
                textValue={name}
              >
                <span className="flex items-center gap-2">
                  <ModelIcon modelId={id} />
                  <span className="text-base">{name}</span>
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
                <span className="text-base">{t("custom-provider")}</span>
              </span>
            </SelectOption>
          </SelectList>
        </Select>
      </div>

      {/* Provider Name Input */}
      <TextField
        className={isCustomProvider ? "" : "hidden"}
        aria-label="Provider Name"
        label={t("provider-name")}
        placeholder={t("placeholder-1")}
        value={customProviderName}
        onChange={setCustomProviderName}
      />

      {/* Provider API Key Input */}
      <div className="flex flex-row items-center gap-2">
        <TextField
          className="flex-1"
          label="API Key"
          aria-label="API Key"
          type="password"
          placeholder={t("placeholder-2")}
          isRevealable
          value={apiKey}
          onChange={setApiKey}
        />
        <Button
          intent="outline"
          className="self-end"
          onClick={handleCheckClick}
          isDisabled={!canCheckKey}
        >
          <IoKeyOutline className="size-4" />
          {t("check-key")}
        </Button>
      </div>

      {/* Provider Base URL Input */}
      <TextField
        aria-label="Base URL"
        label="Base URL"
        placeholder={t("placeholder-3")}
        value={baseURL}
        onChange={setBaseURL}
      />

      <RadioGroup
        className={isCustomProvider ? "" : "hidden"}
        orientation="horizontal"
        label={t("provider-type")}
        value={providerType}
        onChange={(value) => setProviderType(value)}
      >
        {PROVIDER_TYPES.map(({ value, label }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
