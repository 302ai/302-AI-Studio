// import Logger from "electron-log";

import Logger from "electron-log";

interface SSEData {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string;
  }>;
  citations?: string[];
}

interface DeltaContent {
  content?: string;
  reasoning_content?: string;
}

interface Choice {
  delta?: DeltaContent;
  finish_reason?: string;
}

export function createReasoningFetch(): typeof fetch {
  return async (url, options) => {
    const response = await fetch(url, options);
    const reasoningProcessor = new ReasoningProcessor();
    return interceptSSEResponse(response, reasoningProcessor);
  };
}

export function interceptSSEResponse(
  response: Response,
  processor: ReasoningProcessor,
): Response {
  const clonedResponse = response.clone();
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("text/event-stream")) {
    const originalStream = clonedResponse.body;
    if (originalStream) {
      const reader = originalStream.getReader();
      const decoder = new TextDecoder();

      const interceptedStream = new ReadableStream({
        start: (controller) => {
          const pump = () => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }

              const chunk = decoder.decode(value, { stream: true });
              const processedChunk = processor.processSSEChunk(chunk);
              const encoder = new TextEncoder();
              const processedValue = encoder.encode(processedChunk);

              controller.enqueue(processedValue);
              return pump();
            });
          };
          return pump();
        },
      });

      return new Response(interceptedStream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
  }

  return response;
}

class ReasoningProcessor {
  private isInThinkingMode = false;
  private citations: string[] = [];
  private hasAddedCitations = false;
  private isInReasoningMode: boolean;
  private isStartWithThink = false;

  constructor(isInReasoningMode = false) {
    this.isInReasoningMode = isInReasoningMode;
  }

  processSSEChunk(chunk: string): string {
    const lines = chunk.split("\n");
    const processedLines = lines.map((line) => this.processLine(line));
    return processedLines.join("\n");
  }

  private processLine(line: string): string {
    if (!line.startsWith("data: ")) {
      let data: { error?: { message: string } };
      try {
        data = JSON.parse(line);
      } catch (_error) {
        return line;
      }

      if (data?.error) {
        // * error":{"err_code":-10003,"message":"Network error, please try again later","message_cn":"网络错误，请稍后重试","message_jp":"ネットワークエラー、後でもう一度お試しください。  ","type":"api_error"}}
        throw new Error(data.error.message);
      }

      return line;
    }

    Logger.info("line", line);

    const jsonStr = line.substring(6); // * remove "data: "

    if (this.isDoneMessage(jsonStr)) {
      return this.handleDoneMessage(line);
    }

    try {
      const data = JSON.parse(jsonStr) as SSEData;
      this.extractCitations(data);
      this.processReasoningContent(data);
      this.addCitationsIfNeeded(data);
      return `data: ${JSON.stringify(data)}`;
    } catch {
      return line;
    }
  }

  private isDoneMessage(jsonStr: string): boolean {
    if (jsonStr.trim() === "[DONE]") {
      Logger.info("isDoneMessage,isDoneMessage,isDoneMessage,isDoneMessage");
    }
    return jsonStr.trim() === "[DONE]";
  }

  private handleDoneMessage(line: string): string {
    if (this.isInThinkingMode) {
      const endThinkingData = this.createEndThinkingData();
      return `data: ${JSON.stringify(endThinkingData)}\n${line}`;
    }
    return line;
  }

  private createEndThinkingData(): SSEData {
    return {
      choices: [
        {
          delta: {
            content: this.isInReasoningMode ? "</reason>" : "</think>",
          },
        },
      ],
    };
  }

  private extractCitations(data: SSEData): void {
    const citations = data.citations;
    if (this.citations.length === 0 && citations && citations.length > 0) {
      this.citations = citations;
    }
  }

  private processReasoningContent(data: SSEData): void {
    const choice = this.getFirstChoice(data);
    const delta = choice?.delta;

    if (!delta) {
      return;
    }

    const hasReasoningContent = "reasoning_content" in delta;
    const reasoningContentIsNotNull = delta.reasoning_content !== null;
    const reasoningContentIsEmpty = delta.reasoning_content === "";
    const contentIsNull = delta.content === null;

    const existingContent = delta.content || "";

    const startWithThink = existingContent === "<think>";
    if (startWithThink) {
      this.isStartWithThink = true;
    }

    if (
      (hasReasoningContent &&
        reasoningContentIsNotNull &&
        !reasoningContentIsEmpty) ||
      startWithThink ||
      this.isStartWithThink
    ) {
      this.handleReasoningContent(delta, existingContent);
    } else if (
      this.isInThinkingMode &&
      (!hasReasoningContent ||
        !reasoningContentIsNotNull ||
        (reasoningContentIsEmpty && contentIsNull))
    ) {
      this.handleEndOfThinking(delta, existingContent);
    }
  }

  private handleReasoningContent(
    delta: DeltaContent,
    existingContent: string,
  ): void {
    const hasReasoningContent = "reasoning_content" in delta;
    const reasoningContent = delta.reasoning_content;

    if (reasoningContent || hasReasoningContent) {
      if (!this.isInThinkingMode) {
        delta.content = this.createThinkingStartContent(
          existingContent,
          reasoningContent ?? "",
        );

        this.isInThinkingMode = true;
      } else {
        delta.content = existingContent + reasoningContent;
      }

      delete delta.reasoning_content;

      return;
    } else {
      // * If there is no reasoning content but has <think>, we need to start thinking
      this.isInThinkingMode = true;
    }
  }

  private createThinkingStartContent(
    existingContent: string,
    reasoningContent: string,
  ): string {
    const tag = this.isInReasoningMode ? "<reason>" : "<think>";
    return `${existingContent}${tag}${reasoningContent}`;
  }

  private handleEndOfThinking(
    delta: DeltaContent,
    existingContent: string,
  ): void {
    let endTag = "</think>";

    if (this.isInReasoningMode) {
      this.isInReasoningMode = false;
      endTag = "</reason>";
    }

    if (this.isStartWithThink) {
      endTag = "";
      this.isStartWithThink = false;
    }

    delta.content = `${endTag}${existingContent}`;
    this.isInThinkingMode = false;
  }

  private addCitationsIfNeeded(data: SSEData): void {
    const choice = this.getFirstChoice(data);

    if (!this.shouldAddCitations(choice)) return;

    const delta = choice?.delta;
    const existingContent = delta?.content || "";
    const citationsText = this.formatCitations();

    if (choice && delta) {
      delta.content = existingContent + citationsText;
      this.hasAddedCitations = true;
    } else if (choice) {
      choice.delta = { content: citationsText };
      this.hasAddedCitations = true;
    }
  }

  private shouldAddCitations(choice: Choice | undefined): boolean {
    if (!choice) return false;

    return (
      choice.finish_reason === "stop" &&
      this.citations.length > 0 &&
      !this.hasAddedCitations
    );
  }

  private getFirstChoice(data: SSEData): Choice | undefined {
    const choices = data.choices;
    return choices && choices.length > 0 ? choices[0] : undefined;
  }

  private formatCitations(): string {
    if (this.citations.length === 0) {
      return "";
    }

    const citationLines = this.citations.map(
      (citation, index) => `[${index + 1}] ${citation}`,
    );

    return `\n${citationLines.join("\n")}\n`;
  }

  reset(): void {
    this.isInThinkingMode = false;
    this.citations = [];
    this.hasAddedCitations = false;
  }
}

export { ReasoningProcessor };
