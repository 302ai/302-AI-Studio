import { triplitClient } from "@renderer/client";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import type { Model, Provider, UpdateModelData } from "@shared/triplit/types";
import { Image, Lightbulb } from "lucide-react";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { areEqual } from "react-window";
import { toast } from "sonner";
import { ActionGroup } from "../action-group";
import { ModalAction } from "../modal-action";

const { modelService } = window.service;

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
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.add-model-modal",
  });

  const [deleteModalState, setDeleteModalState] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateModel = async (updateModelData: UpdateModelData) => {
    await triplitClient.update("models", item.id, updateModelData);
  };

  const handleCheckboxChange = () => {
    handleUpdateModel({ enabled: !item.enabled });
  };

  const handleEdit = () => {
    emitter.emit(EventNames.MODEL_EDIT, { model: item });
  };

  const handleDelete = () => {
    setDeleteModalState("delete");
  };

  const handleConfirmDelete = async () => {
    if (!item || isDeleting) return;

    setIsDeleting(true);
    try {
      // await triplitClient.delete("models", item.id);
      await modelService.deleteModel(item.id);
      toast.success(t("actions.delete-success-message"));
      setDeleteModalState(null);
    } catch (error) {
      logger.error("Failed to delete model", { error });
      toast.error(t("actions.delete-error-message"));
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="grid h-full grid-cols-[minmax(0,1fr)_170px_50px]">
        <div className="flex h-full items-center gap-3 pl-4 outline-hidden">
          <Checkbox isSelected={item.enabled} onChange={handleCheckboxChange} />
          <div className="truncate" title={item.name}>
            {item.remark || item.name}
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
                    <Lightbulb className="h-4 w-4 text-primary" />
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

        <div className="w-full flex-1 items-center justify-center pr-2">
          <ActionGroup
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStar={handleStar}
            stared={item.collected}
          />
        </div>
      </div>

      <ModalAction
        state={deleteModalState}
        onOpenChange={() => setDeleteModalState(null)}
        actionType={{
          title: t("actions.delete-title"),
          descriptions: [t("actions.delete-description")],
          confirmText: t("actions.delete-confirm-text"),
          disabled: isDeleting,
          isPending: isDeleting,
          action: handleConfirmDelete,
        }}
        dangerActions={["delete"]}
      />
    </div>
  );
}, areEqual);
