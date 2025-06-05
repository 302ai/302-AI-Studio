import { schema } from "@shared/triplit/schema";
import { TriplitClient } from "@triplit/client";

export class BaseDbService {
  protected client: TriplitClient<typeof schema>;

  constructor() {
    this.client = new TriplitClient({
      storage: "memory",
      schema,
      serverUrl: "http://localhost:8080",
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6InNlY3JldCIsIngtdHJpcGxpdC1wcm9qZWN0LWlkIjoiY2hhdC1hcHAtdHJpcGxpdCIsImlhdCI6MTc0OTAxODQ3Nn0.ZSADc7tonPAMQAZbSFOAdQYcabgDiDmFnKZE23gGzCc",
      autoConnect: true,
    });
  }

  protected getTriplitClient() {
    return this.client;
  }
}
