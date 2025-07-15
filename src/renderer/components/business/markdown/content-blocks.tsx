import { IconChevronRight } from "@intentui/icons";
import { Button } from "@renderer/components/ui/button";
import { useContentBlocks } from "@renderer/hooks/use-content-blocks";
import { cn } from "@renderer/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "./markdown-renderer";

interface ContentBlocksProps {
  content: string;
  messageId: string;
}

export function ContentBlocks({ content, messageId }: ContentBlocksProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  const { blocks } = useContentBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="mb-4">
      {blocks.map((block, index) => {
        const blockId = `${messageId}-${block.type}-${index}`;

        return (
          <div
            key={blockId}
            className={cn(
              "my-3 rounded-lg border border-muted-fg/30 border-dashed bg-muted/30 px-4 py-2",
              "hover:border-muted-fg/50",
            )}
          >
            <Button
              intent="plain"
              size="sq-sm"
              onPress={toggleCollapse}
              className="flex h-8 w-full cursor-pointer items-center gap-2 pressed:bg-transparent text-fg text-sm hover:bg-transparent"
            >
              <div className="flex w-full items-center gap-2">
                <motion.div
                  animate={{ rotate: isCollapsed ? 90 : -90 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <IconChevronRight className="size-5" />
                </motion.div>
                {block.type === "think" ? t("think") : t("reason")}

                <span className="ml-1 text-xs">
                  ({!block.isComplete ? t("outputing") : t("completed")})
                </span>
              </div>
            </Button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{
                    height: { duration: 0.3, ease: "easeInOut" },
                  }}
                  className="overflow-hidden"
                >
                  <div className="text-muted-fg text-sm leading-relaxed">
                    <MarkdownRenderer>{block.content}</MarkdownRenderer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
