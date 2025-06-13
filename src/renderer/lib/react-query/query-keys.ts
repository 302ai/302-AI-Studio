export const queryKeys = {
  // 配置相关查询
  config: {
    models: ["config", "models"] as const,
  },
} as const;

/**
 * 查询键工具函数
 */
export const queryKeyUtils = {
  /**
   * 使查询键失效
   * @param keys 查询键数组
   */
  invalidate: (keys: readonly unknown[]) => keys,

  /**
   * 移除查询缓存
   * @param keys 查询键数组
   */
  remove: (keys: readonly unknown[]) => keys,

  /**
   * 获取查询键的字符串表示
   * @param keys 查询键数组
   */
  toString: (keys: readonly unknown[]) => JSON.stringify(keys),
};

/**
 * 查询键类型定义
 */
export type QueryKeys = typeof queryKeys;
export type ConfigQueryKeys = typeof queryKeys.config;
