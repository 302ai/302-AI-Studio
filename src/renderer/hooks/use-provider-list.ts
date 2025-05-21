import { useState } from "react";

export enum ModelAction {
  Add = "add",
  Edit = "edit",
  Delete = "delete",
}

export function useProviderList() {
  const [state, setState] = useState<ModelAction | null>(null);

  return { state, setState };
}
