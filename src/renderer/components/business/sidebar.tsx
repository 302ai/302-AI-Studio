import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@renderer/components/ui/menu";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSectionGroup,
} from "@renderer/components/ui/sidebar";
import { MoreHorizontal, Pencil, Eraser, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "@renderer/hooks/use-sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  children: React.ReactNode;
}

export function AppSidebar(props: AppSidebarProps) {
  const { t } = useTranslation();

  const { groupedThreads } = useSidebar();

  return (
    <div className="flex h-[calc(100vh-var(--title-bar-height))] flex-1 flex-row">
      <Sidebar className="mt-[var(--title-bar-height)] bg-sidebar" {...props}>
        <SidebarContent>
          <SidebarSectionGroup>
            {groupedThreads.map((group) => (
              <SidebarSection key={group.section} title={group.section}>
                {group.threads.map((thread) => (
                  <SidebarItem key={thread.title}>
                    {({ isCollapsed }) => (
                      <>
                        <SidebarLabel>{thread.title}</SidebarLabel>
                        {!isCollapsed && (
                          <Menu>
                            <MenuTrigger aria-label="Manage">
                              <MoreHorizontal className="mr-2 h-4 w-4" />
                            </MenuTrigger>
                            <MenuContent offset={0} placement="right top">
                              <MenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("sidebar.menu-item.rename")}
                              </MenuItem>
                              <MenuItem>
                                <Eraser className="mr-2 h-4 w-4" />
                                {t("sidebar.menu-item.clean-messages")}
                              </MenuItem>
                              <MenuItem isDanger={true}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </MenuItem>
                            </MenuContent>
                          </Menu>
                        )}
                      </>
                    )}
                  </SidebarItem>
                ))}
              </SidebarSection>
            ))}
          </SidebarSectionGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-[calc(100vh-var(--title-bar-height))] p-2">
        {props.children}
      </SidebarInset>
    </div>
  );
}
