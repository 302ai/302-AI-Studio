import { MessageAttachments } from "../message-attachments";
import { LinkifiedText } from "./linkified-text";

interface MessageContentProps {
  messageId: string;
  content: string;
}

export function MessageContent({ messageId, content }: MessageContentProps) {
  return (
    <div className="rounded-lg bg-accent px-4 py-3">
      <MessageAttachments messageId={messageId} />

      <div className="overflow-wrap-anywhere w-full break-words break-all text-accent-fg">
        <LinkifiedText text={content} />
      </div>
    </div>
  );
}
