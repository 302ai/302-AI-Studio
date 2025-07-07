import logger from "@shared/logger/renderer-logger";
import { QueryClient } from "@tanstack/react-query";

/**
 * React Query 客户端配置
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据保持新鲜时间：5分钟
      staleTime: 5 * 60 * 1000,
      // 缓存时间：10分钟
      gcTime: 10 * 60 * 1000,
      // 重试配置
      retry: (failureCount, error) => {
        // 对于网络错误，最多重试3次
        if (error instanceof Error && error.message.includes("network")) {
          return failureCount < 3;
        }
        // 对于其他错误，最多重试1次
        return failureCount < 1;
      },
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口重新获得焦点时重新获取数据
      refetchOnWindowFocus: false,
      // 网络重连时重新获取数据
      refetchOnReconnect: true,
    },
    mutations: {
      // 变更重试配置
      retry: 1,
      // 变更重试延迟
      retryDelay: 1000,
    },
  },
});

/**
 * 查询客户端事件监听器
 */
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === "observerResultsUpdated") {
    const { query } = event;
    if (query.state.error) {
      logger.error("Query error:", {
        queryKey: query.queryKey,
        error: query.state.error,
      });
    }
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === "updated") {
    const { mutation } = event;
    if (mutation.state.error) {
      logger.error("Mutation error:", {
        mutationKey: mutation.options.mutationKey,
        error: mutation.state.error,
      });
    }
  }
});
