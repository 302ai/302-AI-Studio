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
          className="flex flex-col gap-y-1.5 border-0"
          key={category.category}
          id={category.category}
        >
          <DisclosureTrigger className="w-[228px] rounded-[10px] px-[10px] hover:bg-hover">
            <span className="whitespace-nowrap">{category.category}</span>
          </DisclosureTrigger>
          <DisclosurePanel>
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
