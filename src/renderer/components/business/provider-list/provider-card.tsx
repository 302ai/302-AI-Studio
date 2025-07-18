/** biome-ignore-all lint/a11y/useSemanticElements: ignore useSemanticElements */
import type { DraggableProvided } from "@hello-pangea/dnd";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";

import { ContextMenu } from "@renderer/components/ui/context-menu";

import { cn } from "@renderer/lib/utils";
import type { Provider } from "@shared/triplit/types";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProviderIcon } from "../provider-icon";

interface ProviderCardProps {
  provided: DraggableProvided;
  provider: Provider;
  modelCount: number;
  style?: React.CSSProperties;
  isDragging?: boolean;
  isSelected: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ProviderCard({
  provided,
  provider,
  modelCount,
  onDelete,
  style,
  isDragging,
  isSelected,
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
      height: isDragging ? combined.height : 56,
      marginBottom,
      cursor: "pointer",
    };
    return withSpacing;
  };

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="w-full">
        <div
          className={cn(
            "group flex h-[56px] flex-row items-center justify-between rounded-xl py-4 hover:bg-hover-primary",
            isDragging && "bg-hover-primary opacity-50 ",
            isSelected && "bg-accent text-accent-fg hover:bg-accent",
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
          <CardHeader className="flex min-w-0 items-center gap-3 pl-4">
            <ProviderIcon provider={provider} className="size-8 " />
            {/* <ModelIcon modelName={provider.name ?? ""} className="size-8" /> */}
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="overflow-hidden truncate whitespace-nowrap text-left text-card-title-text text-sm">
                {provider.name}
              </CardTitle>
              <CardDescription className=" text-left text-card-desc-text text-xs">
                {provider.status === "success" ? (
                  `${modelCount}${t("settings.model-settings.model-provider.description")}`
                ) : provider.status === "pending" ? (
                  t("settings.model-settings.model-provider.not-configured")
                ) : (
                  <div className="flex items-center gap-x-1 text-card-desc-error">
                    <TriangleAlert size={14} className="" />
                    {t("settings.model-settings.model-provider.provider-error")}
                  </div>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </div>
      </ContextMenu.Trigger>
      {provider.custom && (
        <ContextMenu.Content>
          <ContextMenu.Item
            onAction={onDelete}
            className="text-card-desc-error"
          >
            {t("settings.model-settings.model-provider.delete")}
          </ContextMenu.Item>
        </ContextMenu.Content>
      )}
    </ContextMenu>
  );
}
