/** biome-ignore-all lint/nursery/useUniqueElementIds: ignore */

import { SidebarController } from "@renderer/components/business/sidebar/sidebar-controller";
import {
  Sidebar,
  SidebarContent,
  SidebarDisclosure,
  SidebarDisclosureGroup,
  SidebarDisclosurePanel,
  SidebarDisclosureTrigger,
  SidebarFooter,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  useSidebar,
} from "@renderer/components/ui/sidebar";
import { useGlobalShortcutHandler } from "@renderer/hooks/use-global-shortcut-handler";
import { useThread } from "@renderer/hooks/use-thread";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchButton } from "./search-button";
import { SettingButton } from "./setting-button";
import { ThreadMenu } from "./thread-menu";
import { ThreadSearcher } from "./thread-searcher";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  children: React.ReactNode;
}

export function AppSidebar(props: AppSidebarProps) {
  const { t } = useTranslation();
  const {
    activeThreadId,
    groupedThreads,
    collectedThreads,
    handleClickThread,
  } = useThread();

  const { state } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);

  const isSidebarCollapsed = state === "collapsed";

  const handleSearchThread = () => {
    setIsOpen(!isOpen);
  };

  useGlobalShortcutHandler("search", () => handleSearchThread());

  return (
    <>
      <div className="flex h-[calc(100vh-var(--title-bar-height)+1px)] w-full flex-1 flex-row">
        <Sidebar
          className="mt-[calc(var(--title-bar-height)+1px)] border-none bg-sidebar"
          {...props}
        >
          <div className="my-2 flex flex-row items-center justify-between gap-x-3 pr-2.5 pl-4">
            <SearchButton onClick={handleSearchThread} />
            {!isSidebarCollapsed && <SidebarController />}
          </div>

          <SidebarContent className="max-h-[calc(100vh-var(--title-bar-height)-52px-76px-8px)] pb-2">
            {/* All Threads */}
            <SidebarDisclosureGroup
              className="gap-y-2"
              defaultExpandedKeys={[
                "collected",
                "today",
                "yesterday",
                "last7Days",
                "last30Days",
                "earlier",
              ]}
            >
              {/* If there are no collected threads, the collected section will will also be displayed */}
              {collectedThreads.length === 0 && (
                <SidebarDisclosure id="collected" key="collected">
                  <SidebarDisclosureTrigger className="h-10 rounded-[10px] px-3">
                    <SidebarLabel>
                      {t("sidebar.section.collected")}
                    </SidebarLabel>
                  </SidebarDisclosureTrigger>
                </SidebarDisclosure>
              )}

              {groupedThreads.map(({ key, label, threads }) => (
                <SidebarDisclosure id={key} key={key}>
                  <SidebarDisclosureTrigger className="h-10 rounded-[10px] px-3">
                    <SidebarLabel>{label}</SidebarLabel>
                  </SidebarDisclosureTrigger>
                  <SidebarDisclosurePanel>
                    {threads.map((thread) => {
                      const { id } = thread;
                      return (
                        <SidebarItem
                          className="flex h-10 flex-1 rounded-[10px] px-0 pr-2 pl-3"
                          key={id}
                          isCurrent={id === activeThreadId}
                          onClick={() => handleClickThread(id)}
                        >
                          <ThreadMenu thread={thread} />
                        </SidebarItem>
                      );
                    })}
                  </SidebarDisclosurePanel>
                </SidebarDisclosure>
              ))}
            </SidebarDisclosureGroup>
          </SidebarContent>

          <SidebarFooter className="mt-0 h-[76px] px-4">
            <SettingButton />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>{props.children}</SidebarInset>
      </div>

      <ThreadSearcher
        isOpenSearcher={isOpen}
        onOpenChange={handleSearchThread}
      />
    </>
  );
}
