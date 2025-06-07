import { schema } from "@shared/triplit/schema";
import { TriplitClient } from "@triplit/client";

export const triplitClient = new TriplitClient({
  storage: "memory",
  schema,
  serverUrl: "http://localhost:6543", // * 在生产环境中使用本地起的服务器端口
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6ImFub24iLCJ4LXRyaXBsaXQtcHJvamVjdC1pZCI6ImxvY2FsLXByb2plY3QtaWQifQ.JzN7Erur8Y-MlFdCaZtovQwxN_m_fSyOIWNzYQ3uVcc",
  autoConnect: false,
});


