import { Button } from "@renderer/components/ui/button";
import type { Tool } from "@shared/triplit/types";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Button
      intent="plain"
      size="sm"
      className="flex flex-row justify-between gap-x-1.5"
      onPress={() => {
        console.log(tool);
      }}
    >
      <div>icon</div>
      <div className="flex flex-col">
        <div className="text-fg">{tool.name}</div>
        <div className="line-clamp-1 text-muted-fg">{tool.description}</div>
      </div>
    </Button>
  );
}
