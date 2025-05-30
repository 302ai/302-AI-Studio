export type ThreadStatus = "idle" | "working" | "error" | "completed";
export type ThreadSetting = {
  providerId: string;
  modelId: string;
};
export type ThreadItem = {
  id: string;
  title: string;
  settings: ThreadSetting;
  createdAt: string;
  updatedAt: string;
  isCollected: boolean;
  favicon?: string;
};
