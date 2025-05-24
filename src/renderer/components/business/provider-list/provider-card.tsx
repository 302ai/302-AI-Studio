/** biome-ignore-all lint/a11y/useSemanticElements: ignore seSemanticElements */
import type { DraggableProvided } from "@hello-pangea/dnd";
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { cn } from "@renderer/lib/utils";
import type { ModelProvider } from "@renderer/types/providers";
import { useTranslation } from "react-i18next";
import { ModelIcon } from "../model-icon";

interface ProviderCardProps {
  provided: DraggableProvided;
  provider: ModelProvider;
  actionGroup: React.ReactNode;
  style?: React.CSSProperties;
  isDragging?: boolean;
  onClick?: () => void;
}

export function ProviderCard({
  provided,
  provider,
  actionGroup,
  style,
  isDragging,
  onClick,
}: ProviderCardProps) {
  const { t } = useTranslation();

  const getStyle = ({ provided, style, isDragging }) => {
    const combined = {
      ...style,
      ...provided.draggableProps.style,
    };
    const marginBottom = 5;
    const withSpacing = {
      ...combined,
      height: isDragging ? combined.height : combined.height - marginBottom,
      marginBottom,
      cursor: "pointer",
    };
    return withSpacing;
  };

  return (
    <div
      className={cn(
        "group flex h-[60px] flex-row items-center justify-between rounded-xl border bg-bg py-4 hover:bg-hover-primary",
        isDragging && "bg-hover-primary opacity-50"
      )}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
      style={getStyle({ provided, style, isDragging })}
      role="button"
      tabIndex={0}
      aria-label={provider.name}
    >
      <CardHeader className="flex items-center gap-3 pl-4">
        <ModelIcon modelId={provider.id} className="size-8" />
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">{provider.name}</CardTitle>
          <CardDescription className="text-xs">
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
