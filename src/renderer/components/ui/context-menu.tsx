import type { MenuContentProps } from "@renderer/components/ui/menu";
import {
  MenuContent,
  MenuDescription,
  MenuHeader,
  MenuItem,
  MenuKeyboard,
  MenuLabel,
  MenuSection,
  MenuSeparator,
} from "@renderer/components/ui/menu";
import { createContext, use, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

interface ContextMenuTriggerContextType {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  contextMenuOffset: { offset: number; crossOffset: number } | null;
  setContextMenuOffset: React.Dispatch<
    React.SetStateAction<{ offset: number; crossOffset: number } | null>
  >;
}

const ContextMenuTriggerContext = createContext<
  ContextMenuTriggerContextType | undefined
>(undefined);

const useContextMenuTrigger = () => {
  const context = use(ContextMenuTriggerContext);
  if (!context) {
    throw new Error(
      "useContextMenuTrigger must be used within a ContextMenuTrigger",
    );
  }
  return context;
};

interface ContextMenuProps {
  children: React.ReactNode;
}

const ContextMenu = ({ children }: ContextMenuProps) => {
  const [contextMenuOffset, setContextMenuOffset] = useState<{
    offset: number;
    crossOffset: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <ContextMenuTriggerContext.Provider
      value={{ buttonRef, contextMenuOffset, setContextMenuOffset }}
    >
      {children}
    </ContextMenuTriggerContext.Provider>
  );
};

type ContextMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const ContextMenuTrigger = ({
  className,
  ...props
}: ContextMenuTriggerProps) => {
  const { buttonRef, setContextMenuOffset } = useContextMenuTrigger();

  const onContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuOffset({
      offset: e.clientY - rect.bottom,
      crossOffset: e.clientX - rect.left,
    });
  };
  return (
    <button
      className={twMerge(
        "cursor-default focus:outline-hidden disabled:opacity-60 disabled:forced-colors:disabled:text-[GrayText]",
        className,
      )}
      ref={buttonRef}
      aria-haspopup="menu"
      onContextMenu={onContextMenu}
      {...props}
    />
  );
};

type ContextMenuContentProps<T> = Omit<
  MenuContentProps<T>,
  | "showArrow"
  | "isOpen"
  | "onOpenChange"
  | "triggerRef"
  | "placement"
  | "shouldFlip"
>;

const ContextMenuContent = <T extends object>(
  props: ContextMenuContentProps<T>,
) => {
  const { contextMenuOffset, setContextMenuOffset, buttonRef } =
    useContextMenuTrigger();
  return contextMenuOffset ? (
    <MenuContent
      isOpen={!!contextMenuOffset}
      onOpenChange={() => setContextMenuOffset(null)}
      triggerRef={buttonRef}
      shouldFlip={true}
      placement="bottom left"
      offset={contextMenuOffset?.offset}
      crossOffset={contextMenuOffset?.crossOffset}
      onClose={() => setContextMenuOffset(null)}
      {...props}
    />
  ) : null;
};

const ContextMenuItem = MenuItem;
const ContextMenuSeparator = MenuSeparator;
const ContextMenuDescription = MenuDescription;
const ContextMenuSection = MenuSection;
const ContextMenuHeader = MenuHeader;
const ContextMenuKeyboard = MenuKeyboard;
const ContextMenuLabel = MenuLabel;

ContextMenu.Trigger = ContextMenuTrigger;
ContextMenu.Content = ContextMenuContent;
ContextMenu.Item = ContextMenuItem;
ContextMenu.Label = ContextMenuLabel;
ContextMenu.Separator = ContextMenuSeparator;
ContextMenu.Description = ContextMenuDescription;
ContextMenu.Section = ContextMenuSection;
ContextMenu.Header = ContextMenuHeader;
ContextMenu.Keyboard = ContextMenuKeyboard;

export type { ContextMenuProps };
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuDescription,
  ContextMenuSection,
  ContextMenuHeader,
  ContextMenuKeyboard,
};
