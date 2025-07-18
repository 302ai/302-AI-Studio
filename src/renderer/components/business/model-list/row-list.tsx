import { triplitClient } from "@renderer/client";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import type { Model, Provider, UpdateModelData } from "@shared/triplit/types";
import { Hammer, Image, Lightbulb, Music, SquarePlay } from "lucide-react";
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
      <div className="flex h-full">
        <div className="flex h-full min-w-[160px] flex-[1.3] items-center pr-2 pl-4 outline-hidden">
          {/* <Checkbox isSelected={item.enabled} onChange={handleCheckboxChange} /> */}
          <div className="truncate" title={item.remark || item.name}>
            {item.remark || item.name}
          </div>
        </div>

        <div className="flex h-full min-w-[40px] flex-[0.7] items-center px-1 outline-hidden">
          <div className="truncate text-[#333333] text-sm dark:text-[#E6E6E6]">
            {t(`type.${item.type}`)}
          </div>
        </div>

        <div className="flex h-full min-w-[100px] flex-[1.2] items-center gap-2 outline-hidden">
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
              case "music":
                return (
                  <div
                    key={capability}
                    className="flex size-6 items-center justify-center rounded-sm bg-[#FFF0FD] dark:bg-[#391634]"
                  >
                    <Music className="h-4 w-4 text-[#F575CB] dark:text-[#F465C4]" />
                  </div>
                );
              case "video":
                return (
                  <div
                    key={capability}
                    className="flex size-6 items-center justify-center rounded-sm bg-[#F0FBFF] dark:bg-[#162D37]"
                  >
                    <SquarePlay className="h-4 w-4 text-[#0276C9]" />
                  </div>
                );
              case "function_call":
                return (
                  <div
                    key={capability}
                    className="flex size-6 items-center justify-center rounded-sm bg-[#FFF2EB] dark:bg-[#FE7D32]/10"
                  >
                    <Hammer className="h-4 w-4 text-[#FE7D32]" />
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="flex h-full min-w-[70px] flex-[0.8] items-center justify-center pr-2 outline-hidden">
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
