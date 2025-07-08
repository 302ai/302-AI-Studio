import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { Logger, LogLevel } from "./base-logger";

class MainLogger extends Logger {
  private logFilePath?: string;
  private loggingEnabled = false;

  constructor(
    config: Partial<{
      level: LogLevel;
      enableColors: boolean;
      includeTimestamp: boolean;
      prettyPrintThreshold: number;
      enableFileLogging: boolean;
    }> = {},
    context?: Record<string, unknown>,
  ) {
    super(config, context);

    if (config.enableFileLogging !== false) {
      this.initializeFileLogging();
    }
  }

  private initializeFileLogging(): void {
    try {
      const userData = app?.getPath("userData");
      if (userData) {
        const logsDir = path.join(userData, "logs");

        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }

        this.logFilePath = path.join(logsDir, "main.log");
      }
    } catch (error) {
      console.error("Failed to initialize file logging:", error);
    }
  }

  private writeToFile(message: string): void {
    if (!this.logFilePath || !this.loggingEnabled) return;

    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;

      fs.appendFileSync(this.logFilePath, logEntry, "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  setLoggingEnabled(enabled: boolean): void {
    this.loggingEnabled = enabled;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    super.debug(message, context);
    this.writeToFile(
      `DEBUG: ${message} ${context ? JSON.stringify(context) : ""}`,
    );
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    super.info(message, context);
    this.writeToFile(
      `INFO: ${message} ${context ? JSON.stringify(context) : ""}`,
    );
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    super.warn(message, context);
    this.writeToFile(
      `WARN: ${message} ${context ? JSON.stringify(context) : ""}`,
    );
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    super.error(message, context);
    this.writeToFile(
      `ERROR: ${message} ${context ? JSON.stringify(context) : ""}`,
    );
  }

  child(context: Record<string, unknown>): MainLogger {
    const newContext = { ...this.context, ...context };
    const childLogger = new MainLogger(this.config, newContext);
    childLogger.logFilePath = this.logFilePath;
    childLogger.loggingEnabled = this.loggingEnabled;
    return childLogger;
  }
}

// Create default main logger instance
const mainLogger = new MainLogger({
  level: LogLevel.DEBUG,
  enableColors: true,
  includeTimestamp: true,
  prettyPrintThreshold: 100,
  enableFileLogging: true,
});

export function debug(
  message: string,
  context?: Record<string, unknown>,
): void {
  mainLogger.debug(message, context);
}

export function info(message: string, context?: Record<string, unknown>): void {
  mainLogger.info(message, context);
}

export function warn(message: string, context?: Record<string, unknown>): void {
  mainLogger.warn(message, context);
}

export function error(
  message: string,
  context?: Record<string, unknown>,
): void {
  mainLogger.error(message, context);
}

export function setLoggingEnabled(enabled: boolean): void {
  mainLogger.setLoggingEnabled(enabled);
}

export { LogLevel, MainLogger };
export default mainLogger;
