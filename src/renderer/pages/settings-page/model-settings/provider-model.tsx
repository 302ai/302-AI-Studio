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
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { configService, providerService } = window.service;

const API_TYPE_OPTIONS = [{ key: "openai", label: "OpenAI" }];

export function ProviderModel() {
  const { selectedProvider } = useActiveProvider();
  const { handleCheckKey } = useProviderList();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiType, setApiType] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // 用于标识是否正在从 selectedProvider 初始化状态，避免与实时保存冲突
  const isInitializing = useRef(false);

  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider",
  });

  // 当选中的provider变化时，更新本地状态
  useEffect(() => {
    isInitializing.current = true;

    if (selectedProvider) {
      setName(selectedProvider.name || "");
      setBaseUrl(selectedProvider.baseUrl || "");
      setApiKey(selectedProvider.apiKey || "");
      setApiType(selectedProvider.apiType || "openai");
      setAvatar(selectedProvider.avatar || "");
    } else {
      setName("");
      setBaseUrl("");
      setApiKey("");
      setApiType("openai"); // 默认设置为openai
      setAvatar("");
    }

    // 使用 setTimeout 确保状态更新完成后再将 isInitializing 设为 false
    setTimeout(() => {
      isInitializing.current = false;
    }, 0);
  }, [selectedProvider]);

  // 防抖保存函数
  const saveProvider = useCallback(
    async (
      updates: Partial<{
        name: string;
        baseUrl: string;
        apiKey: string;
        apiType: string;
        avatar: string;
      }>,
    ) => {
      if (!selectedProvider || isInitializing.current || isSaving) return;

      setIsSaving(true);
      try {
        await configService.updateProvider(selectedProvider.id, updates);
      } catch (error) {
        logger.error("Failed to save provider:", { error });
      } finally {
        setIsSaving(false);
      }
    },
    [selectedProvider, isSaving],
  );

  const debouncedSave = useMemo(
    () => debounce(saveProvider, 500),
    [saveProvider],
  );

  // 组件卸载时取消防抖函数
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // 处理名称变化
  const handleNameChange = (value: string) => {
    setName(value);
    debouncedSave({ name: value.trim() });
  };

  // 处理Base URL变化
  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    debouncedSave({ baseUrl: value.trim() });
  };

  // 处理API Key变化
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    debouncedSave({ apiKey: value.trim() });
  };

  // 处理API类型变化
  const handleApiTypeChange = (key: Key | null) => {
    const value = key as string;
    if (value) {
      setApiType(value);
      debouncedSave({ apiType: value });
    }
  };

  const handleGetApiKey = () => {
    // 根据选中的provider打开对应的API Key获取页面
    const apiKeyUrl = selectedProvider?.websites?.apiKey || "https://302.ai";
    window.service?.shellService.openExternal(apiKeyUrl);
  };

  // 处理图标选择
  const handleIconChange = async (iconKey: string) => {
    setAvatar(iconKey);

    // 立即保存到数据库
    if (selectedProvider && !isInitializing.current) {
      try {
        await configService.updateProvider(selectedProvider.id, {
          avatar: iconKey,
        });
      } catch (error) {
        logger.error("handleIconChange failed", { error });
        // 如果保存失败，回滚本地状态
        setAvatar(selectedProvider.avatar || "");
      }
    }
  };

  const handleFetchModels = async () => {
    if (!selectedProvider) return;

    setIsFetchingModels(true);

    try {
      // 构建当前的 provider 配置
      const currentProvider = {
        ...selectedProvider,
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        apiType: "openai",
        avatar: avatar,
      };

      // 先验证 API key
      const { isOk, errorMsg } = await handleCheckKey(currentProvider);

      if (!isOk) {
        toast.error(errorMsg || "API Key 验证失败");
        return;
      }

      // 验证成功后获取模型列表
      const models = await providerService.fetchModels(currentProvider);

      // 更新数据库中的模型
      await configService.updateProviderModels(selectedProvider.id, models);
    } catch (error) {
      logger.error("Failed to fetch models:", { error });
    } finally {
      setIsFetchingModels(false);
    }
  };

  // 如果没有选中provider，显示提示信息
  if (!selectedProvider) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-fg text-lg">选择Provider</h2>
          <p className="text-muted-fg text-sm">
            请从左侧列表中选择一个Provider来配置其设置
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-50px)] w-full flex-col gap-y-4 overflow-y-scroll px-6 pt-2 ">
      {/* 配置标题 */}
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-fg text-lg">
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
                <IconPicker value={avatar} onChange={handleIconChange} />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <span className="font-medium text-fg text-sm">
                  {t("add-provider-form.name")}
                </span>
                <TextField
                  value={name}
                  placeholder={t("add-provider-form.name-placeholder")}
                  className="[&_[role=group]]:!bg-muted [&_[role=group]]:!border-none [&_[role=group]]:!shadow-none [&_[role=group]]:focus-within:!ring-1 [&_[role=group]]:focus-within:!ring-primary w-full"
                  onChange={handleNameChange}
                />
              </div>
            </div>
          )}
          {/* Base URL 字段 */}
          <div className="flex flex-col gap-y-2">
            <TextField
              label="Base URL"
              value={baseUrl}
              placeholder="请输入Base URL"
              className="[&_[role=group]]:!bg-muted [&_[role=group]]:!rounded-xl [&_[role=group]]:!border-none [&_[role=group]]:!shadow-none [&_[role=group]]:focus-within:!ring-1 [&_[role=group]]:focus-within:!ring-primary w-full"
              onChange={handleBaseUrlChange}
            />
            <span className="text-muted-fg text-xs">
              {`${t("add-provider-form.api-forward")}：${baseUrl ?? ""}/chat/completions`}
            </span>
          </div>

          {/* API Key 字段 */}
          <div className="flex flex-col gap-2">
            <TextField
              label="API Key"
              type="password"
              isRevealable
              value={apiKey}
              placeholder="请输入API Key"
              className="[&_[role=group]]:!bg-muted [&_[role=group]]:!rounded-xl [&_[role=group]]:!border-none [&_[role=group]]:!shadow-none [&_[role=group]]:focus-within:!ring-1 [&_[role=group]]:focus-within:!ring-primary w-full"
              onChange={handleApiKeyChange}
            />
            {/* API Key 获取链接 */}

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
                selectedKey={apiType || "openai"}
                onSelectionChange={handleApiTypeChange}
              >
                <SelectTrigger className="!bg-muted !border-none !shadow-none focus-within:!ring-1 focus-within:!ring-primary group-data-open:!ring-1 group-data-open:!ring-primary h-9 cursor-pointer rounded-xl text-secondary-fg" />
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
          isFetchingModels={isFetchingModels}
        />
      </div>
    </div>
  );
}
