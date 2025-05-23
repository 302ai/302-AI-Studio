/** biome-ignore-all lint/a11y/useSemanticElements: ignore seSemanticElements */
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { Avatar } from "@renderer/components/ui/avatar";
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { getProviderIcon } from "@renderer/config/providers";
import { cn } from "@renderer/lib/utils";
import type { ModelProvider } from "@renderer/types/providers";
import { useTranslation } from "react-i18next";

interface ProviderCardProps {
  snapshot: DraggableStateSnapshot;
  provided: DraggableProvided;
  provider: ModelProvider;
  actionGroup: React.ReactNode;
  onClick?: () => void;
}

export function ProviderCard({
  snapshot,
  provided,
  provider,
  actionGroup,
  onClick,
}: ProviderCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "group flex h-[60px] flex-row items-center justify-between rounded-xl border bg-bg py-4 hover:bg-hover-primary",
        snapshot.isDragging && "bg-hover-primary opacity-50"
      )}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        cursor: "pointer",
        marginBottom: 5,
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={provider.name}
    >
      <CardHeader className="flex items-center gap-3 pl-4">
        <Avatar
          src={getProviderIcon(provider.id)}
          size="large"
          shape="circle"
        />
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">{provider.name}</CardTitle>
          <CardDescription className="text-xs">
            {provider.models.length}
            {t("settings.model-settings.model-provider.description")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="pr-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {actionGroup}
      </CardFooter>
    </div>
  );
}
