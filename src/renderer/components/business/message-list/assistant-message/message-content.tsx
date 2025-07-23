import { ContentBlocks } from "@renderer/components/business/markdown/content-blocks";
import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import { useContentBlocks } from "@renderer/hooks/use-content-blocks";
import type { Settings } from "@shared/triplit/types";
import { MessageAttachments } from "../message-attachments";

interface MessageContentProps {
  messageId: string;
  content: string;
  settings: Settings[];
}

export function MessageContent({
  messageId,
  content,
  settings,
}: MessageContentProps) {
  const { cleanContent } = useContentBlocks(content);

  return (
    <div className="w-full min-w-0">
      <MessageAttachments messageId={messageId} className="mb-2" />

      <ContentBlocks
        content={content}
        messageId={messageId}
        settings={settings}
      />

      {cleanContent && (
        <div className="overflow-wrap-anywhere w-full break-words break-all text-fg">
          <MarkdownRenderer settings={settings}>
            {cleanContent}
          </MarkdownRenderer>
        </div>
      )}
    </div>
  );
}
