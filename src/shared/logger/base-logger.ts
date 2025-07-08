export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const COLORS = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
} as const;

type ColorKey = keyof typeof COLORS;

interface LogConfig {
  level: LogLevel;
  enableColors: boolean;
  includeTimestamp: boolean;
  prettyPrintThreshold: number;
}

interface FormatResult {
  formatted: string;
  isMultiline: boolean;
}

interface LogEntryOptions {
  level: string;
  levelColor: ColorKey;
  message: string;
  userContext?: Record<string, unknown>;
}

export class Logger {
  public readonly config: LogConfig;
  protected readonly context?: Record<string, unknown>;

  constructor(
    config: Partial<LogConfig> = {},
    context?: Record<string, unknown>,
  ) {
    this.config = {
      level: LogLevel.DEBUG,
      enableColors: true,
      includeTimestamp: true,
      prettyPrintThreshold: 100,
      ...config,
    };
    this.context = context ? { ...context } : undefined;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private colorize(text: string, color: ColorKey): string {
    if (!this.config.enableColors) return text;
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }

  protected shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatValue(value: unknown): FormatResult {
    if (typeof value === "string") {
      return { formatted: value, isMultiline: false };
    }

    if (typeof value === "object" && value !== null) {
      const compactJson = JSON.stringify(value);

      if (compactJson.length > this.config.prettyPrintThreshold) {
        const prettyJson = JSON.stringify(value, null, 2);
        return { formatted: prettyJson, isMultiline: true };
      }

      return { formatted: compactJson, isMultiline: false };
    }

    return { formatted: String(value), isMultiline: false };
  }

  private formatContextPairs(context: Record<string, unknown>): {
    singleLine: string[];
    multiLine: string[];
  } {
    const singleLine: string[] = [];
    const multiLine: string[] = [];

    for (const [key, value] of Object.entries(context)) {
      const { formatted, isMultiline } = this.formatValue(value);
      const pair = `${key}=${formatted}`;

      if (isMultiline) {
        multiLine.push(pair);
      } else {
        singleLine.push(pair);
      }
    }

    return { singleLine, multiLine };
  }

  private buildBaseMessage(
    level: string,
    levelColor: ColorKey,
    message: string,
  ): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(this.colorize(this.formatTimestamp(), "gray"));
    }

    parts.push(this.colorize(level.padEnd(5), levelColor));

    if (this.context) {
      const systemPairs = Object.entries(this.context).map(([key, value]) => {
        const formattedValue =
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value);
        return `${key}=${formattedValue}`;
      });
      parts.push(this.colorize(`{${systemPairs.join(" ")}}:`, "gray"));
    }

    parts.push(message);

    return parts.join(" ");
  }

  private formatLogEntry(options: LogEntryOptions): string {
    const { level, levelColor, message, userContext } = options;

    let logMessage = this.buildBaseMessage(level, levelColor, message);

    if (userContext) {
      const { singleLine, multiLine } = this.formatContextPairs(userContext);

      if (singleLine.length > 0) {
        logMessage += ` ${this.colorize(singleLine.join(" "), "gray")}`;
      }

      if (multiLine.length > 0) {
        logMessage += `\n${this.colorize(multiLine.join("\n"), "gray")}`;
      }
    }

    return logMessage;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(
      this.formatLogEntry({
        level: "DEBUG",
        levelColor: "cyan",
        message,
        userContext: context,
      }),
    );
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(
      this.formatLogEntry({
        level: "INFO",
        levelColor: "green",
        message,
        userContext: context,
      }),
    );
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(
      this.formatLogEntry({
        level: "WARN",
        levelColor: "yellow",
        message,
        userContext: context,
      }),
    );
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(
      this.formatLogEntry({
        level: "ERROR",
        levelColor: "red",
        message,
        userContext: context,
      }),
    );
  }

  child(context: Record<string, unknown>): Logger {
    const newContext = { ...this.context, ...context };
    return new Logger(this.config, newContext);
  }
}
