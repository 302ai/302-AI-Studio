import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@renderer/components/ui/button";
import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import {
  type ModalAction,
  useProviderList,
} from "@renderer/hooks/use-provider-list";
import { triplitClient } from "@shared/triplit/client";
import type { CreateProviderData, Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import _ from "lodash";
import { PackageOpen, Plus } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { areEqual, FixedSizeList } from "react-window";
import { ActionGroup } from "../action-group";
import { ModalAction as ModalActionComponent } from "../modal-action";
import { AddProvider } from "./add-provider";
import { EditProvider } from "./edit-provider";
import { ProviderCard } from "./provider-card";

const ListRow = React.memo(function ListRow({
  index,
  style,
  data,
  setState,
  modelCounts,
}: {
  index: number;
  style: React.CSSProperties;
  data: Provider[];
  setState: (state: ModalAction) => void;
  modelCounts: Record<string, number>;
}) {
  const provider = data[index];
  const { selectedProvider, setSelectedProvider } = useActiveProvider();

  const handleProviderSelect = _.debounce(async () => {
    await setSelectedProvider(
      selectedProvider?.id === provider.id ? null : provider,
    );
  }, 100);

  const handleEdit = () => {
    console.log("handleEdit", provider);
    setState({ type: "edit", provider });
  };

  const handleDelete = () => {
    setState({ type: "delete", provider });
  };

  return (
    <Draggable draggableId={provider.id} index={index} key={provider.id}>
      {(provided) => (
        <ProviderCard
          style={style}
          provided={provided}
          provider={provider}
          isSelected={selectedProvider?.id === provider.id}
          modelCount={modelCounts[provider.id] || 0}
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
    state,
    setState,
    closeModal,
    handleDelete,
    handleUpdateProvider,
    moveProvider,
    handleAddProvider,
  } = useProviderList();

  const { selectedProvider, setSelectedProvider } = useActiveProvider();

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [isApiKeyValidated, setIsApiKeyValidated] = useState(false);
  const [providerCfg, setProviderCfg] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

  const providersQuery = triplitClient.query("providers").Order("order", "ASC");
  const { results: allProviders, fetching } = useQuery(
    triplitClient,
    providersQuery,
  );

  const modelsQuery = triplitClient.query("models");
  const { results: allModels } = useQuery(triplitClient, modelsQuery);

  const modelCounts = useMemo(() => {
    if (!allModels || !providers.length) {
      return {};
    }

    const counts: Record<string, number> = {};
    providers.forEach((provider) => {
      counts[provider.id] = allModels.filter(
        (model) => model.providerId === provider.id,
      ).length;
    });

    return counts;
  }, [allModels, providers]);

  const actionType = (action: ModalAction | null) => {
    const initialsState = {
      title: "",
      descriptions: [""],
      confirmText: "",
      action: () => {},
    };

    if (!action) {
      return initialsState;
    }

    switch (action.type) {
      case "add":
        return {
          title: t("modal-action.add-provider"),
          descriptions: [t("add-provider-form.verification-required")],
          body: (
            <AddProvider
              onValidationStatusChange={(isValid) => {
                setIsApiKeyValidated(isValid);
              }}
              onProviderCfgSet={(providerCfg) => {
                setProviderCfg(providerCfg);
              }}
              providers={providers}
            />
          ),
          confirmText: t("modal-action.add-provider-confirm"),
          disabled: !isApiKeyValidated,
          action: async () => {
            if (providerCfg) {
              const { name, baseUrl, apiKey, apiType, custom } = providerCfg;
              const provider: CreateProviderData = {
                name,
                baseUrl,
                apiKey,
                apiType,
                custom: custom ?? false,
                enabled: true,
              };
              await handleAddProvider(provider);
              handleCloseModal();
            }
          },
        };
      case "edit":
        if (!action.provider) {
          return initialsState;
        }
        return {
          title: `${t("modal-action.edit")} ${action.provider.name}`,
          descriptions: [t("edit-provider-form.verification-required")],
          body: (
            <EditProvider
              provider={action.provider}
              onValidationStatusChange={(isValid) => {
                setIsApiKeyValidated(isValid);
              }}
              onProviderCfgSet={(providerCfg) => {
                setProviderCfg(providerCfg);
              }}
            />
          ),
          disabled: !isApiKeyValidated,
          action: async () => {
            if (providerCfg) {
              await handleUpdateProvider(providerCfg);
              handleCloseModal();
            }
          },
        };
      case "delete":
        if (!action.provider) {
          return initialsState;
        }
        return {
          title: t("modal-action.delete"),
          descriptions: [
            `${t("modal-action.delete-description")} ${action.provider.name} ?`,
            t("modal-action.delete-description-2"),
            t("modal-action.delete-description-3"),
          ],
          confirmText: t("modal-action.delete-confirm"),
          action: async () => {
            if (action.provider) {
              await handleDelete(action.provider);
            }
            setSelectedProvider(null);
            handleCloseModal();
          },
        };
      default:
        return initialsState;
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    const newProviders = [...providers];
    const [movedProvider] = newProviders.splice(fromIndex, 1);
    newProviders.splice(toIndex, 0, movedProvider);
    setProviders(newProviders);

    try {
      await moveProvider(fromIndex, toIndex, providers);
      console.log("Provider order updated successfully");
    } catch (error) {
      console.error("Failed to move provider:", error);
      setProviders(providers);
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
  }) => <ListRow {...props} setState={setState} modelCounts={modelCounts} />;

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

    if (listHeight === 0 || providers.length > 0) {
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
  }, [listHeight, providers]);

  useEffect(() => {
    if (!fetching) {
      setProviders(allProviders ?? []);
    }
  }, [allProviders, fetching]);

  return (
    <>
      <div className="flex h-full flex-col">
        <Button
          className="w-fit shrink-0"
          size="small"
          intent="outline"
          onClick={() => setState({ type: "add" })}
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
                      modelCount={modelCounts[provider.id] || 0}
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

      <ModalActionComponent
        state={state?.type ?? null}
        onOpenChange={handleCloseModal}
        actionType={actionType(state)}
      />
    </>
  );
}
