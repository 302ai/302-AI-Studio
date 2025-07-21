import { Button } from "@renderer/components/ui/button";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import type { Tool } from "@shared/triplit/types";
import { useCallback } from "react";

interface ToolCardProps {
  tool: Tool;
}

const { toolboxService } = window.service;

export function ToolCard({ tool }: ToolCardProps) {
  const { handleAddNewTab } = useTabBar();

  const handleToolPress = useCallback(async () => {
    const url = await toolboxService.getToolUrl(tool.toolId);
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const subdomain = hostname.split(".302.ai")[0];

    await handleAddNewTab("302ai-tool", tool.name, {
      subdomain,
    });
  }, [tool.toolId, handleAddNewTab, tool.name]);

  return (
    <Button
      intent="plain"
      size="sm"
      className="flex flex-row justify-between gap-x-1.5"
      onPress={handleToolPress}
    >
      <div>icon</div>
      <div className="flex w-full flex-col">
        <div className="text-fg">{tool.name}</div>
        <div className="line-clamp-1 text-muted-fg" title={tool.description}>
          {tool.description}
        </div>
      </div>
    </Button>
  );
}
