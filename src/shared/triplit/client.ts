import { TriplitClient } from "@triplit/client";
import { schema } from "./schema";

export const triplitClient = new TriplitClient({
  storage: "indexeddb",
  schema,
  autoConnect: false,
});

export const initTriplitClient = async () => {
  console.log("Triplit client initialized in renderer process");
  return triplitClient;
};
