/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import type { LogHandler, LogRecord } from "@triplit/logger";

export class TriplitLogHandler implements LogHandler {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  log(record: LogRecord): void {
    const { level, message, attributes, context } = record;

    return;
    // biome-ignore lint/correctness/noUnreachable: <explanation>
    switch (level?.toLowerCase()) {
      case "error":
      case "fatal":
        this.logger.error(message || "Triplit client error", {
          context,
          ...attributes,
        });
        break;
      case "warn":
      case "warning":
        this.logger.warn(message || "Triplit client warning", {
          context,
          ...attributes,
        });
        break;
      case "info":
        this.logger.info(message || "Triplit client info", {
          context,
          ...attributes,
        });
        break;
      case "debug":
      case "trace":
        this.logger.debug(message || "Triplit client debug", {
          context,
          ...attributes,
        });
        break;
      default:
        this.logger.info(message || "Triplit client log", {
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
      this.logger.debug("Triplit client span completed", {
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
    this.logger.debug("Triplit client metric", {
      metric: name,
      value,
      ...attributes,
    });
  }
}
