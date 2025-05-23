import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@renderer/components/ui/button";
import {
  type ModelActionType,
  useProviderList,
} from "@renderer/hooks/use-provider-list";
import { PackageOpen, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList } from "react-window";
import { ModalAction } from "../modal-action";
import { ActionGroup } from "./action-group";
import { AddProvider } from "./add-provider";
import { ListRow } from "./list-row";
import { ProviderCard } from "./provider-card";

export function ProviderList() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider",
  });
  const {
    modelProviders,
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
          title: t("modal-action.add-provider"),
          descriptions: [],
          body: (
            <AddProvider
              onValidate={() => {
                console.log("validate");
              }}
            />
          ),
          confirmText: t("modal-action.add-provider-confirm"),
          action: () => {},
        };
      case "edit":
        return {
          title: `${t("modal-action.edit")} ${selectedModelProvider?.name}`,
          descriptions: [],
          action: () => {},
        };
      case "delete":
        return {
          title: t("modal-action.delete"),
          descriptions: [
            `${t("modal-action.delete-description")} ${
              selectedModelProvider?.name
            } ?`,
            t("modal-action.delete-description-2"),
            t("modal-action.delete-description-3"),
          ],
          confirmText: t("modal-action.delete-confirm"),
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

  return (
    <>
      <div className="flex h-full flex-col">
        <Button
          className="w-fit shrink-0"
          size="small"
          intent="outline"
          onClick={() => setState("add")}
        >
          <Plus className="size-4" />
          {t("add-provider")}
        </Button>
        {modelProviders.length > 0 ? (
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
                    provider={modelProviders[rubric.source.index]}
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
                    itemCount={modelProviders.length}
                    itemSize={65}
                    width="100%"
                    outerRef={provided.innerRef}
                    itemData={modelProviders}
                  >
                    {({ index, style }) => (
                      <ListRow
                        index={index}
                        style={style}
                        provider={modelProviders[index]}
                        setSelectedModelProvider={setSelectedModelProvider}
                        setState={setState}
                      />
                    )}
                  </FixedSizeList>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <PackageOpen className="size-9 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t("no-provider-description")}
              </p>
            </div>
          </div>
        )}
      </div>

      <ModalAction
        state={state}
        onOpenChange={closeModal}
        actionType={actionType(state)}
      />
    </>
  );
}
