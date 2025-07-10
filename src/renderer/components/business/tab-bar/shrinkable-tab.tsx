import { cn } from "@renderer/lib/utils";
import { Settings2, X } from "lucide-react";

interface ShrinkableTabProps {
  title: string;
  isActive: boolean;
  width: number;
  type: "thread" | "setting";
  handleTabClose: () => void;
}

export function ShrinkableTab({
  title,
  isActive,
  width,
  type,
  handleTabClose,
}: ShrinkableTabProps) {
  // * The three different compression states for the tab
  const isShrinkedOne = width <= 100;
  const isShrinkedTwo = width <= 80;
  const isShrinkedThree = width <= 50;

  if (isShrinkedThree) {
    return !isActive ? (
      type === "setting" ? (
        <Settings2 className="h-4 w-4 flex-shrink-0" />
      ) : (
        <span className="flex-1 truncate text-xs">{title}</span>
      )
    ) : (
      <X
        className="absolute size-5 shrink-0 rounded-[4px] p-1"
        onClick={(e) => {
          e.stopPropagation();
          handleTabClose();
        }}
      />
    );
  }

  return (
    <>
      {type === "setting" && (
        <Settings2
          className={cn(
            "h-4 w-4 flex-shrink-0",
            isShrinkedTwo ? "mr-0" : "mr-2",
          )}
        />
      )}
      <span
        className={cn(
          "truncate text-left text-xs",
          isShrinkedOne ? "flex-shrink" : "flex-1",
        )}
      >
        {title}
      </span>
      <X
        className={cn(
          "shrink-0 rounded-[4px] p-1",
          isActive ? "hover:bg-accent-hover" : "hover:bg-hover-2",
          isShrinkedTwo ? "size-5" : "size-6",
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleTabClose();
        }}
      />
    </>
  );
}
