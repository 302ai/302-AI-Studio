import { useMemo } from "react";

export interface ContentBlock {
  type: "think" | "reason";
  content: string;
  isComplete: boolean;
}

export interface ContentBlocksResult {
  blocks: ContentBlock[];
  cleanContent: string;
}

export function useContentBlocks(content: string): ContentBlocksResult {
  return useMemo(() => {
    const blocks: ContentBlock[] = [];
    let cleanedContent = content;

    const hasThinkStart = content.includes("<think>");

    if (hasThinkStart) {
      const completeThinkRegex = /<think>([\s\S]*?)<\/think>/g;
      const completeThinkMatches = Array.from(
        content.matchAll(completeThinkRegex),
      );

      completeThinkMatches.forEach((match) => {
        const thinkContent = match[1].trim();
        if (thinkContent.length > 0) {
          blocks.push({
            type: "think",
            content: thinkContent,
            isComplete: true,
          });
        }
      });

      const lastThinkStart = content.lastIndexOf("<think>");
      const lastThinkEnd = content.lastIndexOf("</think>");
      const hasIncompleteThink = lastThinkStart > lastThinkEnd;

      if (hasIncompleteThink) {
        const incompleteContent = content.substring(lastThinkStart + 7).trim();
        if (incompleteContent.length > 0) {
          blocks.push({
            type: "think",
            content: incompleteContent,
            isComplete: false,
          });
        }
        cleanedContent = cleanedContent.substring(0, lastThinkStart);
      }

      cleanedContent = cleanedContent
        .replace(completeThinkRegex, "")
        .replace(/<reason>[\s\S]*?<\/reason>/g, "")
        .trim();
    } else {
      const completeReasonRegex = /<reason>([\s\S]*?)<\/reason>/g;
      const completeReasonMatches = Array.from(
        content.matchAll(completeReasonRegex),
      );

      completeReasonMatches.forEach((match) => {
        const reasonContent = match[1].trim();
        if (reasonContent.length > 0) {
          blocks.push({
            type: "reason",
            content: reasonContent,
            isComplete: true,
          });
        }
      });

      const lastReasonStart = content.lastIndexOf("<reason>");
      const lastReasonEnd = content.lastIndexOf("</reason>");
      const hasIncompleteReason = lastReasonStart > lastReasonEnd;

      if (hasIncompleteReason) {
        const incompleteContent = content.substring(lastReasonStart + 8).trim();
        if (incompleteContent.length > 0) {
          blocks.push({
            type: "reason",
            content: incompleteContent,
            isComplete: false,
          });
        }
        cleanedContent = cleanedContent.substring(0, lastReasonStart);
      }

      cleanedContent = cleanedContent.replace(completeReasonRegex, "").trim();
    }

    return {
      blocks,
      cleanContent: cleanedContent,
    };
  }, [content]);
}
