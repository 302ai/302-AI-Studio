import type { Shortcut } from "@shared/triplit/types";

import { shortcutsQueries } from "../definitions/shortcuts-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有shortcuts记录
 */
export function useShortcuts(
  config?: QueryConfig<"shortcuts">,
): QueryResult<Shortcut[]> {
  return useStandardQuery(shortcutsQueries.all, config);
}

/**
 * 根据ID获取单个shortcut
 */
export function useShortcut(
  id: string,
  config?: QueryOneConfig<"shortcuts">,
): QueryResult<Shortcut | null> {
  return useStandardQueryOne(() => shortcutsQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 根据作用域获取shortcuts
 */
export function useShortcutsByScope(
  scope: Shortcut["scope"],
  config?: QueryConfig<"shortcuts">,
): QueryResult<Shortcut[]> {
  return useStandardQuery(() => shortcutsQueries.byScope(scope), {
    ...config,
    enabled: !!scope && config?.enabled !== false,
  });
}

/**
 * 根据操作获取shortcuts
 */
export function useShortcutsByAction(
  action: Shortcut["action"],
  config?: QueryConfig<"shortcuts">,
): QueryResult<Shortcut[]> {
  return useStandardQuery(() => shortcutsQueries.byAction(action), {
    ...config,
    enabled: !!action && config?.enabled !== false,
  });
}
