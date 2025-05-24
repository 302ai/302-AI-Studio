import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProviderList } from "@/src/renderer/hooks/use-provider-list";
import type { ModelProvider } from "@/src/renderer/types/providers";
import { ProviderCfgForm } from "./provider-cfg-form";

interface EditProviderProps {
  provider: ModelProvider | null;
  onValidationStatusChange: (isValid: boolean) => void;
}

export function EditProvider({
  provider,
  onValidationStatusChange,
}: EditProviderProps) {
  if (!provider) return null;

  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.edit-provider-form",
  });
  const { handleCheckKey } = useProviderList();

  const [providerType, setProviderType] = useState("openai");
  const [apiKey, setApiKey] = useState(provider.apiKey);
  const [baseUrl, setBaseURL] = useState(provider.baseUrl);
  const [customName, setCustomName] = useState(provider.name);
  const [isChecking, setIsChecking] = useState<
    "idle" | "loading" | "success" | "failed"
  >("idle");
  const [keyValidationStatus, setKeyValidationStatus] = useState<
    "unverified" | "loading" | "success" | "failed"
  >("success");

  const canCheckKey = !!apiKey && !!baseUrl;

  const handleValidationStatusReset = () => {
    setKeyValidationStatus("unverified");
    onValidationStatusChange(false);
  };

  const handleCheckClick = async () => {
    setIsChecking("loading");
    setKeyValidationStatus("loading");

    const { isOk, errorMsg } = await handleCheckKey(provider, "edit");

    setIsChecking(isOk ? "success" : "failed");
    setKeyValidationStatus(isOk ? "success" : "failed");

    onValidationStatusChange(isOk);

    if (isOk) {
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
      <ProviderCfgForm
        isCustomProvider={provider.custom ?? false}
        customName={customName}
        apiKey={apiKey}
        baseUrl={baseUrl}
        providerType={providerType}
        keyValidationStatus={keyValidationStatus}
        canCheckKey={canCheckKey}
        isChecking={isChecking}
        onValidationStatusReset={handleValidationStatusReset}
        onCheckKey={handleCheckClick}
        onCustomNameChange={setCustomName}
        onApiKeyChange={setApiKey}
        onBaseUrlChange={setBaseURL}
        onProviderTypeChange={setProviderType}
      />
    </div>
  );
}
