import { IconChevronRight } from "@intentui/icons";
import { Button } from "@renderer/components/ui/button";
import { useContentBlocks } from "@renderer/hooks/use-content-blocks";
import { cn } from "@renderer/lib/utils";
import type { Settings } from "@shared/triplit/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "./markdown-renderer";

interface ContentBlocksProps {
  content: string;
  messageId: string;
  settings: Settings[];
}

export function ContentBlocks({
  content,
  messageId,
  settings,
}: ContentBlocksProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });
  const setting = settings?.[0];
  const hideReason = setting?.hideReason ?? false;
  const collapseThinkBlock = setting?.collapseThinkBlock ?? true;
  const disableMarkdown = setting?.disableMarkdown ?? false;

  const { blocks } = useContentBlocks(content);

  const [collapsedStates, setCollapsedStates] = useState<
    Record<string, boolean>
  >(() => {
    if (!collapseThinkBlock) return {};
    // 给完成的block设置折叠状态
    const initialStates: Record<string, boolean> = {};
    blocks.forEach((block, index) => {
      const blockId = `${messageId}-${block.type}-${index}`;
      if (block.isComplete) {
        initialStates[blockId] = true;
      }
    });
    return initialStates;
  });

  const previousCompleteStates = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (hideReason) return;
    // 输出完自动折叠
    blocks.forEach((block, index) => {
      const blockId = `${messageId}-${block.type}-${index}`;
      const wasComplete = previousCompleteStates.current[blockId];
      const isNowComplete = block.isComplete;

      if (!wasComplete && isNowComplete && collapseThinkBlock) {
        setCollapsedStates((prev) => ({
          ...prev,
          [blockId]: true,
        }));
      }

      previousCompleteStates.current[blockId] = isNowComplete;
    });
  }, [blocks, messageId, collapseThinkBlock, hideReason]);

  if (hideReason || blocks.length === 0) {
    return null;
  }

  const toggleCollapse = (blockId: string) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  return (
    <div className="mb-4">
      {blocks.map((block, index) => {
        const blockId = `${messageId}-${block.type}-${index}`;
        const isCollapsed = collapsedStates[blockId] ?? false;

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
              size="sm"
              onPress={() => toggleCollapse(blockId)}
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
                    {disableMarkdown ? (
                      <div className="whitespace-pre-wrap">{block.content}</div>
                    ) : (
                      <MarkdownRenderer settings={settings}>
                        {block.content}
                      </MarkdownRenderer>
                    )}
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
