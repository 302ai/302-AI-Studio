import { Button } from "@renderer/components/ui/button";
import { useToolbox } from "@renderer/hooks/use-toolbox";
import { cn } from "@renderer/lib/utils";
import type { Tool } from "@shared/triplit/types";
import { ToolIcon } from "./tool-icon";

interface FontDisplayToolCardProps {
  tool: Tool;
  className?: string;
}

export function FontDisplayToolCard({
  tool,
  className,
}: FontDisplayToolCardProps) {
  const { handleToolPress } = useToolbox();

  return (
    <Button
      intent="plain"
      size="sm"
      className={cn(
        "flex h-[44px] cursor-pointer flex-row justify-between gap-x-1.5",
        className,
      )}
      onPress={() => handleToolPress(tool)}
    >
      <div className="flex flex-row items-center gap-1.5">
        <ToolIcon className="h-7 w-7" toolId={tool.toolId} />
        <p className="line-clamp-1 text-left text-fg text-sm">{tool.name}</p>
      </div>
    </Button>
  );
}
