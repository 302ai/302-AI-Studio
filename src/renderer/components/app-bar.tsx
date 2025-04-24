import { useEffect, useState } from "react";
import { FaRegWindowRestore } from "react-icons/fa6";
import { AiOutlineClose } from "react-icons/ai";
import { FaMinus } from "react-icons/fa6";
import { FaRegSquare } from "react-icons/fa6";
import { Button } from "@/renderer/components/ui/button";
import clsx from "clsx";

// 添加一个特殊的CSS类来覆盖Button的焦点样式
const windowControlButtonClass =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-0";

export function AppBar() {
  const [isMacOS, setIsMacOS] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if running on macOS
    setIsMacOS(window.App.platform === "darwin");

    // Initial check for maximized state
    const checkMaximized = async () => {
      try {
        const maximized = await window.App.window.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Failed to check if window is maximized:", error);
      }
    };

    checkMaximized();

    // Setup listeners for maximize/unmaximize events
    const cleanup = window.App.window.onMaximizeChange(setIsMaximized);

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  function minimizeWindow() {
    window.App.window.minimize();
  }

  function toggleMaximize() {
    window.App.window.maximize();
  }

  function closeWindow() {
    window.App.window.close();
  }

  // CSS classes for drag region
  const dragRegion = { WebkitAppRegion: "drag" } as React.CSSProperties;
  const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

  return (
    <div className="flex h-9 w-full flex-shrink-0 select-none items-center justify-between border-b bg-background">
      {/* App title/content in center */}
      <div
        className={clsx(
          "flex-1 text-center font-medium text-sm",
          isMacOS ? "px-20" : "px-4",
        )}
        style={dragRegion}
      >
        ChatChat
      </div>

      {/* Windows/Linux window controls */}
      {!isMacOS ? (
        <div className="flex h-9">
          <Button
            className={clsx(
              "inline-flex items-center justify-center",
              windowControlButtonClass,
            )}
            onClick={minimizeWindow}
            intent="plain"
            size="square-petite"
            style={noDragRegion}
          >
            <FaMinus className="h-4 w-4" />
          </Button>
          <Button
            className={clsx(
              "inline-flex items-center justify-center",
              windowControlButtonClass,
            )}
            onClick={toggleMaximize}
            intent="plain"
            size="square-petite"
            style={noDragRegion}
          >
            {!isMaximized ? (
              <FaRegSquare className="h-4 w-4" />
            ) : (
              <FaRegWindowRestore className="h-4 w-4" />
            )}
          </Button>
          <Button
            className={clsx(
              "inline-flex items-center justify-center hover:bg-destructive/80 hover:text-destructive-fg",
              windowControlButtonClass,
            )}
            onClick={closeWindow}
            intent="plain"
            size="square-petite"
            style={noDragRegion}
          >
            <AiOutlineClose className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* Spacer for macOS to maintain layout */
        <div className="px-4" />
      )}
    </div>
  );
}
