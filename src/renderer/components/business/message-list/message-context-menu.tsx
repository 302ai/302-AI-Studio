import { ContextMenu } from "@renderer/components/ui/context-menu";
import { Menu } from "@renderer/components/ui/menu";
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
    <Menu.Content
      popover={{
        isOpen,
        onOpenChange,
        triggerRef: containerRef,
        shouldFlip: false,
        offset:
          position.y -
          (containerRef.current?.getBoundingClientRect().bottom || 0),
        crossOffset:
          position.x -
          (containerRef.current?.getBoundingClientRect().left || 0),
      }}
      placement="bottom left"
      onClose={() => onOpenChange(false)}
      aria-label="Message options"
    >
      <ContextMenu.Item onAction={onCopy}>{t("copy")}</ContextMenu.Item>
      {hasSelectedText && (
        <ContextMenu.Item onAction={onCopySelected}>
          {t("context-menu.copy-selected")}
        </ContextMenu.Item>
      )}

      <ContextMenu.Separator />

      {actions.map((action) => {
        if (action.condition === false) return null;

        return (
          <ContextMenu.Item
            key={action.key}
            onAction={action.onAction}
            isDanger={action.isDanger}
          >
            {action.label}
          </ContextMenu.Item>
        );
      })}
    </Menu.Content>
  );
}
