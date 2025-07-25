import { SidebarItem } from "@renderer/components/ui/sidebar";
import type { Thread } from "@shared/triplit/types";
import { ThreadMenu } from "./thread-menu";

interface ThreadSearchListProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadClick: (threadId: string) => void;
}

export function ThreadSearchList({
  threads,
  activeThreadId,
  onThreadClick,
}: ThreadSearchListProps) {
  return (
    <div className="flex flex-col gap-y-1">
      {threads.map((thread) => {
        const { id } = thread;
        return (
          <SidebarItem
            className="flex h-10 flex-1 rounded-[10px] px-0 pr-2 pl-3"
            key={id}
            isCurrent={id === activeThreadId}
            onClick={() => onThreadClick(id)}
          >
            <ThreadMenu thread={thread} />
          </SidebarItem>
        );
      })}
    </div>
  );
}
