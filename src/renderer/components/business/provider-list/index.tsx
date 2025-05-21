import { ProviderCard } from "./provider-card";
import { Plus } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import { FixedSizeList, areEqual } from "react-window";
import { memo, useRef, useState, useEffect } from "react";

export function ProviderList() {
  const { t } = useTranslation();
  const { modelProvider, moveModelProvider } = useModelSettingStore();

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState<number>(0);

  const handleDragEnd = (result: DropResult) => {
    if (result.destination) {
      moveModelProvider(result.source.index, result.destination.index);
    }
  };

  const Row = memo(function Row({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) {
    const provider = modelProvider[index];
    return (
      <Draggable draggableId={provider.id} index={index} key={provider.id}>
        {(provided, snapshot) => (
          <div style={style}>
            <ProviderCard
              provided={provided}
              snapshot={snapshot}
              provider={provider}
            />
          </div>
        )}
      </Draggable>
    );
  },
  areEqual);

  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const height = listContainerRef.current.clientHeight;
        setListHeight(height);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (listContainerRef.current) {
      resizeObserver.observe(listContainerRef.current);
    }

    return () => {
      if (listContainerRef.current) {
        resizeObserver.unobserve(listContainerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Button className="w-fit" size="small" intent="outline">
        <Plus className="size-4" />
        {t("settings.model-settings.model-provider.add-provider")}
      </Button>
      <div ref={listContainerRef} className="mt-2 h-[calc(100%-56px)]">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="provider-list"
            mode="virtual"
            direction="vertical"
            renderClone={(provided, snapshot, rubric) => (
              <ProviderCard
                provided={provided}
                snapshot={snapshot}
                provider={modelProvider[rubric.source.index]}
              />
            )}
          >
            {(provided, _snapshot) => (
              <FixedSizeList
                height={listHeight}
                itemCount={modelProvider.length}
                itemSize={65}
                width="100%"
                outerRef={provided.innerRef}
                itemData={modelProvider}
              >
                {Row}
              </FixedSizeList>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
