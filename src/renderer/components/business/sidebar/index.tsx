/** biome-ignore-all lint/nursery/useUniqueElementIds: ignore */
import {
  Sidebar,
  SidebarContent,
  SidebarDisclosure,
  SidebarDisclosureGroup,
  SidebarDisclosurePanel,
  SidebarDisclosureTrigger,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  useSidebar,
} from "@renderer/components/ui/sidebar";
import { useThread } from "@renderer/hooks/use-thread";
import { cn } from "@renderer/lib/utils";
import { useTranslation } from "react-i18next";
import { ThreadMenu } from "./thread-menu";

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

  return (
    <div className="flex h-[calc(100vh-var(--title-bar-height))] w-full flex-1 flex-row">
      <Sidebar className="mt-[var(--title-bar-height)] bg-sidebar" {...props}>
        <SidebarContent className="max-h-[calc(100vh-var(--title-bar-height))]">
          {/* All Threads */}
          <SidebarDisclosureGroup
            className="gap-y-0"
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
                <SidebarDisclosureTrigger>
                  <SidebarLabel>{t("sidebar.section.collected")}</SidebarLabel>
                </SidebarDisclosureTrigger>
              </SidebarDisclosure>
            )}

            {groupedThreads.map(({ key, label, threads }) => (
              <SidebarDisclosure id={key} key={key}>
                <SidebarDisclosureTrigger>
                  <SidebarLabel>{label}</SidebarLabel>
                </SidebarDisclosureTrigger>
                <SidebarDisclosurePanel>
                  {threads.map((thread) => {
                    const { id } = thread;
                    return (
                      <SidebarItem
                        className="flex flex-1"
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
      </Sidebar>

      <SidebarInset
        className={cn(
          "min-h-full",
          state === "expanded" && "max-w-[calc(100vw-var(--sidebar-width))]",
        )}
      >
        {props.children}
      </SidebarInset>
    </div>
  );
}
