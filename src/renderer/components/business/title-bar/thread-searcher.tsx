import { Autocomplete, useFilter } from "react-aria-components";
import { SearchField } from "@renderer/components/ui/search-field";
import { ListBox, ListBoxItem } from "@renderer/components/ui/list-box";
import { ModalContent } from "@renderer/components/ui/modal";

const languages = [
  { id: "en", name: "English" },
  { id: "es", name: "Spanish" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "it", name: "Italian" },
  { id: "pt", name: "Portuguese" },
  { id: "ru", name: "Russian" },
  { id: "ja", name: "Japanese" },
  { id: "zh", name: "Chinese" },
  { id: "ar", name: "Arabic" },
];

interface ThreadSearcherProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export function ThreadSearcher({ isOpen, onOpenChange }: ThreadSearcherProps) {
  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <ModalContent
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      closeButton={false}
      isBlurred
    >
      <Autocomplete filter={contains}>
        <div className="border-b bg-muted p-2">
          <SearchField className="rounded-lg bg-bg" autoFocus />
        </div>
        <ListBox className="border-0 shadow-none" items={languages}>
          {(item) => <ListBoxItem>{item.name}</ListBoxItem>}
        </ListBox>
      </Autocomplete>
    </ModalContent>
  );
}
