import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@renderer/components/ui/context-menu";
import { MenuContent } from "@renderer/components/ui/menu";
import { useTranslation } from "react-i18next";

interface MessageContextMenuAction {
  key: string;
  label: string;
  onAction: () => void;
  isDanger?: boolean;
  condition?: boolean;
}

interface MessageContextMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  position: { x: number; y: number };
  actions: MessageContextMenuAction[];
  hasSelectedText: boolean;
  onCopy: () => void;
  onCopySelected: () => void;
}

export function MessageContextMenu({
  isOpen,
  onOpenChange,
  containerRef,
  position,
  actions,
  hasSelectedText,
  onCopy,
  onCopySelected,
}: MessageContextMenuProps) {
  const { t } = useTranslation("translation", { keyPrefix: "message" });

  return (
    <MenuContent
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      triggerRef={containerRef}
      shouldFlip={false}
      placement="bottom left"
      offset={
        position.y - (containerRef.current?.getBoundingClientRect().bottom || 0)
      }
      crossOffset={
        position.x - (containerRef.current?.getBoundingClientRect().left || 0)
      }
      onClose={() => onOpenChange(false)}
      aria-label="Message options"
    >
      <ContextMenuItem onAction={onCopy}>{t("copy")}</ContextMenuItem>
      {hasSelectedText && (
        <ContextMenuItem onAction={onCopySelected}>
          {t("context-menu.copy-selected")}
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      {actions.map((action) => {
        if (action.condition === false) return null;

        return (
          <ContextMenuItem
            key={action.key}
            onAction={action.onAction}
            isDanger={action.isDanger}
          >
            {action.label}
          </ContextMenuItem>
        );
      })}
    </MenuContent>
  );
}
