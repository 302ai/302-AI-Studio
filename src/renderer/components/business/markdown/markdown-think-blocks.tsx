import { useThinkBlocks } from "@renderer/hooks/use-think-blocks";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "./markdown-renderer";

interface ThinkBlocksProps {
  content: string;
  messageId: string;
}

// Component to render think blocks
export function ThinkBlocks({ content, messageId }: ThinkBlocksProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const { thinkBlocks } = useThinkBlocks(content);

  if (!thinkBlocks) {
    return null;
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="mb-4">
      {thinkBlocks.map((thinkBlock, index) => (
        <div
          key={`${messageId}-${index}-${thinkBlock.content.length}`}
          className="my-3 rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 p-4"
        >
          <div className="mb-2 flex items-center gap-2 font-medium text-muted-foreground text-sm">
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex h-4 w-4 cursor-pointer items-center justify-center transition-colors hover:text-foreground"
              aria-label={
                isCollapsed ? "Expand think content" : "Collapse think content"
              }
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {t("think")}
            {!thinkBlock.isComplete && (
              <span className="ml-1 text-xs opacity-60">
                ({t("outputing")})
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="text-muted-foreground text-sm leading-relaxed ">
              <MarkdownRenderer>{thinkBlock.content}</MarkdownRenderer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
