import { useTranslation } from "react-i18next";
import { Avatar } from "@renderer/components/ui/avatar";
import { ActionGroup } from "./action-group";
import { Draggable } from "@hello-pangea/dnd";
import { ModelProvider } from "@types";
import { getProviderIcon } from "@renderer/config/providers";
import { CardTitle } from "../../ui/card";
import {
  CardHeader,
  CardDescription,
  CardFooter,
} from "@renderer/components/ui/card";
import { cn } from "@/src/renderer/lib/utils";

interface ProviderCardProps {
  index: number;
  provider: ModelProvider;
}

export function ProviderCard({ index, provider }: ProviderCardProps) {
  const { t } = useTranslation();

  return (
    <Draggable draggableId={provider.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={cn(
            "flex h-[60px] flex-row items-center justify-between rounded-[10px] border bg-bg py-4 hover:bg-hover-primary",
            snapshot.isDragging && "bg-hover-primary opacity-50"
          )}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={
            {
              ...provided.draggableProps.style,
              cursor: "pointer",
              marginBottom: 5,
            } as React.CSSProperties
          }
        >
          <CardHeader className="flex items-center gap-3 pl-4">
            <Avatar
              src={getProviderIcon(provider.id)}
              size="large"
              shape="circle"
            />
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm">{provider.name}</CardTitle>
              <CardDescription className="text-xs">
                {provider.models.length}
                {t("settings.model-settings.model-provider.description")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="pr-2">
            <ActionGroup />
          </CardFooter>
        </div>
      )}
    </Draggable>
  );
}
