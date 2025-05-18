import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  SidebarDisclosure,
  SidebarDisclosureTrigger,
  SidebarDisclosurePanel,
  SidebarDisclosureGroup,
} from "@renderer/components/ui/sidebar";
import { useSidebar } from "@renderer/hooks/use-sidebar";
import { ThreadMenu } from "./thread-menu";
import { useTranslation } from "react-i18next";
import placeholder from "@renderer/assets/images/provider/302ai.png";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  children: React.ReactNode;
}

export function AppSidebar(props: AppSidebarProps) {
  const { t } = useTranslation();
  const { groupedThreads, collectedThreads, handleClickThread } = useSidebar();

  const handleSidebarItemClick = (threadId: string) => {
    handleClickThread(threadId);
  };

  return (
    <div className="flex h-[calc(100vh-var(--title-bar-height))] flex-1 flex-row">
      <Sidebar className="mt-[var(--title-bar-height)] bg-sidebar" {...props}>
        <SidebarContent>
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

            {groupedThreads.map((group) => (
              <SidebarDisclosure id={group.key} key={group.key}>
                <SidebarDisclosureTrigger>
                  <SidebarLabel>{group.label}</SidebarLabel>
                </SidebarDisclosureTrigger>
                <SidebarDisclosurePanel>
                  {group.threads.map((thread) => (
                    <SidebarItem
                      className="flex flex-1"
                      key={thread.id}
                      onClick={() => handleSidebarItemClick(thread.id)}
                    >
                      <img
                        src={thread.favicon || placeholder}
                        alt="favicon"
                        className="h-4 w-4 flex-shrink-0"
                      />
                      <ThreadMenu thread={thread} />
                    </SidebarItem>
                  ))}
                </SidebarDisclosurePanel>
              </SidebarDisclosure>
            ))}
          </SidebarDisclosureGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-[calc(100vh-var(--title-bar-height))] p-2">
        {props.children}
      </SidebarInset>
    </div>
  );
}
