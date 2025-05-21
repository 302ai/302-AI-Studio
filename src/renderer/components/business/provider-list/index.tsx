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
import { FixedSizeList, areEqual } from "react-window";
import { memo, useRef, useState, useEffect } from "react";
import {
  useProviderList,
  ModelActionType,
} from "@renderer/hooks/use-provider-list";
import { ModalAction } from "../modal-action";
import { ActionGroup } from "./action-group";
import { AddProvider } from "./add-provider";
export function ProviderList() {
  const { t } = useTranslation();
  const {
    modelProvider,
    selectedModelProvider,
    state,
    setState,
    closeModal,
    handleDelete,
    moveModelProvider,
    setSelectedModelProvider,
  } = useProviderList();

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState<number>(0);

  const actionType = (action: ModelActionType | null) => {
    const initialsState = {
      title: "",
      descriptions: [""],
      confirmText: "",
      action: () => {},
    };

    switch (action) {
      case "add":
        return {
          title: t(
            "settings.model-settings.model-provider.modal-action.add-provider"
          ),
          descriptions: [],
          body: (
            <AddProvider
              onValidate={() => {
                console.log("validate");
              }}
            />
          ),
          action: () => {},
        };
      case "edit":
        return {
          title: t("settings.model-settings.model-provider.modal-action.edit"),
          descriptions: [],
          action: () => {},
        };
      case "delete":
        return {
          title: t(
            "settings.model-settings.model-provider.modal-action.delete"
          ),
          descriptions: [
            `${t(
              "settings.model-settings.model-provider.modal-action.delete-description"
            )} ${selectedModelProvider?.name} ?`,
            t(
              "settings.model-settings.model-provider.modal-action.delete-description-2"
            ),
            t(
              "settings.model-settings.model-provider.modal-action.delete-description-3"
            ),
          ],
          confirmText: t(
            "settings.model-settings.model-provider.modal-action.delete-confirm"
          ),
          action: handleDelete,
        };
      default:
        return initialsState;
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (result.destination) {
      moveModelProvider(result.source.index, result.destination.index);
    }
  };

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

  const Row = memo(function Row({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) {
    const provider = modelProvider[index];

    const handleProviderSelect = () => {
      setSelectedModelProvider(provider);
    };

    const handleEdit = () => {
      handleProviderSelect();
      setState("edit");
    };

    const handleDelete = () => {
      handleProviderSelect();
      setState("delete");
    };

    return (
      <Draggable draggableId={provider.id} index={index} key={provider.id}>
        {(provided, snapshot) => (
          <div
            style={style}
            onKeyDown={handleProviderSelect}
            onClick={handleProviderSelect}
          >
            <ProviderCard
              provided={provided}
              snapshot={snapshot}
              provider={provider}
              actionGroup={
                <ActionGroup onEdit={handleEdit} onDelete={handleDelete} />
              }
            />
          </div>
        )}
      </Draggable>
    );
  },
  areEqual);

  return (
    <>
      <div className="flex h-full flex-col">
        <Button
          className="w-fit"
          size="small"
          intent="outline"
          onClick={() => setState("add")}
        >
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
                  actionGroup={
                    <ActionGroup
                      onEdit={() => {
                        setState("edit");
                      }}
                      onDelete={() => setState("delete")}
                    />
                  }
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

      <ModalAction
        state={state}
        onOpenChange={closeModal}
        actionType={actionType(state)}
      />
    </>
  );
}
