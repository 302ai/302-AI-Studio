export type ThreadStatus = "idle" | "working" | "error" | "completed";
export type ThreadItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isCollected: boolean;
  favicon?: string;
};
