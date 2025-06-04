import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { AttachmentItem } from "./attachment-item";
import { cn } from "@renderer/lib/utils";

interface AttachmentListProps {
  attachments: AttachmentFile[];
  onRemove: (id: string) => void;
  className?: string;
}

export function AttachmentList({
  attachments,
  onRemove,
  className,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
