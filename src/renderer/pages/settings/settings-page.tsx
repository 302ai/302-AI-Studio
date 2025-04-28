import { ListBox, ListBoxItem } from "@renderer/components/ui/list-box";
import { useState } from "react";
import type { Selection } from "react-aria-components";

const roles = [
  { id: 1, name: "Admin", description: "Has full access to all resources" },
  {
    id: 2,
    name: "Editor",
    description: "Can edit content but has limited access to settings",
  },
  {
    id: 3,
    name: "Viewer",
    description: "Can view content but cannot make changes",
  },
  {
    id: 4,
    name: "Contributor",
    description: "Can contribute content for review",
  },
  {
    id: 5,
    name: "Guest",
    description: "Limited access, mostly for viewing purposes",
  },
];

export function SettingsPage() {
  const [selected, setSelected] = useState<Selection>(new Set([1]));

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-col">
        <ListBox
          selectedKeys={selected}
          onSelectionChange={setSelected}
          items={roles}
          aria-label="Settings"
        >
          {(item) => (
            <ListBoxItem key={item.id}>
              <div className="flex flex-col">
                <h3>{item.name}</h3>
              </div>
            </ListBoxItem>
          )}
        </ListBox>
      </div>
    </div>
  );
}
