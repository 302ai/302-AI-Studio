import type { Tool } from "@shared/triplit/types";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTabBar } from "./use-tab-bar";
import { useTriplit } from "./use-triplit";

export interface ToolCategory {
  category: string;
  categoryId: number;
  tools: Tool[];
}

const { toolboxService } = window.service;

export function useToolbox() {
  const { t } = useTranslation("translation", {
    keyPrefix: "toolbox",
  });

  const { toolbox, toolboxFetching } = useTriplit();
  const { handleAddNewTab } = useTabBar();

  const [searchQuery, setSearchQuery] = useState("");

  const handleToolPress = useCallback(
    async (tool: Tool) => {
      const result = await toolboxService.getToolUrl(tool.toolId);
      if (!result.isOk) {
        toast.error(t("tool-press-error-msg"));
        return;
      }

      const subdomain = new URL(result.url).hostname.split(".302.ai")[0];
      await handleAddNewTab("302ai-tool", tool.name, {
        subdomain,
      });
    },
    [handleAddNewTab, t],
  );

  const handleToolCollection = useCallback(
    async (toolId: number, collected: boolean) => {
      const result = await toolboxService.updateToolCollection(
        toolId,
        collected,
      );
      if (!result.isOk) {
        toast.error(t("tool-collection-error-msg"));
      }
    },
    [t],
  );

  const categorizedTools = useMemo(() => {
    if (!toolbox) return [];

    const filteredTools = toolbox.filter((tool) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    });

    // * Create favorites category
    const collectedTools = filteredTools.filter((tool) => tool.collected);
    const favoritesCategory: ToolCategory = {
      category: t("favorites"),
      categoryId: -1,
      tools: collectedTools,
    };

    const groupedByCategory = filteredTools.reduce(
      (acc, tool) => {
        const key = tool.category;
        if (!acc[key]) {
          acc[key] = {
            category: tool.category,
            categoryId: tool.categoryId,
            tools: [],
          };
        }
        acc[key].tools.push(tool);
        return acc;
      },
      {} as Record<string, ToolCategory>,
    );

    const categorizedList = Object.values(groupedByCategory).sort(
      (a, b) => a.categoryId - b.categoryId,
    );

    if (collectedTools.length > 0) {
      return [favoritesCategory, ...categorizedList];
    }

    return categorizedList;
  }, [toolbox, searchQuery, t]);

  const fontDisplayTools = useMemo(() => {
    if (!toolbox || toolbox.length === 0) return [];

    const collectedTools = toolbox.filter((tool) => tool.collected);

    if (collectedTools.length > 0) {
      return collectedTools.slice(0, Math.min(4, collectedTools.length));
    } else {
      const shuffled = [...toolbox].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(4, shuffled.length));
    }
  }, [toolbox]);

  return {
    fontDisplayTools,
    categorizedTools,
    setSearchQuery,
    searchQuery,
    toolboxFetching,
    handleToolPress,
    handleToolCollection,
  };
}
