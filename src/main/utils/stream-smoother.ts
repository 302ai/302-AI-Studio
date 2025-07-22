import logger from "@shared/logger/main-logger";

/**
 * Configuration for stream smoothing
 */
export interface StreamSmootherConfig {
  /** Base output speed in characters per second */
  baseSpeed: number;
  /** Minimum output speed in characters per second */
  minSpeed: number;
  /** Maximum output speed in characters per second */
  maxSpeed: number;
  /** Speed factor for Chinese characters (multiplier) */
  chineseSpeedFactor: number;
  /** Maximum buffer size to prevent memory issues */
  maxBufferSize: number;
  /** Enable/disable smooth streaming */
  enabled: boolean;
}

/**
 * Default configuration for stream smoother
 */
export const DEFAULT_SMOOTHER_CONFIG: StreamSmootherConfig = {
  baseSpeed: 30,           // 30 chars/second base speed
  minSpeed: 15,           // minimum 15 chars/second
  maxSpeed: 100,          // maximum 100 chars/second
  chineseSpeedFactor: 0.7, // Chinese chars display 30% slower
  maxBufferSize: 10000,   // max 10K chars in buffer
  enabled: true,
};

/**
 * Token types for intelligent chunking
 */
interface Token {
  content: string;
  type: 'chinese' | 'english' | 'punctuation' | 'whitespace' | 'code';
  delay: number; // delay in ms before this token
}

/**
 * StreamSmoother provides intelligent buffering and speed control
 * for streaming text output to create a smooth, typewriter-like effect
 */
export class StreamSmoother {
  private config: StreamSmootherConfig;
  private buffer: string = '';
  private tokens: Token[] = [];
  private isStreaming: boolean = false;
  private outputCallback: (chunk: string) => void;
  private completionCallback?: () => void;
  private currentTokenIndex: number = 0;
  private totalOutputChars: number = 0;
  private streamStartTime: number = 0;
  private streamingTimer?: NodeJS.Timeout;

  constructor(
    outputCallback: (chunk: string) => void,
    config: Partial<StreamSmootherConfig> = {},
  ) {
    this.config = { ...DEFAULT_SMOOTHER_CONFIG, ...config };
    this.outputCallback = outputCallback;
  }

  /**
   * Add new content chunk to the buffer
   */
  addChunk(chunk: string): void {
    if (!this.config.enabled) {
      // If smoothing is disabled, output immediately
      this.outputCallback(chunk);
      return;
    }

    this.buffer += chunk;
    
    // Prevent buffer overflow
    if (this.buffer.length > this.config.maxBufferSize) {
      logger.warn('StreamSmoother buffer overflow, flushing immediately');
      this.flush();
      return;
    }

    // Start streaming if not already started
    if (!this.isStreaming) {
      this.startStreaming();
    }
  }

  /**
   * Signal that no more chunks will be added
   */
  complete(callback?: () => void): void {
    this.completionCallback = callback;
    
    if (!this.config.enabled) {
      callback?.();
      return;
    }

    // If not streaming, start immediately
    if (!this.isStreaming && this.buffer.length > 0) {
      this.startStreaming();
    }
  }

  /**
   * Force immediate output of all buffered content
   */
  flush(): void {
    if (this.buffer.length > 0) {
      this.outputCallback(this.buffer);
      this.buffer = '';
    }
    this.stopStreaming();
  }

  /**
   * Stop streaming and clear all state
   */
  stop(): void {
    this.stopStreaming();
    this.buffer = '';
    this.tokens = [];
    this.currentTokenIndex = 0;
    this.totalOutputChars = 0;
  }

  /**
   * Start the streaming process
   */
  private startStreaming(): void {
    if (this.isStreaming) return;
    
    this.isStreaming = true;
    this.streamStartTime = Date.now();
    
    // Tokenize the current buffer
    this.tokenizeBuffer();
    
    // Start streaming tokens
    this.streamNextToken();
  }

  /**
   * Stop the streaming process
   */
  private stopStreaming(): void {
    if (this.streamingTimer) {
      clearTimeout(this.streamingTimer);
      this.streamingTimer = undefined;
    }
    this.isStreaming = false;
  }

  /**
   * Tokenize buffer content into intelligent chunks
   */
  private tokenizeBuffer(): void {
    if (!this.buffer) return;

    const newTokens = this.tokenizeText(this.buffer);
    this.tokens.push(...newTokens);
    this.buffer = '';
    
    // Calculate delays for new tokens
    this.calculateTokenDelays(this.tokens.length - newTokens.length);
  }

  /**
   * Tokenize text into intelligent chunks
   */
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

  /**
   * Determine token type for intelligent processing
   */
  private getTokenType(content: string): Token['type'] {
    if (/[\u4e00-\u9fff]/.test(content)) return 'chinese';
    if (/[a-zA-Z0-9]/.test(content)) return 'english';
    if (/\s/.test(content)) return 'whitespace';
    if (/[`]{3}|```/.test(content)) return 'code';
    return 'punctuation';
  }

  /**
   * Calculate delays for tokens based on adaptive speed
   */
  private calculateTokenDelays(startIndex: number = 0): void {
    for (let i = startIndex; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const speed = this.calculateAdaptiveSpeed(token);
      
      // Calculate delay based on content length and speed
      const contentLength = token.content.length;
      token.delay = (contentLength / speed) * 1000; // convert to ms
      
      // Apply minimum delay for better visual effect
      token.delay = Math.max(token.delay, 10);
    }
  }

  /**
   * Calculate adaptive speed for a token
   */
  private calculateAdaptiveSpeed(token: Token): number {
    let speed = this.config.baseSpeed;

    // Adjust for token type
    switch (token.type) {
      case 'chinese':
        speed *= this.config.chineseSpeedFactor;
        break;
      case 'english':
        // English words can be displayed faster
        speed *= 1.2;
        break;
      case 'code':
        // Code should be displayed slower for readability
        speed *= 0.6;
        break;
      case 'punctuation':
        // Punctuation can be fast
        speed *= 1.5;
        break;
      case 'whitespace':
        // Whitespace is instant
        speed *= 10;
        break;
    }

    // Apply dynamic adjustment based on total content length
    const totalLength = this.tokens.reduce((sum, t) => sum + t.content.length, 0);
    if (totalLength > 500) {
      // Speed up for long content
      speed *= 1.3;
    } else if (totalLength < 50) {
      // Slow down for short content
      speed *= 0.8;
    }

    // Ensure speed is within bounds
    return Math.max(this.config.minSpeed, Math.min(this.config.maxSpeed, speed));
  }

  /**
   * Stream the next token
   */
  private streamNextToken(): void {
    // Check if we need to tokenize more buffer content
    if (this.buffer.length > 0) {
      this.tokenizeBuffer();
    }

    // If no more tokens and we're done, complete
    if (this.currentTokenIndex >= this.tokens.length) {
      if (this.completionCallback) {
        this.stopStreaming();
        this.completionCallback();
        return;
      }
      // If no completion callback, wait for more content or completion signal
      this.streamingTimer = setTimeout(() => this.streamNextToken(), 50);
      return;
    }

    const token = this.tokens[this.currentTokenIndex];
    
    // Output the token
    this.outputCallback(token.content);
    this.totalOutputChars += token.content.length;
    this.currentTokenIndex++;

    // Schedule next token
    const nextDelay = Math.max(token.delay, 1);
    this.streamingTimer = setTimeout(() => this.streamNextToken(), nextDelay);
  }

  /**
   * Get current streaming statistics
   */
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

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StreamSmootherConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If smoothing was disabled, flush immediately
    if (!this.config.enabled && this.isStreaming) {
      this.flush();
    }
  }
}