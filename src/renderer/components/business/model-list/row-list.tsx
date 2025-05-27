import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import { memo } from "react";
import { areEqual } from "react-window";
import { ActionGroup } from "../action-group";
import { ModelIcon } from "../model-icon";

export const RowList = memo(function RowList({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: { models: Model[]; providerMap: Record<string, ModelProvider> };
}) {
  const { models, providerMap } = data;
  const item = models[index];
  const provider = providerMap[item.providerId];
  const isLast = index === models.length - 1;

  const handleCheckboxChange = () => {
    console.log("checked");
  };
  const handleEdit = () => {};
  const handleDelete = () => {};
  const handleStar = () => {};

  return (
    <div
      style={style}
      className={cn(
        "outline-transparent ring-primary hover:bg-hover-primary",
        !isLast ? "border-border border-b" : ""
      )}
    >
      <div className="flex items-center">
        <Checkbox
          className="ml-4 cursor-pointer"
          isSelected={item.enabled}
          onChange={handleCheckboxChange}
        />

        <div className="flex-1 px-4 py-2.5 align-middle outline-hidden">
          {item.name}
        </div>
        <div className="mr-4 px-4 py-2.5 align-middle outline-hidden">
          <div className="flex items-center gap-2">
            <ModelIcon modelId={provider.id} />
            {provider.name}
          </div>
        </div>
        <ActionGroup
          className="my-auto"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStar={handleStar}
        />
      </div>
    </div>
  );
},
areEqual);
