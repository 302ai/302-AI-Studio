import { schema } from "@shared/triplit/schema";
import { TriplitClient } from "@triplit/client";
import { Logger, LogHandler, LogRecord } from "@triplit/logger";
import logger from "@shared/logger/renderer-logger";

// Custom LogHandler for triplit client using our logger system
class TriplitClientLogHandler implements LogHandler {
  log(record: LogRecord): void {
    const { level, message, attributes, context } = record;

    switch (level?.toLowerCase()) {
      case "error":
      case "fatal":
        logger.error(message || "Triplit client error", {
          context,
          ...attributes,
        });
        break;
      case "warn":
        logger.warn(message || "Triplit client warning", {
          context,
          ...attributes,
        });
        break;
      case "info":
        logger.info(message || "Triplit client info", {
          context,
          ...attributes,
        });
        break;
      case "debug":
      case "trace":
        logger.debug(message || "Triplit client debug", {
          context,
          ...attributes,
        });
        break;
      default:
        logger.info(message || "Triplit client log", {
          level,
          context,
          ...attributes,
        });
    }
  }

  startSpan(
    name: string,
    context?: string,
    attributes?: Record<string, any>,
  ): any {
    return { name, context, attributes, startTime: Date.now() };
  }

  endSpan(span: any): void {
    if (span?.name) {
      const duration = Date.now() - (span.startTime || Date.now());
      logger.debug("Triplit client span completed", {
        span: span.name,
        duration: `${duration}ms`,
        context: span.context,
      });
    }
  }

  recordMetric(
    name: string,
    value: number,
    attributes?: Record<string, any>,
  ): void {
    logger.debug("Triplit client metric", {
      metric: name,
      value,
      ...attributes,
    });
  }
}

// Create custom logger instance for triplit
const triplitLogger = new Logger([new TriplitClientLogHandler()]);

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
