import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import empty from "@renderer/assets/images/empty.svg?url";
import darkEmpty from "@renderer/assets/images/empty-dark.svg?url";
import { triplitClient } from "@renderer/client";
import { Button } from "@renderer/components/ui/button";
import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import {
  type ModalAction,
  useProviderList,
} from "@renderer/hooks/use-provider-list";
import logger from "@shared/logger/renderer-logger";
import type { CreateProviderData, Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import debounce from "lodash-es/debounce";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useTranslation } from "react-i18next";
import { areEqual, FixedSizeList } from "react-window";
import { ActionGroup } from "../action-group";
import { Fetching } from "../fetching";
import { ModalAction as ModalActionComponent } from "../modal-action";
import { AddProvider } from "./add-provider";
import { EditProvider } from "./edit-provider";
import { ProviderCard } from "./provider-card";

const domainsOf302 = ["302.cn", "302.ai"];

const { configService } = window.service;

const ListRow = React.memo(function ListRow({
  index,
  style,
  data,
  setState,
  modelCounts,
  selectedProvider,
}: {
  index: number;
  style: React.CSSProperties;
  data: Provider[];
  setState: (state: ModalAction) => void;
  modelCounts: Record<string, number>;
  selectedProvider: Provider | null;
  onProviderSelect: (provider: Provider) => void;
}) {
  const provider = data[index];
  const { setSelectedProvider } = useActiveProvider();

  const handleProviderSelect = debounce(async () => {
    if (selectedProvider?.id === provider.id) {
      return;
    }
    await setSelectedProvider(provider);
  }, 100);
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
            provider.custom ? (
              <ActionGroup onEdit={undefined} onDelete={handleDelete} />
            ) : null
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

  const providersQuery = triplitClient.query("providers").Order("order", "ASC");
  const { results: allProviders = [], fetching: providersFetching } = useQuery(
    triplitClient,
    providersQuery,
  );

  const modelsQuery = triplitClient.query("models");
  const { results: allModels = [], fetching: modelsFetching } = useQuery(
    triplitClient,
    modelsQuery,
  );

  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modelCounts = useMemo(() => {
    if (!allModels || !allProviders?.length) {
      return {};
    }

    const counts: Record<string, number> = {};
    allProviders.forEach((provider) => {
      counts[provider.id] = allModels.filter(
        (model) => model.providerId === provider.id,
      ).length;
    });

    return counts;
  }, [allModels, allProviders]);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [isApiKeyValidated, setIsApiKeyValidated] = useState(false);
  const [providerCfg, setProviderCfg] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

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
              onValidationStatusChange={(isValid) =>
                setIsApiKeyValidated(isValid)
              }
              onProviderCfgSet={(providerCfg) => setProviderCfg(providerCfg)}
              providers={providers}
            />
          ),
          confirmText: t("modal-action.add-provider-confirm"),
          disabled: !isApiKeyValidated || isSubmitting,
          isPending: isSubmitting,
          action: async () => {
            if (providerCfg && !isSubmitting) {
              setIsSubmitting(true);
              try {
                const { name, baseUrl, apiKey, apiType, custom } = providerCfg;
                const is302Provider = domainsOf302.some((domain) =>
                  baseUrl?.includes(domain),
                );
                const newApiType = is302Provider ? "302ai" : apiType;
                const provider: CreateProviderData = {
                  name,
                  baseUrl,
                  apiKey,
                  apiType: newApiType,
                  custom: custom ?? false,
                  enabled: true,
                };

                await handleAddProvider(provider);
                handleCloseModal();
              } catch (error) {
                logger.error("Failed to add provider", { error });
              } finally {
                setIsSubmitting(false);
              }
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
              onValidationStatusChange={(isValid) =>
                setIsApiKeyValidated(isValid)
              }
              onProviderCfgSet={(providerCfg) => setProviderCfg(providerCfg)}
            />
          ),
          disabled: !isApiKeyValidated || isSubmitting,
          isPending: isSubmitting,
          action: async () => {
            if (providerCfg && !isSubmitting) {
              setIsSubmitting(true);
              try {
                const is302Provider = domainsOf302.some((domain) =>
                  providerCfg?.baseUrl?.includes(domain),
                );
                const newApiType = is302Provider
                  ? "302ai"
                  : providerCfg.apiType;

                await handleUpdateProvider({
                  ...providerCfg,
                  apiType: newApiType,
                });
                handleCloseModal();
              } catch (error) {
                logger.error("Failed to update provider", { error });
              } finally {
                setIsSubmitting(false);
              }
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
          disabled: isSubmitting,
          isPending: isSubmitting,
          action: async () => {
            if (action.provider && !isSubmitting) {
              setIsSubmitting(true);
              try {
                await handleDelete(action.provider);
                handleCloseModal();

                if (selectedProvider?.id === action.provider?.id) {
                  const newSelectedProvider = providers.find(
                    (p) => p.id !== action.provider?.id,
                  );
                  if (newSelectedProvider) {
                    setSelectedProvider(newSelectedProvider);
                  } else {
                    setSelectedProvider(null);
                  }
                }
              } catch (error) {
                logger.error("Failed to delete provider", { error });
              } finally {
                setIsSubmitting(false);
              }
            }
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
      logger.debug("Provider order updated successfully");
    } catch (error) {
      logger.error("Failed to move provider", { error });
      setProviders(providers);
    }
  };

  const handleCloseModal = () => {
    setIsApiKeyValidated(false);
    setProviderCfg(null);
    setIsSubmitting(false);
    closeModal();
  };

  const renderListRow = (props: {
    index: number;
    style: React.CSSProperties;
    data: Provider[];
  }) => {
    // const newData = [...defaultProviders, ...props.data];
    return (
      <ListRow
        {...props}
        // data={newData}
        setState={setState}
        modelCounts={modelCounts}
        selectedProvider={selectedProvider}
        onProviderSelect={setSelectedProvider}
      />
    );
  };

  const updateHeight = useCallback(() => {
    if (listContainerRef.current) {
      const height = listContainerRef.current.clientHeight - 70;
      setListHeight(height);
    }
  }, []);

  useLayoutEffect(() => {
    updateHeight();
  }, [updateHeight]);

  useEffect(() => {
    window.addEventListener("resize", updateHeight);
    const ro = new ResizeObserver(updateHeight);
    if (listContainerRef.current) ro.observe(listContainerRef.current);
    return () => {
      window.removeEventListener("resize", updateHeight);
      ro.disconnect();
    };
  }, [updateHeight]);

  useEffect(() => {
    setProviders(allProviders ?? []);
  }, [allProviders]);

  useEffect(() => {
    if (!providersFetching && !modelsFetching) {
      startTransition(() => {
        setReady(true);
      });
    }
  }, [providersFetching, modelsFetching]);

  const loading = !ready || isPending;

  const onClick = async () => {
    const res = await configService.insertProvider({
      name: t("custom-provider"),
      apiType: "openai",
      apiKey: "",
      baseUrl: "",
      enabled: true,
      custom: true,
    });

    setSelectedProvider(res);
  };

  return (
    <>
      <div className="flex h-full w-full flex-col px-4 pt-[18px] ">
        <div className="flex items-center justify-between">
          <div>{t("label")}</div>
          {providers.length > 0 ? (
            <Button
              className=" w-[76px] shrink-0"
              intent="primary"
              // onClick={() => setState({ type: "add" })}
              onClick={onClick}
              size="extra-small"
            >
              {t("add")}
            </Button>
          ) : null}
        </div>

        <div ref={listContainerRef} className="mt-2 flex-1 ">
          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{ height: listHeight }}
            >
              <Fetching />
            </div>
          ) : providers.length > 0 ? (
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
          ) : (
            <div className="flex h-full translate-y-24 items-center justify-center text-muted-fg">
              <div className="flex flex-col items-center gap-2 text-sm">
                <img src={empty} alt="empty" className="size-52 dark:hidden" />
                <img
                  src={darkEmpty}
                  alt="empty"
                  className="hidden size-52 dark:block"
                />
                <p>{t("no-provider-description")}</p>
                <Button
                  className="w-36 shrink-0"
                  intent="primary"
                  size="extra-small"
                  onClick={() => setState({ type: "add" })}
                >
                  {/* <Plus className="size-4" /> */}
                  {t("add-provider")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalActionComponent
        state={state?.type ?? null}
        onOpenChange={handleCloseModal}
        actionType={actionType(state)}
      />
    </>
  );
}
