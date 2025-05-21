import { useState } from "react";

export type ModelActionType = "add" | "edit" | "delete";

export function useProviderList() {
  const [state, setState] = useState<ModelActionType | null>(null);

  const closeModal = () => {
    setState(null);
  };

  return { state, setState, closeModal };
}
