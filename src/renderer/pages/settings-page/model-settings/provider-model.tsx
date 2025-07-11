import { triplitClient } from "@renderer/client";
import { IconPicker } from "@renderer/components/business/icon-picker";
import { ModelList } from "@renderer/components/business/model-list";
import { Link } from "@renderer/components/ui/link";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { TextField } from "@renderer/components/ui/text-field";
import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import { useProviderList } from "@renderer/hooks/use-provider-list";
import logger from "@shared/logger/renderer-logger";
import type { UpdateProviderData } from "@shared/triplit/types";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { configService, providerService } = window.service;

const API_TYPE_OPTIONS = [
  { key: "openai", label: "OpenAI" },
  // { key: "302ai", label: "302.AI" },
];

interface ProviderFormData {
  name: string;
  baseUrl: string;
  apiKey: string;
  apiType: string;
  avatar: string;
}

const DEFAULT_FORM_DATA: ProviderFormData = {
  name: "",
  baseUrl: "",
  apiKey: "",
  apiType: "openai",
  avatar: "",
};

export function ProviderModel() {
  const { selectedProvider } = useActiveProvider();
  const { handleCheckKey } = useProviderList();
  const [formData, setFormData] = useState<ProviderFormData>(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchingModelsState, setFetchingModelsState] = useState<
    Record<string, boolean>
  >({});

  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider",
  });

  const currentProviderFetching = useMemo(() => {
    return selectedProvider?.id
      ? fetchingModelsState[selectedProvider.id] || false
      : false;
  }, [selectedProvider?.id, fetchingModelsState]);

  const setProviderFetching = useCallback(
    (providerId: string, isFetching: boolean) => {
      setFetchingModelsState((prev) => ({
        ...prev,
        [providerId]: isFetching,
      }));
    },
    [],
  );

  const getProvider = useCallback(async (id?: string) => {
    if (!id) return;

    try {
      const providerQuery = triplitClient
        .query("providers")
        .Where("id", "=", id);
      const res = await triplitClient.fetchOne(providerQuery);

      if (res) {
        setFormData({
          name: res.name || "",
          baseUrl: res.baseUrl || "",
          apiKey: res.apiKey || "",
          apiType: res.apiType || "openai",
          avatar: res.avatar || "",
        });
      }
    } catch (error) {
      logger.error("Failed to fetch provider:", { error });
    }
  }, []);

  const saveProvider = useCallback(
    async (updates: UpdateProviderData) => {
      if (!selectedProvider || isSaving) return;

      setIsSaving(true);
      try {
        await configService.updateProvider(selectedProvider.id, updates);
        if (selectedProvider.status === "error") return;
        if (!selectedProvider.custom) {
          if (updates.apiKey === "" || updates.baseUrl === "") {
            await configService.updateProvider(selectedProvider.id, {
              status: "pending",
            });
          } else {
            await configService.updateProvider(selectedProvider.id, {
              status: "success",
            });
          }
        }

        if (selectedProvider.custom) {
          if (!updates.baseUrl) {
            await configService.updateProvider(selectedProvider.id, {
              status: "pending",
            });
            return;
          } else {
            await configService.updateProvider(selectedProvider.id, {
              status: "success",
            });
          }
        }
      } catch (error) {
        logger.error("Failed to save provider:", { error });
      } finally {
        setIsSaving(false);
      }
    },
    [selectedProvider, isSaving],
  );

  const debouncedSave = useMemo(
    () => debounce(saveProvider, 50),
    [saveProvider],
  );

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  useEffect(() => {
    if (selectedProvider?.id) {
      getProvider(selectedProvider.id);
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [selectedProvider?.id, getProvider]);

  const updateFormField = useCallback(
    (field: keyof ProviderFormData, value: string) => {
      const updatedFormData = { ...formData, [field]: value };
      setFormData(updatedFormData);

      const updates: UpdateProviderData = {
        name: updatedFormData.name.trim(),
        baseUrl: updatedFormData.baseUrl.trim(),
        apiKey: updatedFormData.apiKey.trim(),
        apiType: updatedFormData.apiType,
        avatar: updatedFormData.avatar,
      };

      if (field === "name" && !selectedProvider?.custom) {
        return;
      }

      debouncedSave(updates);
    },
    [formData, selectedProvider?.custom, debouncedSave],
  );

  const handleFieldChange = useCallback(
    (field: keyof ProviderFormData) => {
      return (value: string | Key | null) => {
        if (value !== null) {
          updateFormField(field, value as string);
        }
      };
    },
    [updateFormField],
  );

  const handleIconChange = useCallback(
    async (iconKey: string) => {
      setFormData((prev) => ({ ...prev, avatar: iconKey }));

      if (selectedProvider) {
        try {
          await configService.updateProvider(selectedProvider.id, {
            avatar: iconKey,
          });
        } catch (error) {
          logger.error("handleIconChange failed", { error });
          setFormData((prev) => ({
            ...prev,
            avatar: selectedProvider.avatar || "",
          }));
        }
      }
    },
    [selectedProvider],
  );

  const handleGetApiKey = useCallback(() => {
    const apiKeyUrl = selectedProvider?.websites?.apiKey || "https://302.ai";
    window.service?.shellService.openExternal(apiKeyUrl);
  }, [selectedProvider]);

  const isCurrentFormValid = useMemo(() => {
    if (!selectedProvider) return false;
    return !!(formData.baseUrl?.trim() && formData.apiKey?.trim());
  }, [selectedProvider, formData.baseUrl, formData.apiKey]);

  const handleFetchModels = useCallback(async () => {
    if (!selectedProvider) return;

    setProviderFetching(selectedProvider.id, true);

    try {
      const currentProvider = {
        ...selectedProvider,
        ...formData,
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey.trim(),
        apiType: "openai",
      };

      const { isOk, errorMsg } = await handleCheckKey(currentProvider);

      if (!isOk) {
        toast.error(errorMsg);
        await configService.updateProvider(selectedProvider.id, {
          status: "error",
        });
        return;
      }

      const models = await providerService.fetchModels(currentProvider);
      await configService.updateProviderModels(selectedProvider.id, models);
      await configService.updateProvider(selectedProvider.id, {
        status: "success",
      });

      toast.success(t("model-check-success"));
    } catch (error) {
      logger.error("Failed to fetch models:", { error });
      toast.error(t("model-check-failed"));
      await configService.updateProvider(selectedProvider.id, {
        status: "error",
      });
    } finally {
      setProviderFetching(selectedProvider.id, false);
    }
  }, [selectedProvider, formData, handleCheckKey, t, setProviderFetching]);

  if (!selectedProvider) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-fg text-lg">
            {t("select-provider")}
          </h2>
          <p className="text-muted-fg text-sm">
            {t("select-provider-description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-50px)] w-full flex-col gap-y-4 overflow-y-scroll px-6 pt-[18px]">
      {/* 配置标题 */}
      <div className="flex flex-col gap-1">
        <h2 className="text-fg">
          {t("add-provider-form.configure")} {selectedProvider.name}
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* 表单区域 */}
        <div className="flex flex-col gap-6">
          {selectedProvider.custom && (
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-fg text-sm">
                  {t("add-provider-form.icon")}
                </span>
                <IconPicker
                  value={formData.avatar}
                  onChange={handleIconChange}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <span className="font-medium text-fg text-sm">
                  {t("add-provider-form.name")}
                </span>
                <TextField
                  value={formData.name}
                  placeholder={t("add-provider-form.name-placeholder")}
                  onChange={handleFieldChange("name")}
                />
              </div>
            </div>
          )}

          {/* Base URL 字段 */}
          <div className="flex flex-col gap-y-2">
            <TextField
              label="Base URL"
              value={formData.baseUrl}
              placeholder={t("add-provider-form.placeholder-3")}
              onChange={handleFieldChange("baseUrl")}
            />
            <span className="text-muted-fg text-xs">
              {`${t("add-provider-form.api-forward")}：${formData.baseUrl || ""}/chat/completions`}
            </span>
          </div>

          {/* API Key 字段 */}
          <div className="flex flex-col gap-2">
            <TextField
              label="API Key"
              type="password"
              isRevealable
              value={formData.apiKey}
              placeholder={t("add-provider-form.placeholder-2")}
              onChange={handleFieldChange("apiKey")}
            />

            {!selectedProvider.custom && (
              <Link
                onClick={handleGetApiKey}
                className="cursor-pointer self-start text-primary text-sm transition-colors hover:text-primary/80"
              >
                {t("add-provider-form.get-api-key")}
              </Link>
            )}
          </div>

          {/* 接口类型 */}
          {selectedProvider.custom && (
            <div className="flex flex-col gap-2">
              <Select
                label={t("add-provider-form.interface-type")}
                placeholder={t("add-provider-form.interface-type-placeholder")}
                selectedKey={formData.apiType || "openai"}
                onSelectionChange={handleFieldChange("apiType")}
              >
                <SelectTrigger />
                <SelectList placement="bottom start">
                  {API_TYPE_OPTIONS.map(({ key, label }) => (
                    <SelectOption
                      className="flex cursor-pointer justify-between"
                      key={key}
                      id={key}
                      textValue={label}
                    >
                      <span className="text-base">{label}</span>
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </div>
          )}
        </div>

        <ModelList
          onFetchModels={handleFetchModels}
          isFetchingModels={currentProviderFetching}
          isFormValid={isCurrentFormValid}
        />
      </div>
    </div>
  );
}
