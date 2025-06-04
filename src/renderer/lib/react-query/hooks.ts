import { Logger } from "@renderer/config/logger";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export const useConfigQueries = () => {
  const useModels = (options?: UseQueryOptions<ApiResponse<any>, ApiError>) => {
    return useQuery({
      queryKey: queryKeys.config.models,
      queryFn: async () => {
        try {
          const result = await window.service.configService.getProviderModels(
            "openai"
          );
          Logger.info("获取应用配置成功", result);
          return { success: true, data: result };
        } catch (error) {
          Logger.error("获取应用配置失败", error);
          throw {
            code: "CONFIG_FETCH_ERROR",
            message: "获取应用配置失败",
            details: error,
          } as ApiError;
        }
      },

      staleTime: 5 * 60 * 1000, // 5分钟
      ...options,
    });
  };

  return {
    useModels,
  };
};
