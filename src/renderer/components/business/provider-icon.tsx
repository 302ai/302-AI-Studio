import { ModelIcon } from "@renderer/components/business/model-icon";
import { cn } from "@renderer/lib/utils";

interface ProviderIconProps {
  provider: {
    name: string;
    avatar?: string | null;
  };
  className?: string;
}

export function ProviderIcon({ provider, className }: ProviderIconProps) {
  if (provider.avatar?.startsWith("data:image/")) {
    return (
      <img
        src={provider.avatar}
        alt={provider.name}
        className={cn("h-4 w-4 rounded-full", className)}
      />
    );
  }

  const modelName = provider.avatar || provider.name || "";
  return <ModelIcon modelName={modelName} className={className} />;
}
