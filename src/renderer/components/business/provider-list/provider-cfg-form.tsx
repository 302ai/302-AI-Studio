import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { Radio, RadioGroup } from "@renderer/components/ui/radio-group";
import { TextField } from "@renderer/components/ui/text-field";
import { TailChase } from "ldrs/react";
import { Check, KeyRound, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoaderRenderer } from "../loader-renderer";

interface ProviderCfgFormProps {
  isCustomProvider: boolean;
  customName: string;
  apiKey: string;
  baseUrl: string;
  providerType: string;
  keyValidationStatus: "unverified" | "loading" | "success" | "failed";
  canCheckKey: boolean;
  isChecking: "idle" | "loading" | "success" | "failed";
  onValidationStatusReset: () => void;
  onCheckKey: () => void;
  onCustomNameChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onProviderTypeChange: (value: string) => void;
}

export function ProviderCfgForm({
  isCustomProvider,
  customName,
  apiKey,
  baseUrl,
  providerType,
  keyValidationStatus,
  canCheckKey,
  isChecking,
  onValidationStatusReset,
  onCheckKey,
  onCustomNameChange,
  onApiKeyChange,
  onBaseUrlChange,
  onProviderTypeChange,
}: ProviderCfgFormProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.add-provider-form",
  });

  const currentButtonStatus = isChecking === "loading" ? "loading" : "idle";

  const buttonStatuses = {
    idle: {
      icon: <KeyRound className="size-4" />,
      text: t("check-key"),
    },
    loading: {
      icon: <TailChase size="16" color="currentColor" />,
      text: t("checking"),
    },
  } as const;

  const badgeStatuses = {
    unverified: {
      icon: <KeyRound className="size-4" />,
      text: t("unverified"),
    },
    loading: {
      icon: <TailChase size="16" color="currentColor" />,
      text: t("checking"),
    },
    success: {
      icon: <Check className="size-4" />,
      text: t("verified"),
    },
    failed: {
      icon: <X className="size-4" />,
      text: t("verification-failed"),
    },
  } as const;

  const getBadgeIntent = (status: typeof keyValidationStatus) => {
    switch (status) {
      case "unverified":
      case "loading":
        return "primary";
      case "success":
        return "success";
      case "failed":
        return "danger";
      default:
        return "primary";
    }
  };

  const handleInputChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    onChange(value);
    if (keyValidationStatus !== "unverified") {
      onValidationStatusReset();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Name Input */}
      <TextField
        className={isCustomProvider ? "" : "hidden"}
        aria-label="Provider Name"
        label={t("provider-name")}
        placeholder={t("placeholder-1")}
        value={customName}
        onChange={onCustomNameChange}
      />

      {/* Provider API Key Input */}
      <div className="flex flex-row items-center gap-2">
        <div className="flex-1">
          <div className="mb-[calc(var(--spacing)*1.5)] flex items-center gap-x-2">
            <Label className="font-medium text-fg text-sm">
              API Key
            </Label>
            <Badge intent={getBadgeIntent(keyValidationStatus)} shape="square">
              <LoaderRenderer
                status={keyValidationStatus}
                statuses={badgeStatuses}
                className="gap-1"
              />
            </Badge>
          </div>
          <TextField
            className="transition-all duration-300"
            aria-label="API Key"
            type="password"
            placeholder={t("placeholder-2")}
            isRevealable
            value={apiKey}
            onChange={(value) => handleInputChange(value, onApiKeyChange)}
          />
        </div>

        <Button
          intent="outline"
          className="self-end transition-all duration-300"
          onClick={onCheckKey}
          isDisabled={!canCheckKey}
          isPending={isChecking === "loading"}
        >
          <LoaderRenderer
            status={currentButtonStatus}
            statuses={buttonStatuses}
          />
        </Button>
      </div>

      {/* Provider Base URL Input */}
      <TextField
        aria-label="Base URL"
        label="Base URL"
        placeholder={t("placeholder-3")}
        value={baseUrl}
        onChange={(value) => handleInputChange(value, onBaseUrlChange)}
      />

      {/* Provider Type Select */}
      <RadioGroup
        className={isCustomProvider ? "" : "hidden"}
        orientation="horizontal"
        label={t("provider-type")}
        value={providerType}
        onChange={(value) => handleInputChange(value, onProviderTypeChange)}
      >
        {[
          { label: "OpenAI", value: "openai" },
          { label: "OpenAI-Response", value: "openai-responses" },
          { label: "Gemini", value: "gemini" },
          { label: "Anthropic", value: "anthropic" },
        ].map(({ value, label }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
