import { ModelIcon } from "../../model-icon";

interface MessageHeaderProps {
  providerName: string;
  modelName: string;
}

export function MessageHeader({ providerName, modelName }: MessageHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <ModelIcon className="size-6" modelName={providerName} />
      <div className="text-muted-fg text-xs">{modelName}</div>
    </div>
  );
}
