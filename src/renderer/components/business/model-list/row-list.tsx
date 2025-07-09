import { triplitClient } from "@renderer/client";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import type { Model, Provider, UpdateModelData } from "@shared/triplit/types";
import { Globe, Image } from "lucide-react";
import { memo } from "react";
import { areEqual } from "react-window";
import { ActionGroup } from "../action-group";

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
  const { models } = data;
  const item = models[index];
  const isLast = index === models.length - 1;

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

  const modelCapabilities = Array.from(item?.capabilities || []);

  return (
    <div
      style={style}
      className={cn(
        "outline-transparent ring-primary hover:bg-hover-primary",
        !isLast ? "border-border border-b" : "",
      )}
    >
      <div className="grid h-full grid-cols-[minmax(0,1fr)_160px_64px]">
        <div className="flex h-full items-center gap-3 pl-4 outline-hidden">
          <Checkbox
            className="cursor-pointer"
            isSelected={item.enabled}
            onChange={handleCheckboxChange}
          />
          <div className="truncate" title={item.name}>
            {item.name}
          </div>
        </div>

        <div className="flex h-full items-center gap-2 outline-hidden">
          {modelCapabilities.map((capability) => {
            switch (capability) {
              case "reasoning":
                return (
                  <div
                    key={capability}
                    className="flex size-6 items-center justify-center rounded-sm bg-accent dark:bg-primary/10"
                  >
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                );
              case "vision":
                return (
                  <div
                    key={capability}
                    className="flex size-6 items-center justify-center rounded-sm bg-success/15 dark:bg-success/10"
                  >
                    <Image className="h-4 w-4 text-success" />
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="flex h-full items-center justify-center">
          <ActionGroup
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
