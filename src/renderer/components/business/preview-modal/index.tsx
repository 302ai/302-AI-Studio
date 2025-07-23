import { Modal } from "@renderer/components/ui/modal";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import type { Attachment } from "@shared/triplit/types";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

const ImagePreview = lazy(() => import("./image-preview"));
const DocumentPreview = lazy(() => import("./document-preview"));
const CodePreview = lazy(() => import("./code-preview"));
const AudioPreview = lazy(() => import("./audio-preview"));
const TextPreview = lazy(() => import("./text-preview"));
const DefaultPreview = lazy(() => import("./default-preview"));

// Union type to handle both Attachment and AttachmentFile
type PreviewableAttachment = Attachment | AttachmentFile;

interface PreviewModalProps {
  attachment: PreviewableAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

function getPreviewComponent(attachment: PreviewableAttachment) {
  const { type, name } = attachment;

  // Image files
  if (type.startsWith("image/")) {
    return ImagePreview;
  }

  // Document files
  if (
    type === "application/pdf" ||
    type === "application/msword" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/vnd.ms-powerpoint" ||
    type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return DocumentPreview;
  }

  // Code files (with syntax highlighting)
  if (
    type.includes("javascript") ||
    type.includes("typescript") ||
    type.includes("json") ||
    name.match(
      /\.(rs|js|ts|tsx|jsx|py|java|cpp|c|h|css|html|xml|yaml|yml|md|json|rs|go|php|rb|swift|dart|lua|perl|r|sql|sh|bash|zsh|fish|ps1|dockerfile|makefile|gitignore|toml|ini|scss|sass|less)$/i,
    )
  ) {
    return CodePreview;
  }

  // Plain text files
  if (type.startsWith("text/") || name.match(/\.(txt|log|cfg|conf|config)$/i)) {
    return TextPreview;
  }

  // Audio files
  if (type.startsWith("audio/")) {
    return AudioPreview;
  }

  // Excel and other spreadsheet files
  if (
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    type.includes("csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    return TextPreview; // Display as text for now
  }

  return DefaultPreview;
}

function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-fg" />
    </div>
  );
}

export function PreviewModal({
  attachment,
  isOpen,
  onClose,
}: PreviewModalProps) {
  if (!attachment) return null;

  const PreviewComponent = getPreviewComponent(attachment);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <Modal.Content
        size="5xl"
        closeButton={false}
        className="max-h-[90vh] overflow-hidden p-0"
      >
        <Suspense fallback={<LoadingSpinner />}>
          <PreviewComponent
            attachment={attachment as Attachment}
            onClose={onClose}
          />
        </Suspense>
      </Modal.Content>
    </Modal>
  );
}
