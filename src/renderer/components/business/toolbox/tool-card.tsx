import { useToolbox } from "@renderer/hooks/use-toolbox";
import { cn } from "@renderer/lib/utils";
import type { Tool } from "@shared/triplit/types";
import { ActionGroup } from "../action-group";
import { ButtonWithTooltip } from "../button-with-tooltip";
import { ToolIcon } from "./tool-icon";

interface ToolCardProps {
  tool: Tool;
  className?: string;
  tooltipPlacement?: "left" | "right" | "top" | "bottom";
}

export function ToolCard({
  tool,
  className,
  tooltipPlacement = "left",
}: ToolCardProps) {
  const { handleToolPress, handleToolCollection } = useToolbox();

  return (
    <div className="relative max-w-[228px]">
      <ButtonWithTooltip
        title={tool.name}
        tooltipPlacement={tooltipPlacement}
        intent="plain"
        size="sm"
        className={cn(
          "flex h-[50px] w-full flex-row justify-between gap-x-1.5 bg-bg",
          className,
        )}
        onPress={() => handleToolPress(tool)}
      >
        <div className="flex flex-row items-center gap-1.5">
          <ToolIcon toolId={tool.toolId} />
          <div className="flex flex-col items-start justify-start pr-7">
            <p className="line-clamp-1 text-left text-fg text-sm">
              {tool.name}
            </p>
            <p
              className="line-clamp-1 text-left text-muted-fg text-xs"
              title={tool.description}
            >
              {tool.description}
            </p>
          </div>
        </div>
      </ButtonWithTooltip>

      <ActionGroup
        onStar={() => handleToolCollection(tool.toolId, !tool.collected)}
        stared={tool.collected}
        className="-translate-y-1/2 absolute top-1/2 right-1"
      />
    </div>
  );
}
