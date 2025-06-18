import { useMemo } from "react";

interface ThinkBlock {
  content: string;
  isComplete: boolean;
}

interface ThinkBlocksResult {
  thinkBlocks: ThinkBlock[] | null;
  cleanContent: string;
}

// Hook to extract think content and clean content with streaming support
export function useThinkBlocks(content: string): ThinkBlocksResult {
  return useMemo(() => {
    // Find all complete think blocks
    const completeThinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const completeMatches = Array.from(content.matchAll(completeThinkRegex));

    // Check for incomplete think block (has <think> but no closing </think>)
    const lastThinkStart = content.lastIndexOf("<think>");
    const lastThinkEnd = content.lastIndexOf("</think>");
    const hasIncomplete = lastThinkStart > lastThinkEnd;

    const thinkBlocks: ThinkBlock[] = [];
    let cleanedContent = content;

    // Add complete think blocks
    completeMatches.forEach((match) => {
      const thinkContent = match[1].trim();
      if (thinkContent.length > 0) {
        thinkBlocks.push({ content: thinkContent, isComplete: true });
      }
    });

    // Handle incomplete think block
    if (hasIncomplete) {
      const incompleteContent = content.substring(lastThinkStart + 7); // +7 for '<think>'
      if (incompleteContent.trim().length > 0) {
        thinkBlocks.push({
          content: incompleteContent.trim(),
          isComplete: false,
        });
      }
      // Remove the incomplete think block from cleaned content
      cleanedContent = content.substring(0, lastThinkStart);
    }

    // Remove all complete think tags from cleaned content
    cleanedContent = cleanedContent.replace(completeThinkRegex, "").trim();

    return {
      thinkBlocks: thinkBlocks.length > 0 ? thinkBlocks : null,
      cleanContent: cleanedContent,
    };
  }, [content]);
}

export type { ThinkBlock, ThinkBlocksResult };
