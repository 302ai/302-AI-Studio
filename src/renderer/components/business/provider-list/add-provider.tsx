import { Button } from "@renderer/components/ui/button";
import { Radio, RadioGroup } from "@renderer/components/ui/radio-group";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { TextField } from "@renderer/components/ui/text-field";
import type { ModelProvider } from "@renderer/types/providers";
import { TailChase } from "ldrs/react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IoKeyOutline } from "react-icons/io5";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { toast } from "sonner";
import { useAddProvider } from "@/src/renderer/hooks/use-add-provider";
import { ModelIcon } from "../model-icon";
import "ldrs/react/TailChase.css";
import { Badge } from "@renderer/components/ui/badge";
import { Label } from "@renderer/components/ui/field";
import { VscCheck, VscClose } from "react-icons/vsc";
import { LoaderRenderer } from "../loader-renderer";

interface AddProviderProps {
  onValidationStatusChange: (isValid: boolean) => void;
  onProviderCfgSet: (providerCfg: ModelProvider) => void;
}

export function AddProvider({
  onValidationStatusChange,
  onProviderCfgSet,
}: AddProviderProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.add-provider-form",
  });
  const { canSelectProviders, handleCheckKey } = useAddProvider();

  const [provider, setProvider] = useState<string>("");
  const [providerType, setProviderType] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseURL] = useState("");
  const [customName, setCustomName] = useState("");
  const [isChecking, setIsChecking] = useState<
    "idle" | "loading" | "success" | "failed"
  >("idle");
  const [keyValidationStatus, setKeyValidationStatus] = useState<
    "unverified" | "loading" | "success" | "failed"
  >("unverified");

  const isCustomProvider = provider === "custom";
  const canCheckKey = !!apiKey && !!provider && !!baseUrl;
  const customProviderName = customName === "" ? t("default-name") : customName;
  const currentButtonStatus = isChecking === "loading" ? "loading" : "idle";

  const buttonStatuses = {
    idle: {
      icon: <IoKeyOutline className="size-4" />,
      text: t("check-key"),
    },
    loading: {
      icon: <TailChase size="16" color="currentColor" />,
      text: t("checking"),
    },
  } as const;
  const badgeStatuses = {
    unverified: {
      icon: <IoKeyOutline className="size-4" />,
      text: t("unverified"),
    },
    loading: {
      icon: <TailChase size="16" color="currentColor" />,
      text: t("checking"),
    },
    success: {
      icon: <VscCheck className="size-4" />,
      text: t("verified"),
    },
    failed: {
      icon: <VscClose className="size-4" />,
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

  const handleCheckClick = async () => {
    setIsChecking("loading");
    setKeyValidationStatus("loading");

    const providerCfg: ModelProvider = {
      id: isCustomProvider ? `custom-${nanoid()}` : provider,
      name: isCustomProvider ? customProviderName : provider,
      apiType: providerType,
      apiKey,
      baseUrl,
      enable: false,
      custom: isCustomProvider,
    };

    const { isOk, errorMsg } = await handleCheckKey(providerCfg);

    setIsChecking(isOk ? "success" : "failed");
    setKeyValidationStatus(isOk ? "success" : "failed");

    onValidationStatusChange(isOk);

    if (isOk) {
      onProviderCfgSet({ ...providerCfg, enable: true });

      toast.success(t("check-key-success"));
    } else {
      toast.error(errorMsg || t("check-key-failed"));
    }

    setTimeout(() => {
      setIsChecking("idle");
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Select */}
      <div className="flex flex-col gap-2">
        <Select
          className="w-[300px]"
          label={t("provider-select")}
          aria-label={t("provider-select")}
          placeholder={t("placeholder")}
          onSelectionChange={(key) => {
            setProvider(key as string);
            if (keyValidationStatus !== "unverified") {
              setKeyValidationStatus("unverified");
              onValidationStatusChange(false);
            }
          }}
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
        value={customName}
        onChange={(value) => {
          setCustomName(value);
          if (keyValidationStatus !== "unverified") {
            setKeyValidationStatus("unverified");
            onValidationStatusChange(false);
          }
        }}
      />

      {/* Provider API Key Input */}
      <div className="flex flex-row items-center gap-2">
        <div className="flex-1">
          <div className="mb-[calc(var(--spacing)*1.5)] flex items-center gap-x-2">
            <Label className="font-medium text-foreground text-sm">
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
            onChange={(value) => {
              setApiKey(value);
              if (keyValidationStatus !== "unverified") {
                setKeyValidationStatus("unverified");
                onValidationStatusChange(false);
              }
            }}
          />
        </div>

        <Button
          intent="outline"
          className="self-end transition-all duration-300"
          onClick={handleCheckClick}
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
        onChange={(value) => {
          setBaseURL(value);
          if (keyValidationStatus !== "unverified") {
            setKeyValidationStatus("unverified");
            onValidationStatusChange(false);
          }
        }}
      />

      {/* Provider Type Select */}
      <RadioGroup
        className={isCustomProvider ? "" : "hidden"}
        orientation="horizontal"
        label={t("provider-type")}
        value={providerType}
        onChange={(value) => setProviderType(value)}
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
