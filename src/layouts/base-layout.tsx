import React from "react";
import DragWindowRegion from "@/components/drag-window-region";
import NavigationMenu from "@/components/template/navigation-menu";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DragWindowRegion title="ChatChat" />
      <NavigationMenu />
      <main className="h-screen p-2 pb-20">{children}</main>
    </>
  );
}
