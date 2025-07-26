import { triplitClient } from "@renderer/client";
import type { BaseQueries } from "../types";

/**
 * Shortcuts 集合的标准查询定义
 */
export const shortcutsQueries: BaseQueries<"shortcuts"> & {
  /** 根据ID获取单个shortcut */
  byId: (id: string) => ReturnType<typeof triplitClient.query<"shortcuts">>;
  /** 根据作用域获取shortcuts */
  byScope: (
    scope: import("@shared/triplit/types").ShortcutScope,
  ) => ReturnType<typeof triplitClient.query<"shortcuts">>;
  /** 根据操作获取shortcuts */
  byAction: (
    action: import("@shared/triplit/types").ShortcutAction,
  ) => ReturnType<typeof triplitClient.query<"shortcuts">>;
} = {
  /**
   * 获取所有 shortcuts 记录
   */
  all: () => triplitClient.query("shortcuts"),

  /**
   * 根据ID获取单个 shortcut
   */
  byId: (id: string) => triplitClient.query("shortcuts").Id(id),

  /**
   * 根据作用域获取 shortcuts
   */
  byScope: (scope) =>
    triplitClient.query("shortcuts").Where("scope", "=", scope),

  /**
   * 根据操作获取 shortcuts
   */
  byAction: (action) =>
    triplitClient.query("shortcuts").Where("action", "=", action),
} as const;
