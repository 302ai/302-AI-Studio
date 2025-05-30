/** biome-ignore-all lint/a11y/useSemanticElements: ignore useSemanticElements */
import { ModelIcon } from "@renderer/components/business/model-icon";
import type { Model } from "@shared/types/model";
import { CheckIcon } from "lucide-react";
import { memo } from "react";
import { areEqual } from "react-window";

interface ListItem {
  type: "group" | "model";
  id: string;
  name: string;
  providerId: string;
  model: Model;
}

export const ModelRowList = memo(function ModelRowList({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    items: ListItem[];
    onSelect: (modelId: string) => void;
    selectedModelId: string;
  };
}) {
  const { items, onSelect, selectedModelId } = data;
  const item = items[index];

  if (item.type === "group") {
    return (
      <div
        style={style}
        className="flex items-center px-2 font-medium text-muted-fg text-xs"
      >
        {item.name}
      </div>
    );
  }

  const isSelected = selectedModelId === item.model.id;

  return (
    <div
      style={style}
      className="flex cursor-pointer items-center rounded-md px-2 text-accent-fg text-sm outline-hidden hover:bg-hover-primary"
      onClick={() => onSelect(item.model.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(item.model.id);
        }
      }}
      role="option"
      tabIndex={-1}
      aria-selected={isSelected}
    >
      <div className="flex w-full flex-row items-center gap-2 overflow-hidden">
        <ModelIcon modelId={item.model.id} className="size-4 flex-shrink-0" />
        <span className="flex-1 overflow-hidden truncate text-ellipsis whitespace-nowrap">
          {item.name}
        </span>
        {isSelected && <CheckIcon className="size-4 flex-shrink-0" />}
      </div>
    </div>
  );
}, areEqual);
