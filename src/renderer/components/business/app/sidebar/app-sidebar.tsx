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
  SidebarProvider,
  SidebarSection,
  SidebarSectionGroup,
} from "@renderer/components/ui/sidebar";
import { MoreHorizontal, Pencil, Eraser, Trash2 } from "lucide-react";

const articles = [
  { label: "How to" },
  { label: "The Future of Remote Work" },
  { label: "Top 10 Design Tips" },
  { label: "Guide to Mental Health" },
  { label: "AI in Everyday Life" },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <>
      <SidebarProvider>
        <Sidebar className="mt-[var(--title-bar-height)] bg-sidebar" {...props}>
          <SidebarContent>
            <SidebarSectionGroup>
              <SidebarSection title="Last 5 Articles">
                {articles.map((item) => (
                  <SidebarItem key={item.label}>
                    {({ isCollapsed }) => (
                      <>
                        <SidebarLabel>{item.label}</SidebarLabel>
                        {!isCollapsed && (
                          <Menu>
                            <MenuTrigger aria-label="Manage">
                              <MoreHorizontal className="mr-2 h-4 w-4" />
                            </MenuTrigger>
                            <MenuContent offset={0} placement="right top">
                              <MenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </MenuItem>
                              <MenuItem>
                                <Eraser className="mr-2 h-4 w-4" />
                                Clean Messages
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
            </SidebarSectionGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <div className="p-4 lg:p-6">123</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
