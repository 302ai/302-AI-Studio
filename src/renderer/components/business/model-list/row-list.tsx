import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import { triplitClient } from "@shared/triplit/client";
import type { Model, Provider, UpdateModelData } from "@shared/triplit/types";
import { memo, useEffect, useState } from "react";
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
  data: { models: Model[] };
}) {
  const { models } = data;
  const item = models[index];
  const isLast = index === models.length - 1;

  const [provider, setProvider] = useState<Provider>();

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

  useEffect(() => {
    const fetchProvider = async () => {
    const query = triplitClient
      .query("providers")
      .Where("id", "=", item.providerId);
      const provider = await triplitClient.fetch(query);
      setProvider(provider[0]);
    };
    fetchProvider();
  }, [item.providerId]);

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
