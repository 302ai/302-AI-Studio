/** biome-ignore-all lint/a11y/useSemanticElements: ignore seSemanticElements */
import { Draggable } from "@hello-pangea/dnd";
import type { ModelActionType } from "@renderer/hooks/use-provider-list";
import type { ModelProvider } from "@renderer/types/providers";
import { memo } from "react";
import { areEqual } from "react-window";
import { ActionGroup } from "./action-group";
import { ProviderCard } from "./provider-card";

interface ListRowProps {
  index: number;
  style: React.CSSProperties;
  provider: ModelProvider;
  setSelectedModelProvider: (provider: ModelProvider) => void;
  setState: (state: ModelActionType) => void;
}

export const ListRow = memo(function ListRow({
  index,
  style,
  provider,
  setSelectedModelProvider,
  setState,
}: ListRowProps) {
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
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleProviderSelect?.();
            }
          }}
          onClick={handleProviderSelect}
          role="button"
          tabIndex={0}
          aria-label={provider.name}
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
