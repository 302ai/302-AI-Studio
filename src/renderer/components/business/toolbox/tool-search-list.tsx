import type { ToolCategory } from "@renderer/hooks/use-toolbox";
import { ToolCard } from "./tool-card";

interface ToolSearchListProps {
  categorizedTools: ToolCategory[];
}

export function ToolSearchList({ categorizedTools }: ToolSearchListProps) {
  return (
    <div className="flex flex-col gap-y-2">
      {categorizedTools.flatMap((category) =>
        category.tools.map((tool) => <ToolCard key={tool.id} tool={tool} />),
      )}
    </div>
  );
}
