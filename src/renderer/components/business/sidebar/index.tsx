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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  children: React.ReactNode;
}

export function AppSidebar(props: AppSidebarProps) {
  const { groupedThreads, handleClickThread } = useSidebar();

  return (
    <div className="flex h-[calc(100vh-var(--title-bar-height))] flex-1 flex-row">
      <Sidebar className="mt-[var(--title-bar-height)] bg-sidebar" {...props}>
        <SidebarContent>
          <SidebarDisclosureGroup
            defaultExpandedKeys={[
              "today",
              "yesterday",
              "last7Days",
              "last30Days",
              "earlier",
            ]}
          >
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
                      onClick={() => handleClickThread(thread.id)}
                    >
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
