import { useState } from "react";

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function useContextMenu() {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition>({
      x: 0,
      y: 0,
    });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const closeContextMenu = () => {
    setContextMenuOpen(false);
  };

  return {
    contextMenuOpen,
    contextMenuPosition,
    handleContextMenu,
    closeContextMenu,
    setContextMenuOpen,
  };
}
