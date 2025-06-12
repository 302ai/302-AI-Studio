/** biome-ignore-all lint/nursery/useUniqueElementIds: ignore */
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ModelIcon } from "../model-icon";
import "ldrs/react/TailChase.css";
import { DEFAULT_PROVIDERS } from "@renderer/config/providers";
import { useProviderList } from "@renderer/hooks/use-provider-list";
import { normalizeBaseUrl } from "@renderer/utils/url-normalizer";
import type { Provider } from "@shared/triplit/types";
import { LayoutDashboard } from "lucide-react";
import { ProviderCfgForm } from "./provider-cfg-form";

interface AddProviderProps {
  onValidationStatusChange: (isValid: boolean) => void;
  onProviderCfgSet: (providerCfg: Provider) => void;
  providers: Provider[];
}

export function AddProvider({
  onValidationStatusChange,
  onProviderCfgSet,
  providers,
}: AddProviderProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.add-provider-form",
  });
  const { handleCheckKey } = useProviderList();

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

  const normalizedUrlResult = useMemo(() => {
    return normalizeBaseUrl(baseUrl, providerType, t);
  }, [baseUrl, providerType, t]);

  // * Show providers that are NOT already in the modelProvider array
  const canSelectProviders = DEFAULT_PROVIDERS.filter(
    (initialProvider) =>
      !providers.some(
        (existingProvider) => existingProvider.name === initialProvider.name,
      ),
  );

  const handleCheckClick = async () => {
    setIsChecking("loading");
    setKeyValidationStatus("loading");

    const finalBaseUrl = normalizedUrlResult.isValid
      ? normalizedUrlResult.normalizedBaseUrl
      : baseUrl;

    const providerCfg: Provider = {
      id: isCustomProvider ? `custom-${nanoid()}` : providerId,
      name: isCustomProvider ? customProviderName : providerName,
      apiType: providerType,
      apiKey,
      baseUrl: finalBaseUrl,
      enabled: false,
      custom: isCustomProvider,
      order: 0,
    };

    const { isOk, errorMsg } = await handleCheckKey(providerCfg);

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
    console.log("handleProviderSelect", key);
    // When the SelectOption id is "custom" it means the user wants to add a custom provider
    if (key === "custom") {
      setProviderId("custom");
      setProviderName("");
      setBaseURL(""); // leave empty for custom provider
      setProviderType("openai"); // reset to default

      if (keyValidationStatus !== "unverified") {
        handleValidationStatusReset();
      }

      return;
    }

    const [id, name] = key.toString().split("-");
    setProviderId(id);
    setProviderName(name);

    // Fill baseUrl & apiType automatically
    const foundProvider = DEFAULT_PROVIDERS.find((p) => p.id === id);
    if (foundProvider) {
      // Prefer the explicit baseUrl field, fallback to websites.defaultBaseUrl
      const defaultBaseUrl =
        foundProvider.baseUrl || foundProvider.websites?.defaultBaseUrl || "";

      // Set API type, then set Base URL (so useMemo can correctly calculate normalized result)
      setProviderType(foundProvider.apiType);
      setBaseURL(defaultBaseUrl);
    }

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
                  <ModelIcon modelName={name} />
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
                <LayoutDashboard className="size-4" />
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
        normalizedUrlResult={normalizedUrlResult}
      />
    </div>
  );
}
