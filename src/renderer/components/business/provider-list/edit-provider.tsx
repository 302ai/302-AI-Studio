import { useProviderList } from "@renderer/hooks/use-provider-list";
import type { Provider } from "@shared/triplit/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ProviderCfgForm } from "./provider-cfg-form";

interface EditProviderProps {
  provider: Provider;
  onValidationStatusChange: (isValid: boolean) => void;
  onProviderCfgSet: (providerCfg: Provider) => void;
}

export function EditProvider({
  provider,
  onValidationStatusChange,
  onProviderCfgSet,
}: EditProviderProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.edit-provider-form",
  });
  const { handleCheckKey } = useProviderList();

  const [apiType, setApiType] = useState(provider.apiType);
  const [apiKey, setApiKey] = useState(provider.apiKey);
  const [baseUrl, setBaseURL] = useState(provider.baseUrl);
  const [customName, setCustomName] = useState(provider.name);
  const [isChecking, setIsChecking] = useState<
    "idle" | "loading" | "success" | "failed"
  >("idle");
  const [keyValidationStatus, setKeyValidationStatus] = useState<
    "unverified" | "loading" | "success" | "failed"
  >("success");
  const [hasKeyFieldsBeenModified, setHasKeyFieldsBeenModified] =
    useState(false);

  const isCustomProvider = provider.custom ?? false;
  const canCheckKey = !!apiKey && !!baseUrl;

  const isOnlyNameChanged = useCallback(() => {
    return (
      customName !== provider.name &&
      apiKey === provider.apiKey &&
      baseUrl === provider.baseUrl &&
      apiType === provider.apiType &&
      !hasKeyFieldsBeenModified
    );
  }, [
    customName,
    apiKey,
    baseUrl,
    apiType,
    hasKeyFieldsBeenModified,
    provider,
  ]);

  const isKeyFieldsChanged = useCallback(() => {
    return (
      apiKey !== provider.apiKey ||
      baseUrl !== provider.baseUrl ||
      apiType !== provider.apiType
    );
  }, [apiKey, baseUrl, apiType, provider]);

  const isCurrentConfigValid = useCallback(() => {
    if (isOnlyNameChanged()) {
      return true;
    }

    if (hasKeyFieldsBeenModified) {
      return keyValidationStatus === "success";
    }

    if (isKeyFieldsChanged()) {
      return keyValidationStatus === "success";
    }

    return true;
  }, [
    isOnlyNameChanged,
    hasKeyFieldsBeenModified,
    keyValidationStatus,
    isKeyFieldsChanged,
  ]);

  const handleValidationStatusReset = () => {
    setKeyValidationStatus("unverified");
    onValidationStatusChange(false);
  };

  const handleCheckClick = async () => {
    setIsChecking("loading");
    setKeyValidationStatus("loading");

    const updatedProvider: Provider = {
      ...provider,
      name: customName,
      apiKey,
      baseUrl,
      apiType,
    };

    const { isOk, errorMsg } = await handleCheckKey(updatedProvider);

    setIsChecking(isOk ? "success" : "failed");
    setKeyValidationStatus(isOk ? "success" : "failed");

    if (isOk) {
      toast.success(t("check-key-success"));
    } else {
      toast.error(errorMsg || t("check-key-failed"));
    }

    setTimeout(() => {
      setIsChecking("idle");
    }, 1000);
  };

  const handleKeyFieldChange = (
    value: string,
    onChange: (value: string) => void,
  ) => {
    onChange(value);

    if (!hasKeyFieldsBeenModified) {
      setHasKeyFieldsBeenModified(true);
    }

    if (keyValidationStatus === "success") {
      setKeyValidationStatus("unverified");
    }
  };

  const onValidationStatusChangeRef = useRef(onValidationStatusChange);
  const onProviderCfgSetRef = useRef(onProviderCfgSet);

  useEffect(() => {
    onValidationStatusChangeRef.current = onValidationStatusChange;
    onProviderCfgSetRef.current = onProviderCfgSet;
  });

  useEffect(() => {
    const updatedProvider: Provider = {
      ...provider,
      name: customName,
      apiKey,
      baseUrl,
      apiType: apiType,
    };

    const isValid = isCurrentConfigValid();
    onValidationStatusChangeRef.current(isValid);

    if (isValid) {
      onProviderCfgSetRef.current(updatedProvider);
    }
  }, [customName, apiKey, baseUrl, apiType, isCurrentConfigValid, provider]);

  return (
    <div className="flex flex-col gap-4">
      <ProviderCfgForm
        isCustomProvider={isCustomProvider}
        customName={customName}
        apiKey={apiKey}
        baseUrl={baseUrl}
        providerType={apiType}
        keyValidationStatus={keyValidationStatus}
        canCheckKey={canCheckKey}
        isChecking={isChecking}
        onValidationStatusReset={handleValidationStatusReset}
        onCheckKey={handleCheckClick}
        onCustomNameChange={setCustomName}
        onApiKeyChange={(value) => handleKeyFieldChange(value, setApiKey)}
        onBaseUrlChange={(value) => handleKeyFieldChange(value, setBaseURL)}
        onProviderTypeChange={(value) =>
          handleKeyFieldChange(value, setApiType)
        }
      />
    </div>
  );
}
