import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@renderer/components/ui/button";
import {
  type ModelActionType,
  useProviderList,
} from "@renderer/hooks/use-provider-list";
import type { ModelProvider } from "@shared/types/provider";
import _ from "lodash";
import { PackageOpen, Plus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { areEqual, FixedSizeList } from "react-window";
import { ActionGroup } from "../action-group";
import { ModalAction } from "../modal-action";
import { AddProvider } from "./add-provider";
import { EditProvider } from "./edit-provider";
import { ProviderCard } from "./provider-card";

export function ProviderList() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider",
  });
  const {
    modelProviders,
    selectedModelProvider,
    providerModelMap,
    state,
    setState,
    closeModal,
    handleDelete,
    handleUpdateProvider,
    moveModelProvider,
    setSelectedModelProvider,
    handleAddProvider,
  } = useProviderList();

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [isApiKeyValidated, setIsApiKeyValidated] = useState(false);
  const [providerCfg, setProviderCfg] = useState<ModelProvider | null>(null);

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
              onValidationStatusChange={(isValid) => {
                setIsApiKeyValidated(isValid);
              }}
              onProviderCfgSet={(providerCfg) => {
                setProviderCfg(providerCfg);
              }}
            />
          ),
          confirmText: t("modal-action.add-provider-confirm"),
          disabled: !isApiKeyValidated,
          action: () => {
            if (providerCfg) {
              handleAddProvider(providerCfg);
              handleCloseModal();
            }
          },
        };
      case "edit":
        if (!selectedModelProvider) {
          return initialsState;
        }
        return {
          title: `${t("modal-action.edit")} ${selectedModelProvider.name}`,
          descriptions: [],
          body: (
            <EditProvider
              provider={selectedModelProvider}
              onValidationStatusChange={(isValid) => {
                setIsApiKeyValidated(isValid);
              }}
              onProviderCfgSet={(providerCfg) => {
                setProviderCfg(providerCfg);
              }}
            />
          ),
          disabled: !isApiKeyValidated,
          action: () => {
            if (providerCfg) {
              handleUpdateProvider(providerCfg);
              handleCloseModal();
            }
          },
        };
      case "delete":
        if (!selectedModelProvider) {
          return initialsState;
        }
        return {
          title: t("modal-action.delete"),
          descriptions: [
            `${t("modal-action.delete-description")} ${
              selectedModelProvider.name
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

  const handleCloseModal = () => {
    setIsApiKeyValidated(false);
    setProviderCfg(null);

    closeModal();
  };

  /**
   * ! This component can not be extracted to a separate file
   */
  // biome-ignore lint: ignore noNestedComponentDefinitions
  const ListRow = React.memo(function ListRow({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: ModelProvider[];
  }) {
    const provider = data[index];

    const handleProviderSelect = _.debounce(() => {
      // * Toggle selection: if already selected, deselect; otherwise select
      setSelectedModelProvider(
        selectedModelProvider?.id === provider.id ? null : provider
      );
    }, 100);

    const handleEdit = () => {
      setSelectedModelProvider(provider);
      setState("edit");
    };

    const handleDelete = () => {
      setSelectedModelProvider(provider);
      setState("delete");
    };

    return (
      <Draggable draggableId={provider.id} index={index} key={provider.id}>
        {(provided) => (
          <ProviderCard
            style={style}
            provided={provided}
            provider={provider}
            isSelected={selectedModelProvider?.id === provider.id}
            providerModels={providerModelMap[provider.id]}
            actionGroup={
              <ActionGroup onEdit={handleEdit} onDelete={handleDelete} />
            }
            onClick={handleProviderSelect}
          />
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
                renderClone={(provided, snapshot, rubric) => {
                  const provider = modelProviders[rubric.source.index];
                  return (
                    <ProviderCard
                      provided={provided}
                      isDragging={snapshot.isDragging}
                      isSelected={selectedModelProvider?.id === provider.id}
                      provider={provider}
                      providerModels={providerModelMap[provider.id]}
                      actionGroup={
                        <ActionGroup onEdit={() => {}} onDelete={() => {}} />
                      }
                    />
                  );
                }}
              >
                {(provided) => (
                  <FixedSizeList
                    height={listHeight}
                    itemCount={modelProviders.length}
                    itemSize={65}
                    width="100%"
                    outerRef={provided.innerRef}
                    itemData={modelProviders}
                  >
                    {ListRow}
                  </FixedSizeList>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-fg">
            <div className="flex flex-col items-center gap-2 text-sm">
              <PackageOpen className="size-9" />
              <p>{t("no-provider-description")}</p>
            </div>
          </div>
        )}
      </div>

      <ModalAction
        state={state}
        onOpenChange={handleCloseModal}
        actionType={actionType(state)}
      />
    </>
  );
}
