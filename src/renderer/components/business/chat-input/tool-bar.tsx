import { AttachmentUploader } from "./attachment-uploader";

export function ToolBar() {
  return (
    <div className="flex h-[var(--chat-input-toolbar-height)] flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-x-2">
        <AttachmentUploader />
      </div>
    </div>
  );
}
