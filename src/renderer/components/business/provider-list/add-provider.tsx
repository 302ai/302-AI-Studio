import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import type { ModelProvider } from "@shared/types/provider";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { toast } from "sonner";
import { ModelIcon } from "../model-icon";
import "ldrs/react/TailChase.css";
import { useProviderList } from "@renderer/hooks/use-provider-list";
import { ProviderCfgForm } from "./provider-cfg-form";

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
  const { canSelectProviders, handleCheckKey } = useProviderList();

  const [providerId, setProviderId] = useState<string>("");
  const [providerName, setProviderName] = useState<string>("");
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

  const isCustomProvider = providerId === "custom";
  const canCheckKey = !!apiKey && !!providerId && !!baseUrl;
  const customProviderName = customName === "" ? t("default-name") : customName;

  const handleCheckClick = async () => {
    setIsChecking("loading");
    setKeyValidationStatus("loading");

    const providerCfg: ModelProvider = {
      id: isCustomProvider ? `custom-${nanoid()}` : providerId,
      name: isCustomProvider ? customProviderName : providerName,
      apiType: providerType,
      apiKey,
      baseUrl,
      enabled: false,
      custom: isCustomProvider,
    };

    const { isOk, errorMsg } = await handleCheckKey(providerCfg, "add");

    setIsChecking(isOk ? "success" : "failed");
    setKeyValidationStatus(isOk ? "success" : "failed");

    onValidationStatusChange(isOk);

    if (isOk) {
      onProviderCfgSet({ ...providerCfg, enabled: true });

      toast.success(t("check-key-success"));
    } else {
      toast.error(errorMsg || t("check-key-failed"));
    }

    setTimeout(() => {
      setIsChecking("idle");
    }, 1000);
  };

  const handleValidationStatusReset = () => {
    setKeyValidationStatus("unverified");
    onValidationStatusChange(false);
  };

  const handleProviderSelect = (key: string) => {
    const [id, name] = key.toString().split("-");
    setProviderId(id);
    setProviderName(name);

    if (keyValidationStatus !== "unverified") {
      handleValidationStatusReset();
    }
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
          onSelectionChange={(key) => handleProviderSelect(key as string)}
        >
          <SelectTrigger className="h-9 cursor-pointer rounded-xl text-secondary-fg" />
          <SelectList popoverClassName="min-w-[300px]">
            {canSelectProviders.map(({ id, name }) => (
              <SelectOption
                className="flex cursor-pointer justify-between"
                key={id}
                id={`${id}-${name}`}
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

      {/* Provider Configuration Form */}
      <ProviderCfgForm
        isCustomProvider={isCustomProvider}
        customName={customName}
        onCustomNameChange={setCustomName}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseURL}
        providerType={providerType}
        onProviderTypeChange={setProviderType}
        keyValidationStatus={keyValidationStatus}
        onCheckKey={handleCheckClick}
        canCheckKey={canCheckKey}
        isChecking={isChecking}
        onValidationStatusReset={handleValidationStatusReset}
      />
    </div>
  );
}
