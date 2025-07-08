/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import logger from "@shared/logger/renderer-logger";
import { schema } from "@shared/triplit/schema";
import { TriplitLogHandler } from "@shared/triplit/log-handler";
import { TriplitClient } from "@triplit/client";
import { Logger } from "@triplit/logger";

// Create custom logger instance for triplit
const triplitLogger = new Logger([new TriplitLogHandler(logger)]);

export const triplitClient = new TriplitClient({
  storage: "memory",
  schema,
  serverUrl: "http://localhost:9000", // * 在生产环境中使用本地起的服务器端口
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6InNlY3JldCIsIngtdHJpcGxpdC1wcm9qZWN0LWlkIjoiY2hhdC1hcHAtdHJpcGxpdCIsImlhdCI6MTc0OTgwMjQyOH0.ju3YiF8-SUmzl8CG8Pmtp_RAqkorOjr3jrW-NOGe2zc",
  autoConnect: false,
  logger: triplitLogger,
});

export const initTriplitClient = () => {
  logger.info("TriplitClient: Initialized in renderer process");
  return triplitClient;
};
