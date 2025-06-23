import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { Link as Hyperlink } from "@renderer/components/ui/link";
import { Radio, RadioGroup } from "@renderer/components/ui/radio-group";
import { TextField } from "@renderer/components/ui/text-field";
import type { NormalizedUrlResult } from "@renderer/utils/url-normalizer";
import { TailChase } from "ldrs/react";
import { AlertTriangle, Check, KeyRound, Link, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoaderRenderer } from "../loader-renderer";
import "ldrs/react/TailChase.css";
import { cn } from "@renderer/lib/utils";

interface ProviderCfgFormProps {
  isCustomProvider: boolean;
  customName: string;
  apiKey: string;
  baseUrl: string;
  providerType: string;
  keyValidationStatus: "unverified" | "loading" | "success" | "failed";
  canGetApiKey: boolean;
  canCheckKey: boolean;
  isChecking: "idle" | "loading" | "success" | "failed";
  onValidationStatusReset: () => void;
  onCheckKey: () => void;
  onCustomNameChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onProviderTypeChange: (value: string) => void;
  onGetApiKey: () => void;
  normalizedUrlResult: NormalizedUrlResult;
}

export function ProviderCfgForm({
  isCustomProvider,
  customName,
  apiKey,
  baseUrl,
  providerType,
  keyValidationStatus,
  canGetApiKey,
  canCheckKey,
  isChecking,
  onValidationStatusReset,
  onCheckKey,
  onCustomNameChange,
  onApiKeyChange,
  onBaseUrlChange,
  onProviderTypeChange,
  onGetApiKey,
  normalizedUrlResult,
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
    onChange: (value: string) => void,
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
      <div className="flex flex-col gap-2">
        {/* Label and Badge */}
        <div className="flex items-center gap-x-2">
          <Label className="font-medium text-fg text-sm">API Key</Label>
          <Badge intent={getBadgeIntent(keyValidationStatus)} shape="square">
            <LoaderRenderer
              status={keyValidationStatus}
              statuses={badgeStatuses}
              className="gap-1"
            />
          </Badge>
        </div>

        <Hyperlink
          className={cn("cursor-pointer text-sm", isCustomProvider && "hidden")}
          intent="primary"
          isDisabled={!canGetApiKey}
          onPress={onGetApiKey}
        >
          {t("get-api-key")}
        </Hyperlink>

        {/* Input and Button Row */}
        <div className="flex flex-row items-end gap-2">
          <div className="flex-1">
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
            className="transition-all duration-300"
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

        {/* Verification Hint */}
        {keyValidationStatus !== "success" && apiKey && baseUrl && (
          <div className="flex items-center gap-1.5 text-muted-fg text-xs">
            <KeyRound className="size-3 text-primary" />
            <span>{t("verification-hint")}</span>
          </div>
        )}
      </div>

      {/* Provider Base URL Input */}
      <div className="flex flex-col gap-2">
        <TextField
          aria-label="Base URL"
          label="Base URL"
          placeholder={t("placeholder-3")}
          value={baseUrl}
          onChange={(value) => handleInputChange(value, onBaseUrlChange)}
        />

        {/* URL Preview */}
        {baseUrl && (
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <div className="flex items-start gap-2">
              {normalizedUrlResult.isValid ? (
                <Link className="mt-0.5 size-4 shrink-0 text-success-fg" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" />
              )}
              <div className="min-w-0 flex-1">
                {normalizedUrlResult.isValid ? (
                  <div className="space-y-1">
                    <div className="text-fg text-sm">
                      <span className="font-medium">
                        {t("normalized-base-url")}:
                      </span>
                    </div>
                    <div className="break-all font-mono text-secondary-fg text-sm">
                      {normalizedUrlResult.normalizedBaseUrl}
                    </div>
                    <div className="text-fg text-sm">
                      <span className="font-medium">
                        {t("full-api-endpoint")}:
                      </span>
                    </div>
                    <div className="break-all font-mono text-secondary-fg text-sm">
                      {normalizedUrlResult.fullApiEndpoint}
                    </div>

                    {/* If the normalized URL is different from the input, show the apply button */}
                    {normalizedUrlResult.normalizedBaseUrl !== baseUrl && (
                      <div className="mt-3 border-border/30 border-t pt-2">
                        <Button
                          intent="outline"
                          size="extra-small"
                          onClick={() =>
                            onBaseUrlChange(
                              normalizedUrlResult.normalizedBaseUrl,
                            )
                          }
                          className="h-7 text-xs"
                        >
                          {t("apply-normalized-url")}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-warning-fg">
                      {t("url-format-error")}
                    </div>
                    {normalizedUrlResult.error && (
                      <div className="text-secondary-fg text-sm">
                        {normalizedUrlResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
          // TODO: add providers
          // { label: "OpenAI-Response", value: "openai-responses" },
          // { label: "Gemini", value: "gemini" },
          // { label: "Anthropic", value: "anthropic" },
        ].map(({ value, label }) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
