/** biome-ignore-all lint/a11y/useSemanticElements: ignore useSemanticElements */
import { ModelIcon } from "@renderer/components/business/model-icon";
import {
  Disclosure,
  DisclosureTrigger,
} from "@renderer/components/ui/disclosure";
import type { Model } from "@shared/triplit/types";
import { CheckIcon } from "lucide-react";
import { memo } from "react";
import { areEqual } from "react-window";

export interface ListItem {
  type: "group" | "model";
  id: string;
  name: string;
  providerId: string;
  model: Model;
  remark: string;
  isExpanded?: boolean;
  models?: Model[];
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
    onToggleGroup?: (groupId: string) => void;
    expandedGroups?: Set<string>;
  };
}) {
  const { items, onSelect, selectedModelId, onToggleGroup, expandedGroups } =
    data;
  const item = items[index];

  if (item.type === "group") {
    const isExpanded = expandedGroups?.has(item.id) ?? true;

    return (
      <div style={style}>
        <Disclosure isExpanded={isExpanded}>
          <DisclosureTrigger
            className="flex w-full items-center rounded-md px-2 py-1 font-medium text-muted-fg text-xs hover:bg-hover-primary"
            onPress={() => onToggleGroup?.(item.id)}
          >
            {item.name}
          </DisclosureTrigger>
        </Disclosure>
      </div>
    );
  }

  const isSelected = selectedModelId === item.model.id;

  return (
    <div
      style={style}
      className="flex cursor-pointer items-center rounded-md px-2 text-sm outline-hidden hover:bg-hover-primary"
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
        <ModelIcon
          modelName={item.model.name}
          className="size-4 flex-shrink-0"
        />
        <span className="flex-1 overflow-hidden truncate text-ellipsis whitespace-nowrap">
          {item.model.remark || item.model.name}
        </span>
        {isSelected && <CheckIcon className="size-4 flex-shrink-0" />}
      </div>
    </div>
  );
}, areEqual);
