import type { Tool } from "@shared/triplit/types";
import { useMemo, useState } from "react";
import { useTriplit } from "./use-triplit";

export interface ToolCategory {
  category: string;
  categoryId: number;
  tools: Tool[];
}

export function useToolbox() {
  const { toolbox, toolboxFetching } = useTriplit();
  const [searchQuery, setSearchQuery] = useState("");

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

    return Object.values(groupedByCategory).sort(
      (a, b) => a.categoryId - b.categoryId,
    );
  }, [toolbox, searchQuery]);

  const randomTools = useMemo(() => {
    if (!toolbox || toolbox.length === 0) return [];

    const shuffled = [...toolbox].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(4, shuffled.length));
  }, [toolbox]);

  return {
    randomTools,
    categorizedTools,
    setSearchQuery,
    searchQuery,
    toolboxFetching,
  };
}
