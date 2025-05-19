import { Autocomplete, useFilter } from "react-aria-components";
import { SearchField } from "@renderer/components/ui/search-field";
import {
  ListBox,
  ListBoxItem,
  ListBoxSection,
} from "@renderer/components/ui/list-box";
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@renderer/components/ui/modal";
import { useThread } from "@renderer/hooks/use-thread";
import { useState } from "react";
import type { Selection } from "react-aria-components";

interface ThreadSearcherProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export function ThreadSearcher({ isOpen, onOpenChange }: ThreadSearcherProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  const { groupedThreads } = useThread();

  const [selected, setSelected] = useState<Selection>(new Set([1]));

  return (
    <ModalContent
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      closeButton={false}
      isBlurred
    >
      <ModalHeader className="hidden">
        <ModalTitle />
      </ModalHeader>
      <Autocomplete filter={contains}>
        <div className="border-b bg-muted p-2">
          <SearchField className="rounded-lg bg-bg" autoFocus />
        </div>
        <ListBox
          className="border-0 shadow-none"
          aria-label="Thread Item"
          items={groupedThreads}
          selectedKeys={selected}
          onSelectionChange={setSelected}
        >
          {groupedThreads.map((group) => (
            <ListBoxSection key={group.key} id={group.key} title={group.label}>
              {group.threads.map((thread) => (
                <ListBoxItem
                  className="cursor-pointer focus:bg-hover-primary"
                  key={thread.id}
                  id={thread.id}
                >
                  {thread.title}
                </ListBoxItem>
              ))}
            </ListBoxSection>
          ))}
        </ListBox>
      </Autocomplete>
    </ModalContent>
  );
}
