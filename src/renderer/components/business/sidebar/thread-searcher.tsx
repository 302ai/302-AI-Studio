import {
  ListBox,
  ListBoxItem,
  ListBoxSection,
} from "@renderer/components/ui/list-box";
import { Modal } from "@renderer/components/ui/modal";
import { SearchField } from "@renderer/components/ui/search-field";
import { useThread } from "@renderer/hooks/use-thread";
import { Autocomplete, useFilter } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { ModelIcon } from "../model-icon";

interface ThreadSearcherProps {
  isOpenSearcher: boolean;
  onOpenChange: () => void;
}

export function ThreadSearcher({
  isOpenSearcher,
  onOpenChange,
}: ThreadSearcherProps) {
  const { t } = useTranslation();
  const { contains } = useFilter({ sensitivity: "base" });
  const { groupedThreads, handleClickThread } = useThread();

  const handleThreadClick = (threadId: string) => {
    handleClickThread(threadId);
    onOpenChange();
  };

  return (
    <Modal.Content
      isOpen={isOpenSearcher}
      onOpenChange={onOpenChange}
      closeButton={false}
      isBlurred
    >
      <Modal.Header className="hidden">
        <Modal.Title />
      </Modal.Header>
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
                  <div
                    className="flex w-full items-center gap-2 rounded-lg px-[9.2px] py-[5.2px] hover:bg-hover-primary"
                    onPointerDown={() => handleThreadClick(id)}
                  >
                    <ModelIcon
                      modelName="302"
                      className="size-4 flex-shrink-0"
                    />
                    {title}
                  </div>
                </ListBoxItem>
              ))}
            </ListBoxSection>
          ))}
        </ListBox>
      </Autocomplete>
    </Modal.Content>
  );
}
