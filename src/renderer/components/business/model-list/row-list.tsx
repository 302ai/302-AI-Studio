import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import { triplitClient } from "@shared/triplit/client";
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
            <ModelIcon modelName={provider?.name ?? ""} />
            {provider?.name}
          </div>
        </div>

        <ActionGroup
          className="my-auto mr-4"
          // onEdit={handleEdit}
          // onDelete={handleDelete}
          onStar={handleStar}
          stared={item.collected}
        />
      </div>
    </div>
  );
}, areEqual);
