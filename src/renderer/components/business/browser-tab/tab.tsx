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
        "group relative flex cursor-pointer items-center px-3",
        isActive ? "bg-bg" : "bg-transparent hover:bg-hover-primary",
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          onClick();
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
      <Button
        className="size-6"
        intent="plain"
        size="square-petite"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
