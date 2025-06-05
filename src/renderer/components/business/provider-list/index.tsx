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
import { triplitClient } from "@shared/triplit/client";
import type { CreateProviderData, Model, Provider } from "@shared/triplit/types";
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

/**
 * ! This component can not be extracted to a separate file
 */
const ListRow = React.memo(function ListRow({
  index,
  style,
  data,
  setSelectedProvider,
  selectedProvider,
  setState,
}: {
  index: number;
  style: React.CSSProperties;
  data: Provider[];
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;
  setState: (state: ModelActionType) => void;
}) {
  const [providerModels, setProviderModels] = useState<Model[]>([]);

  const provider = data[index];

  const handleProviderSelect = _.debounce(() => {
    // * Toggle selection: if already selected, deselect; otherwise select
    setSelectedProvider(selectedProvider?.id === provider.id ? null : provider);
  }, 100);

  const handleEdit = () => {
    setSelectedProvider(provider);
    setState("edit");
  };

  const handleDelete = () => {
    setSelectedProvider(provider);
    setState("delete");
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAndSubscribe = async () => {
      try {
        await triplitClient.connect();

        const query = triplitClient
          .query("models")
          .Where("providerId", "=", provider.id);

        unsubscribe = triplitClient.subscribe(
          query,
          (results) => {
            console.log("收到models数据更新:", results);
            // Update the providers state with the new data
            setProviderModels(results);
          },
          (error) => {
            console.error("models订阅错误:", error);
          },
        );
      } catch (error) {
        console.error("models初始化错误:", error);
      }
    };

    initAndSubscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [provider.id]);

  return (
    <Draggable draggableId={provider.id} index={index} key={provider.id}>
      {(provided) => (
        <ProviderCard
          style={style}
          provided={provided}
          provider={provider}
          isSelected={selectedProvider?.id === provider.id}
          providerModels={providerModels}
          actionGroup={
            <ActionGroup onEdit={handleEdit} onDelete={handleDelete} />
          }
          onClick={handleProviderSelect}
        />
      )}
    </Draggable>
  );
}, areEqual);

export function ProviderList() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider",
  });
  const {
    selectedProvider,
    state,
    setState,
    closeModal,
    handleDelete,
    handleUpdateProvider,
    moveProvider,
    setSelectedProvider,
    handleAddProvider,
  } = useProviderList();

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [isApiKeyValidated, setIsApiKeyValidated] = useState(false);
  const [providerCfg, setProviderCfg] = useState<ModelProvider | null>(null);

  const [providers, setProviders] = useState<Provider[]>([]);

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
          action: async () => {
            if (providerCfg) {
              const provider: CreateProviderData = {
                name: providerCfg.name,
                baseUrl: providerCfg.baseUrl,
                apiKey: providerCfg.apiKey,
                apiType: providerCfg.apiType,
                custom: providerCfg.custom ?? false,
                enabled: true,
              };
              await handleAddProvider(provider);
              handleCloseModal();
            }
          },
        };
      case "edit":
        if (!selectedProvider) {
          return initialsState;
        }
        return {
          title: `${t("modal-action.edit")} ${selectedProvider.name}`,
          descriptions: [],
          body: (
            <EditProvider
              provider={selectedProvider}
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
        if (!selectedProvider) {
          return initialsState;
        }
        return {
          title: t("modal-action.delete"),
          descriptions: [
            `${t("modal-action.delete-description")} ${
              selectedProvider.name
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
      moveProvider(result.source.index, result.destination.index, providers);
    }
  };

  const handleCloseModal = () => {
    setIsApiKeyValidated(false);
    setProviderCfg(null);

    closeModal();
  };

  const renderListRow = (props: {
    index: number;
    style: React.CSSProperties;
    data: Provider[];
  }) => (
    <ListRow
      {...props}
      selectedProvider={selectedProvider}
      setSelectedProvider={setSelectedProvider}
      setState={setState}
    />
  );

  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const height = listContainerRef.current.clientHeight;
        setListHeight(height);
      }
    };

    const getHeightWithDelay = () => {
      requestAnimationFrame(() => {
        setTimeout(updateHeight, 0);
      });
    };

    updateHeight();

    if (listHeight === 0) {
      getHeightWithDelay();
    }

    const resizeObserver = new ResizeObserver(() => {
      getHeightWithDelay();
    });

    if (listContainerRef.current) {
      resizeObserver.observe(listContainerRef.current);
    }

    return () => {
      if (listContainerRef.current) {
        resizeObserver.unobserve(listContainerRef.current);
      }
    };
  }, [listHeight]);

  // * Get providers from triplit with order
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAndSubscribe = async () => {
      try {
        await triplitClient.connect();

        const query = triplitClient
          .query("providers")
          .Where("enabled", "=", true)
          .Order("order", "ASC"); // Add order by order field

        unsubscribe = triplitClient.subscribe(
          query,
          (results) => {
            console.log("收到providers数据更新:", results);
            // Update the providers state with the new data
            setProviders(results);
          },
          (error) => {
            console.error("providers订阅错误:", error);
          },
        );
      } catch (error) {
        console.error("providers初始化错误:", error);
      }
    };

    initAndSubscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
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
        {providers.length > 0 ? (
          <div ref={listContainerRef} className="mt-2 h-[calc(100%-56px)]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable
                droppableId="provider-list"
                mode="virtual"
                renderClone={(provided, snapshot, rubric) => {
                  const provider = providers[rubric.source.index];
                  return (
                    <ProviderCard
                      provided={provided}
                      isDragging={snapshot.isDragging}
                      isSelected={selectedProvider?.id === provider.id}
                      provider={provider}
                      providerModels={[]}
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
                    itemCount={providers.length}
                    itemSize={65}
                    width="100%"
                    outerRef={provided.innerRef}
                    itemData={providers}
                  >
                    {renderListRow}
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
