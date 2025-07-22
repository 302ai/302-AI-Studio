import { ContentBlocks } from "@renderer/components/business/markdown/content-blocks";
import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import { useContentBlocks } from "@renderer/hooks/use-content-blocks";
import { MessageAttachments } from "../message-attachments";

interface MessageContentProps {
  messageId: string;
  content: string;
  isThinkBlockCollapsed: boolean;
}

export function MessageContent({
  messageId,
  content,
  isThinkBlockCollapsed,
}: MessageContentProps) {
  const { cleanContent } = useContentBlocks(content);

  return (
    <div className="w-full min-w-0">
      <MessageAttachments messageId={messageId} className="mb-2" />

      <ContentBlocks
        content={content}
        messageId={messageId}
        isThinkBlockCollapsed={isThinkBlockCollapsed}
      />

      {cleanContent && (
        <div className="overflow-wrap-anywhere w-full break-words break-all text-fg">
          <MarkdownRenderer>{cleanContent}</MarkdownRenderer>
        </div>
      )}
    </div>
  );
}
