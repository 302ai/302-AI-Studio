import { X } from "lucide-react";
import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";

interface TabProps {
  id: string;
  index: number;
  title: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  width: number;
}

export function Tab({
  id,
  index,
  title,
  isActive,
  onClick,
  onClose,
  moveTab,
  width,
}: TabProps) {
  const isCompressed = width < 150;

  return (
    <div
      className={cn(
        "flex cursor-pointer select-none items-center px-3",
        "group relative border-gray-300 border-r",
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          onClose();
        }
      }}
      style={
        {
          width: `${width}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties
      }
    >
      <span className={cn("truncate", isCompressed ? "flex-shrink" : "flex-1")}>
        {title}
      </span>
      <Button intent="plain" size="square-petite" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      {isActive && (
        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-500" />
      )}
    </div>
  );
}
