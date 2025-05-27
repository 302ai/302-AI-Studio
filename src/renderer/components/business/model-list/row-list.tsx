import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import { memo } from "react";
import { areEqual } from "react-window";
import { useModelSettingStore } from "@/src/renderer/store/settings-store/model-setting-store";
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

  const { providerModelMap, updateProviderModelMap } = useModelSettingStore();

  const handleUpdateModel = (updatedConfig: Partial<Model>) => {
    const targetModels = providerModelMap[provider.id];
    const updatedModels = targetModels.map((model) =>
      model.id === item.id ? { ...model, ...updatedConfig } : model
    );
    updateProviderModelMap(provider.id, updatedModels);
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
          className="my-auto mr-4"
          // onEdit={handleEdit}
          // onDelete={handleDelete}
          onStar={handleStar}
          stared={item.collected}
        />
      </div>
    </div>
  );
},
areEqual);
