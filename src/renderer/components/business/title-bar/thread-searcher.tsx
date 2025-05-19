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
import { useTranslation } from "react-i18next";
import { emitter, EventNames } from "@renderer/services/event-service";

interface ThreadSearcherProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export function ThreadSearcher({ isOpen, onOpenChange }: ThreadSearcherProps) {
  const { t } = useTranslation();
  const { contains } = useFilter({ sensitivity: "base" });
  const { groupedThreads } = useThread();

  const handleThreadClick = (id: string) => {
    emitter.emit(EventNames.THREAD_OPEN, { threadId: id });
    onOpenChange();
  };

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
          <SearchField
            className="rounded-lg bg-bg"
            placeholder={t("sidebar.search.placeholder")}
            autoFocus
          />
        </div>
        <ListBox
          className="border-0 shadow-none"
          aria-label="Thread Item"
          items={groupedThreads}
        >
          {groupedThreads.map(({ key, label, threads }) => (
            <ListBoxSection key={key} id={key} title={label}>
              {threads.map(({ id, title }) => (
                <ListBoxItem
                  className="flex cursor-pointer p-0"
                  key={id}
                  id={id}
                  textValue={title}
                >
                  <span
                    className="w-full rounded-lg px-[9.2px] py-[5.2px] hover:bg-hover-primary"
                    onPointerDown={() => handleThreadClick(id)}
                  >
                    {title}
                  </span>
                </ListBoxItem>
              ))}
            </ListBoxSection>
          ))}
        </ListBox>
      </Autocomplete>
    </ModalContent>
  );
}
