import { ProviderCard } from "./provider-card";
import { Plus } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";

export function ProviderList() {
  const { t } = useTranslation();
  const { modelProvider, moveModelProvider } = useModelSettingStore();

  const handleDragEnd = (result: DropResult) => {
    if (result.destination) {
      moveModelProvider(result.source.index, result.destination.index);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Button className="w-fit" size="small" intent="outline">
        <Plus className="size-4" />
        {t("settings.model-settings.model-provider.add-provider")}
      </Button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="provider-list" direction="vertical">
          {(provided) => (
            <div
              className="mt-2 flex max-h-[calc(100%-68px)] flex-1 flex-col overflow-y-auto"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {modelProvider.map((provider, index) => (
                <ProviderCard
                  key={provider.id}
                  index={index}
                  provider={provider}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
