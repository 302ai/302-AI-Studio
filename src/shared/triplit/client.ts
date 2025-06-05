import { TriplitClient } from "@triplit/client";
import { schema } from "./schema";

export const triplitClient = new TriplitClient({
  storage: "memory",
  schema,
  serverUrl: "http://localhost:8080",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6InNlY3JldCIsIngtdHJpcGxpdC1wcm9qZWN0LWlkIjoiY2hhdC1hcHAtdHJpcGxpdCIsImlhdCI6MTc0OTAxODQ3Nn0.ZSADc7tonPAMQAZbSFOAdQYcabgDiDmFnKZE23gGzCc",
  autoConnect: true,
});

export const initTriplitClient = async () => {
  console.log("Triplit client initialized in renderer process");
  return triplitClient;
};
