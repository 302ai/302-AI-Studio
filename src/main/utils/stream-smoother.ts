import logger from "@shared/logger/main-logger";

export interface StreamSmootherConfig {
  baseSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  chineseSpeedFactor: number;
  maxBufferSize: number;
  enabled: boolean;
}

export const DEFAULT_SMOOTHER_CONFIG: StreamSmootherConfig = {
  baseSpeed: 30, // 30 chars/second base speed
  minSpeed: 15, // minimum 15 chars/second
  maxSpeed: 100, // maximum 100 chars/second
  chineseSpeedFactor: 0.7, // Chinese chars display 30% slower
  maxBufferSize: 10000, // max 10K chars in buffer
  enabled: true,
};

interface Token {
  content: string;
  type: "chinese" | "english" | "punctuation" | "whitespace" | "code";
  delay: number; // delay in ms before this token
}

export class StreamSmoother {
  private config: StreamSmootherConfig;
  private buffer: string = "";
  private tokens: Token[] = [];
  private isStreaming: boolean = false;
  private outputCallback: (chunk: string) => void;
  private completionCallback?: () => void;
  private currentTokenIndex: number = 0;
  private totalOutputChars: number = 0;
  private streamStartTime: number = 0;
  private streamingTimer?: NodeJS.Timeout;
  private abortSignal?: AbortSignal;

  constructor(
    outputCallback: (chunk: string) => void,
    config: Partial<StreamSmootherConfig> = {},
    abortSignal?: AbortSignal,
  ) {
    this.config = { ...DEFAULT_SMOOTHER_CONFIG, ...config };
    this.outputCallback = outputCallback;
    this.abortSignal = abortSignal;
  }

  addChunk(chunk: string): void {
    if (!this.config.enabled) {
      this.outputCallback(chunk);
      return;
    }

    this.buffer += chunk;

    if (this.buffer.length > this.config.maxBufferSize) {
      logger.warn("StreamSmoother buffer overflow, flushing immediately");
      this.flush();
      return;
    }

    if (!this.isStreaming) {
      this.startStreaming();
    }
  }

  complete(callback?: () => void): void {
    this.completionCallback = callback;

    if (!this.config.enabled) {
      callback?.();
      return;
    }

    if (this.abortSignal?.aborted) {
      this.stopStreaming();
      return;
    }

    if (!this.isStreaming && this.buffer.length > 0) {
      this.startStreaming();
    }
  }

  flush(): void {
    if (this.buffer.length > 0) {
      this.outputCallback(this.buffer);
      this.buffer = "";
    }
    this.stopStreaming();
  }

  stop(): void {
    this.stopStreaming();
    this.buffer = "";
    this.tokens = [];
    this.currentTokenIndex = 0;
    this.totalOutputChars = 0;
  }

  private startStreaming(): void {
    if (this.isStreaming) return;

    this.isStreaming = true;
    this.streamStartTime = Date.now();

    this.tokenizeBuffer();
    this.streamNextToken();
  }

  private stopStreaming(): void {
    if (this.streamingTimer) {
      clearTimeout(this.streamingTimer);
      this.streamingTimer = undefined;
    }
    this.isStreaming = false;
  }

  private tokenizeBuffer(): void {
    if (!this.buffer) return;

    const newTokens = this.tokenizeText(this.buffer);
    this.tokens.push(...newTokens);
    this.buffer = "";

    this.calculateTokenDelays(this.tokens.length - newTokens.length);
  }

  private tokenizeText(text: string): Token[] {
    const tokens: Token[] = [];
    const regex = /[\u4e00-\u9fff]|[a-zA-Z]+|[0-9]+|[^\u4e00-\u9fff\w\s]|\s+/g;

    let match: RegExpExecArray | null;
    match = regex.exec(text);
    while (match !== null) {
      const content = match[0];
      const type = this.getTokenType(content);
      tokens.push({ content, type, delay: 0 });
      match = regex.exec(text);
    }

    return tokens;
  }

  private getTokenType(content: string): Token["type"] {
    if (/[\u4e00-\u9fff]/.test(content)) return "chinese";
    if (/[a-zA-Z0-9]/.test(content)) return "english";
    if (/\s/.test(content)) return "whitespace";
    if (/[`]{3}|```/.test(content)) return "code";
    return "punctuation";
  }

  private calculateTokenDelays(startIndex: number = 0): void {
    for (let i = startIndex; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const speed = this.calculateAdaptiveSpeed(token);

      const contentLength = token.content.length;
      token.delay = (contentLength / speed) * 1000;

      token.delay = Math.max(token.delay, 10);
    }
  }

  private calculateAdaptiveSpeed(token: Token): number {
    let speed = this.config.baseSpeed;
    switch (token.type) {
      case "chinese":
        speed *= this.config.chineseSpeedFactor;
        break;
      case "english":
        speed *= 1.2;
        break;
      case "code":
        speed *= 0.6;
        break;
      case "punctuation":
        speed *= 1.5;
        break;
      case "whitespace":
        speed *= 10;
        break;
    }
    const totalLength = this.tokens.reduce(
      (sum, t) => sum + t.content.length,
      0,
    );
    if (totalLength > 500) {
      speed *= 1.3;
    } else if (totalLength < 50) {
      speed *= 0.8;
    }

    return Math.max(
      this.config.minSpeed,
      Math.min(this.config.maxSpeed, speed),
    );
  }

  private streamNextToken(): void {
    if (this.abortSignal?.aborted) {
      this.stopStreaming();
      return;
    }

    if (this.buffer.length > 0) {
      this.tokenizeBuffer();
    }
    if (this.currentTokenIndex >= this.tokens.length) {
      if (this.completionCallback) {
        this.stopStreaming();
        this.completionCallback();
        return;
      }
      this.streamingTimer = setTimeout(() => this.streamNextToken(), 50);
      return;
    }

    const token = this.tokens[this.currentTokenIndex];

    this.outputCallback(token.content);
    this.totalOutputChars += token.content.length;
    this.currentTokenIndex++;
    const nextDelay = Math.max(token.delay, 1);
    this.streamingTimer = setTimeout(() => this.streamNextToken(), nextDelay);
  }

  getStats() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.streamStartTime;
    const avgSpeed = elapsed > 0 ? (this.totalOutputChars / elapsed) * 1000 : 0;

    return {
      totalOutputChars: this.totalOutputChars,
      elapsedTime: elapsed,
      averageSpeed: avgSpeed,
      bufferedChars: this.buffer.length,
      queuedTokens: this.tokens.length - this.currentTokenIndex,
      isStreaming: this.isStreaming,
    };
  }

  updateConfig(newConfig: Partial<StreamSmootherConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (!this.config.enabled && this.isStreaming) {
      this.flush();
    }
  }
}
