import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { cn } from "@renderer/lib/utils";
import type { Tool } from "@shared/triplit/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ButtonWithTooltip } from "../button-with-tooltip";

interface ToolCardProps {
  tool: Tool;
  className?: string;
  showDescription?: boolean;
  tooltipPlacement?: "left" | "right" | "top" | "bottom";
}

const { toolboxService } = window.service;

export function ToolCard({
  tool,
  className,
  showDescription = true,
  tooltipPlacement = "left",
}: ToolCardProps) {
  const { t } = useTranslation();
  const { handleAddNewTab } = useTabBar();

  const handleToolPress = useCallback(async () => {
    const result = await toolboxService.getToolUrl(tool.toolId);
    if (!result.isOk) {
      toast.error(t("toolbox-error-msg"));
      return;
    }

    const subdomain = new URL(result.url).hostname.split(".302.ai")[0];
    await handleAddNewTab("302ai-tool", tool.name, {
      subdomain,
    });
  }, [tool.toolId, handleAddNewTab, tool.name, t]);

  return (
    <ButtonWithTooltip
      title={tool.name}
      tooltipPlacement={tooltipPlacement}
      intent="plain"
      size="sm"
      className={cn(
        "flex h-[50px] max-w-[228px] flex-row justify-between gap-x-1.5 bg-bg",
        className,
      )}
      onPress={handleToolPress}
    >
      <div className="flex w-full flex-col">
        <div className="line-clamp-1 text-fg">{tool.name}</div>
        <div
          className={cn("line-clamp-1 text-muted-fg", {
            hidden: !showDescription,
          })}
          title={tool.description}
        >
          {tool.description}
        </div>
      </div>
    </ButtonWithTooltip>
  );
}
