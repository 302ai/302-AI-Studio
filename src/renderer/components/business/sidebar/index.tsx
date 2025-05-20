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
import { ThreadMenu } from "./thread-menu";
import { useTranslation } from "react-i18next";
import placeholder from "@renderer/assets/images/providers/302ai.png";
import { useThread } from "@renderer/hooks/use-thread";

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

            {groupedThreads.map(({ key, label, threads }) => (
              <SidebarDisclosure id={key} key={key}>
                <SidebarDisclosureTrigger>
                  <SidebarLabel>{label}</SidebarLabel>
                </SidebarDisclosureTrigger>
                <SidebarDisclosurePanel>
                  {threads.map((thread) => {
                    const { id, title, favicon } = thread;
                    return (
                      <SidebarItem
                        className="flex flex-1"
                        key={id}
                        isCurrent={id === activeThreadId}
                        onClick={() =>
                          handleClickThread({
                            id,
                            title,
                            favicon: favicon ?? placeholder,
                          })
                        }
                      >
                        <img
                          src={favicon || placeholder}
                          alt="favicon"
                          className="h-4 w-4 flex-shrink-0"
                        />
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

      <SidebarInset className="min-h-[calc(100vh-var(--title-bar-height))] p-4">
        {props.children}
      </SidebarInset>
    </div>
  );
}
