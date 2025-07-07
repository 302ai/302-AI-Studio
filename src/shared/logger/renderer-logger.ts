import { Logger, LogLevel } from "./base-logger";

class RendererLogger extends Logger {
  private loggingEnabled = false;

  constructor(
    config: Partial<{
      level: LogLevel;
      enableColors: boolean;
      includeTimestamp: boolean;
      prettyPrintThreshold: number;
    }> = {},
    context?: Record<string, unknown>,
  ) {
    super(config, context);
  }

  setLoggingEnabled(enabled: boolean): void {
    this.loggingEnabled = enabled;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.loggingEnabled) return;
    super.debug(message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.loggingEnabled) return;
    super.info(message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.loggingEnabled) return;
    super.warn(message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (!this.loggingEnabled) return;
    super.error(message, context);
  }

  child(context: Record<string, unknown>): RendererLogger {
    const newContext = { ...this.context, ...context };
    const childLogger = new RendererLogger(this.config, newContext);
    childLogger.loggingEnabled = this.loggingEnabled;
    return childLogger;
  }
}

// Create default renderer logger instance
const rendererLogger = new RendererLogger({
  level: LogLevel.DEBUG,
  enableColors: true,
  includeTimestamp: true,
  prettyPrintThreshold: 100,
});

export function debug(
  message: string,
  context?: Record<string, unknown>,
): void {
  rendererLogger.debug(message, context);
}

export function info(message: string, context?: Record<string, unknown>): void {
  rendererLogger.info(message, context);
}

export function warn(message: string, context?: Record<string, unknown>): void {
  rendererLogger.warn(message, context);
}

export function error(
  message: string,
  context?: Record<string, unknown>,
): void {
  rendererLogger.error(message, context);
}

export function setLoggingEnabled(enabled: boolean): void {
  rendererLogger.setLoggingEnabled(enabled);
}

export { LogLevel, RendererLogger };
export default rendererLogger;
