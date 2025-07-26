import type { Settings } from "@shared/triplit/types";

import { settingsQueries } from "../definitions/settings-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有settings记录
 */
export function useSettings(
  config?: QueryConfig<"settings">,
): QueryResult<Settings[]> {
  return useStandardQuery(settingsQueries.all, config);
}

/**
 * 获取第一个(主要的)settings记录
 */
export function useSettingsOne(
  config?: QueryOneConfig<"settings">,
): QueryResult<Settings | null> {
  return useStandardQueryOne(settingsQueries.all, config);
}

/**
 * 获取特定的settings值
 */
export function useSettingsValue<K extends keyof Settings>(
  key: K,
  config?: QueryConfig<"settings", Settings[K] | undefined>,
): QueryResult<Settings[K] | undefined> {
  return useStandardQuery(settingsQueries.all, {
    ...config,
    select: (data) => data?.[0]?.[key],
  });
}

/**
 * 获取主题设置
 */
export function useThemeSetting(
  config?: QueryConfig<"settings", Settings["theme"] | undefined>,
) {
  return useSettingsValue("theme", config);
}

/**
 * 获取语言设置
 */
export function useLanguageSetting(
  config?: QueryConfig<"settings", Settings["language"] | undefined>,
) {
  return useSettingsValue("language", config);
}

/**
 * 获取隐私模式设置
 */
export function usePrivacySetting(
  config?: QueryConfig<"settings", Settings["isPrivate"] | undefined>,
) {
  return useSettingsValue("isPrivate", config);
}

/**
 * 获取选中的模型ID
 */
export function useSelectedModelId(
  config?: QueryConfig<"settings", Settings["selectedModelId"] | undefined>,
) {
  return useSettingsValue("selectedModelId", config);
}

/**
 * 获取新聊天模型ID设置
 */
export function useNewChatModelId(
  config?: QueryConfig<"settings", Settings["newChatModelId"] | undefined>,
) {
  return useSettingsValue("newChatModelId", config);
}

/**
 * 获取流式输出平滑器设置
 */
export function useStreamSmootherSetting(
  config?: QueryConfig<
    "settings",
    Settings["streamSmootherEnabled"] | undefined
  >,
) {
  return useSettingsValue("streamSmootherEnabled", config);
}

/**
 * 获取搜索服务设置
 */
export function useSearchServiceSetting(
  config?: QueryConfig<"settings", Settings["searchService"] | undefined>,
) {
  return useSettingsValue("searchService", config);
}

/**
 * 获取是否显示应用商店设置
 */
export function useDisplayAppStoreSetting(
  config?: QueryConfig<"settings", Settings["displayAppStore"] | undefined>,
) {
  return useSettingsValue("displayAppStore", config);
}

/**
 * 获取默认隐私模式设置
 */
export function useDefaultPrivacyModeSetting(
  config?: QueryConfig<"settings", Settings["defaultPrivacyMode"] | undefined>,
) {
  return useSettingsValue("defaultPrivacyMode", config);
}
