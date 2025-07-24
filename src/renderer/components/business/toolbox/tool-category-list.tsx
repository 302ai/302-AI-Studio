import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@renderer/components/ui/disclosure-group";
import type { ToolCategory } from "@renderer/hooks/use-toolbox";
import { motion } from "motion/react";
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
          {({ isExpanded }) => (
            <>
              <DisclosureTrigger className="w-[228px] rounded-[10px] px-[10px] hover:bg-hover">
                <span className="whitespace-nowrap">{category.category}</span>
              </DisclosureTrigger>
              <DisclosurePanel>
                {isExpanded && (
                  <motion.div
                    className="flex flex-col gap-y-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                  >
                    {category.tools.map((tool) => (
                      <motion.div
                        key={tool.id}
                        variants={{
                          hidden: { opacity: 0, x: -50 },
                          visible: {
                            opacity: 1,
                            x: 0,
                            transition: { duration: 0.3, ease: "easeOut" },
                          },
                        }}
                      >
                        <ToolCard tool={tool} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ))}
    </DisclosureGroup>
  );
}
