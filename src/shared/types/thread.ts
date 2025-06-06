export type ThreadStatus = "idle" | "working" | "error" | "completed";
export type ThreadItem = {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
  collected: boolean;
  // favicon?: string;
};
