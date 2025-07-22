import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@renderer/components/ui/disclosure-group";
import type { ToolCategory } from "@renderer/hooks/use-toolbox";
import { ToolCard } from "./tool-card";

interface ToolCategoryListProps {
  categorizedTools: ToolCategory[];
}

export function ToolCategoryList({ categorizedTools }: ToolCategoryListProps) {
  return (
    <DisclosureGroup
      allowsMultipleExpanded
      defaultExpandedKeys={categorizedTools.map(
        (category) => category.category,
      )}
    >
      {categorizedTools.map((category) => (
        <Disclosure
          className="border-0"
          key={category.category}
          id={category.category}
        >
          <DisclosureTrigger className="pt-0 pr-4">
            <span className="flex items-center gap-x-2">
              <span className="font-medium">{category.category}</span>
              <span className="text-muted-fg text-xs">
                ({category.tools.length})
              </span>
            </span>
          </DisclosureTrigger>
          <DisclosurePanel className="pr-4">
            <div className="flex flex-col gap-y-2">
              {category.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </DisclosurePanel>
        </Disclosure>
      ))}
    </DisclosureGroup>
  );
}
