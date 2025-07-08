import { triplitClient } from "@renderer/client";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import type { Model, Provider, UpdateModelData } from "@shared/triplit/types";
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
  data: {
    models: Model[];
    providersMap: Record<string, Provider>;
  };
}) {
  const { models, providersMap } = data;
  const item = models[index];
  const isLast = index === models.length - 1;

  // 直接从传入的 providersMap 中获取 provider
  const provider = providersMap[item.providerId];

  const handleUpdateModel = async (updateModelData: UpdateModelData) => {
    await triplitClient.update("models", item.id, updateModelData);
  };

  const handleCheckboxChange = () => {
    handleUpdateModel({ enabled: !item.enabled });
  };
  // TODO: Support edit and delete functionality (in the future version)
  // const handleEdit = () => {};
  // const handleDelete = () => {};
  const handleStar = () => {
    handleUpdateModel({ collected: !item.collected });
  };

  return (
    <div
      style={style}
      className={cn(
        "outline-transparent ring-primary hover:bg-hover-primary",
        !isLast ? "border-border border-b" : "",
      )}
    >
      <div className="grid grid-cols-[48px_minmax(0,1fr)_160px_64px] items-center">
        <div className="flex justify-center">
          <Checkbox
            className="cursor-pointer"
            isSelected={item.enabled}
            onChange={handleCheckboxChange}
          />
        </div>

        <div className="px-4 py-2.5 align-middle outline-hidden">
          <div className="truncate" title={item.name}>
            {item.name}
          </div>
        </div>

        <div className="px-4 py-2.5 align-middle outline-hidden">
          <div className="flex items-center gap-2">
            <ModelIcon modelName={provider?.name ?? ""} />
            <span className="truncate" title={provider?.name}>
              {provider?.name}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <ActionGroup
            className="my-auto"
            // onEdit={handleEdit}
            // onDelete={handleDelete}
            onStar={handleStar}
            stared={item.collected}
          />
        </div>
      </div>
    </div>
  );
}, areEqual);
