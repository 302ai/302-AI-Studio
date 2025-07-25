/** biome-ignore-all lint/nursery/useUniqueElementIds: ignore */

import { SidebarController } from "@renderer/components/business/sidebar/sidebar-controller";
import { SearchField } from "@renderer/components/ui/search-field";
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
} from "@renderer/components/ui/sidebar";
import { useSideBar } from "@renderer/hooks/use-side-bar";
import { useThread } from "@renderer/hooks/use-thread";
import { useTranslation } from "react-i18next";
import { SettingButton } from "./setting-button";
import { ThreadMenu } from "./thread-menu";
import { ThreadSearchList } from "./thread-search-list";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  children: React.ReactNode;
}

export function AppSidebar(props: AppSidebarProps) {
  const { t } = useTranslation("translation", { keyPrefix: "sidebar" });
  const { activeThreadId, handleClickThread } = useThread();
  const {
    isSidebarCollapsed,
    groupedThreads,
    filteredThreads,
    searchQuery,
    setSearchQuery,
  } = useSideBar();

  return (
    <div className="flex h-[calc(100vh-var(--title-bar-height)+1px)] w-full flex-1 flex-row">
      <Sidebar
        className="mt-[calc(var(--title-bar-height)+1px)] border-none bg-sidebar"
        {...props}
      >
        <div className="my-2 flex flex-col gap-y-3 pr-2.5 pl-4">
          <div className="flex flex-row items-center justify-between gap-x-3">
            <SearchField
              className="h-10 rounded-[10px] bg-bg shadow-none"
              placeholder={t("search.placeholder")}
              value={searchQuery}
              onChange={setSearchQuery}
            />
            {!isSidebarCollapsed && <SidebarController />}
          </div>
        </div>

        <SidebarContent
          className="max-h-[calc(100vh-var(--title-bar-height)-52px-76px-8px)] py-0 pr-2 pl-4"
          style={{
            scrollbarGutter: "stable",
          }}
        >
          {searchQuery.trim() ? (
            <div className="px-4">
              <ThreadSearchList
                threads={filteredThreads}
                activeThreadId={activeThreadId}
                onThreadClick={handleClickThread}
              />
            </div>
          ) : (
            <SidebarDisclosureGroup
              className="gap-y-[10px]"
              defaultExpandedKeys={[
                "collected",
                "today",
                "yesterday",
                "last7Days",
                "last30Days",
                "earlier",
              ]}
            >
              {groupedThreads.map(({ key, label, threads }) => (
                <SidebarDisclosure id={key} key={key}>
                  <SidebarDisclosureTrigger className="h-10 rounded-[10px] px-3">
                    <SidebarLabel className="text-label-fg">
                      {label}
                    </SidebarLabel>
                  </SidebarDisclosureTrigger>
                  <SidebarDisclosurePanel className="gap-y-1">
                    {threads.map((thread) => (
                      <SidebarItem
                        className="flex h-10 max-w-[248px] rounded-[10px] px-0 pr-2 pl-3"
                        key={thread.id}
                        isCurrent={thread.id === activeThreadId}
                        onClick={() => handleClickThread(thread.id)}
                      >
                        <ThreadMenu thread={thread} />
                      </SidebarItem>
                    ))}
                  </SidebarDisclosurePanel>
                </SidebarDisclosure>
              ))}
            </SidebarDisclosureGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="mt-0 h-[76px] px-4">
          <SettingButton />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{props.children}</SidebarInset>
    </div>
  );
}
