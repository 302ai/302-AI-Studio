/** biome-ignore-all lint/nursery/useUniqueElementIds: ignore */
import { Select } from "@renderer/components/ui/select";
import { useProviderList } from "@renderer/hooks/use-provider-list";
import { cn } from "@renderer/lib/utils";
import { normalizeBaseUrl } from "@renderer/utils/url-normalizer";
import { DEFAULT_PROVIDERS } from "@shared/providers";
import type { Provider } from "@shared/triplit/types";
import { LayoutDashboard } from "lucide-react";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ModelIcon } from "../model-icon";
import { ProviderCfgForm } from "./provider-cfg-form";

interface AddProviderProps {
  onValidationStatusChange: (isValid: boolean) => void;
  onProviderCfgSet: (providerCfg: Provider) => void;
  providers: Provider[];
}

const { shellService } = window.service;

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
  const [website, setWebsite] = useState<string>("");
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
      status: "pending",
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
    // When the SelectOption id is "custom" it means the user wants to add a custom provider
    if (key === "custom") {
      setProviderId("custom");
      setProviderName("");
      setBaseURL(""); // leave empty for custom provider
      setProviderType("openai"); // reset to default
      setWebsite("");
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
      setWebsite(foundProvider.websites?.apiKey || "");
    }

    if (keyValidationStatus !== "unverified") {
      handleValidationStatusReset();
    }
  };

  const handleGetApiKey = async () => {
    await shellService.openExternal(website);
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
          <Select.Trigger className="h-9 cursor-pointer rounded-xl text-secondary-fg" />
          <Select.List popover={{ className: "min-w-[300px]" }}>
            {canSelectProviders.map(({ id, name }) => (
              <Select.Option
                className={cn(
                  "flex cursor-pointer justify-between",
                  "[&>[data-slot='check-indicator']]:order-last [&>[data-slot='check-indicator']]:mr-0 [&>[data-slot='check-indicator']]:ml-auto",
                )}
                key={id}
                id={`${id}-${name}`}
                textValue={name}
              >
                <span className="flex items-center gap-2">
                  <ModelIcon modelName={name} />
                  <span className="text-base">{name}</span>
                </span>
              </Select.Option>
            ))}
            {/* Custom Provider */}
            <Select.Option
              className={cn(
                "flex cursor-pointer justify-between",
                "[&>[data-slot='check-indicator']]:order-last [&>[data-slot='check-indicator']]:mr-0 [&>[data-slot='check-indicator']]:ml-auto",
              )}
              key="custom"
              id="custom"
              textValue="Custom"
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="size-4" />
                <span className="text-base">{t("custom-provider")}</span>
              </span>
            </Select.Option>
          </Select.List>
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
        onGetApiKey={handleGetApiKey}
        normalizedUrlResult={normalizedUrlResult}
        canGetApiKey={!!website}
      />
    </div>
  );
}
