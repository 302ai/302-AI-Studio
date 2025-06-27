import Logger from "electron-log";

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

  processSSEChunk(chunk: string): string {
    const lines = chunk.split("\n");
    const processedLines: string[] = [];

    for (const line of lines) {
      Logger.info("linelinelinelinelinelinelinelinelinelinelinelineline", line);
      if (line.startsWith("data: ")) {
        try {
          const jsonStr = line.substring(6);
          if (jsonStr.trim() === "[DONE]") {
            if (this.isInThinkingMode) {
              // 在流结束时关闭思考标签
              const doneData = {
                choices: [{ delta: { content: "</think>" } }],
              };
              processedLines.push(`data: ${JSON.stringify(doneData)}`);
              this.isInThinkingMode = false;
            }
            processedLines.push(line);
            continue;
          }

          const data = JSON.parse(jsonStr);

          if (
            data.citations &&
            Array.isArray(data.citations) &&
            this.citations.length === 0
          ) {
            this.citations = data.citations;
          }

          if (data.choices?.[0]?.delta?.reasoning_content) {
            const reasoningContent = data.choices[0].delta.reasoning_content;
            const existingContent = data.choices[0].delta.content || "";

            if (!this.isInThinkingMode) {
              data.choices[0].delta.content = `${existingContent}<think>${reasoningContent}`;
              this.isInThinkingMode = true;
            } else {
              data.choices[0].delta.content =
                existingContent + reasoningContent;
            }

            delete data.choices[0].delta.reasoning_content;
          } else if (
            this.isInThinkingMode &&
            data.choices?.[0]?.delta?.content &&
            data.choices[0].delta.content.trim() !== ""
          ) {
            // 只有当有实际内容且在思考模式时，才关闭思考标签并切换到普通内容
            const existingContent = data.choices[0].delta.content;
            data.choices[0].delta.content = `</think>${existingContent}`;
            this.isInThinkingMode = false;
          }

          if (
            data.choices?.[0]?.finish_reason === "stop" &&
            this.citations.length > 0 &&
            !this.hasAddedCitations
          ) {
            const existingContent = data.choices[0].delta?.content || "";
            const citationsText = this.formatCitations();

            if (data.choices[0].delta) {
              data.choices[0].delta.content = existingContent + citationsText;
            } else {
              data.choices[0].delta = { content: citationsText };
            }

            this.hasAddedCitations = true;
          }

          processedLines.push(`data: ${JSON.stringify(data)}`);
        } catch (_error) {
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }

    return processedLines.join("\n");
  }

  private formatCitations(): string {
    if (this.citations.length === 0) return "";

    let citationsText = "\n";
    this.citations.forEach((citation, index) => {
      citationsText += `[${index + 1}] ${citation}\n`;
    });

    return citationsText;
  }

  reset(): void {
    this.isInThinkingMode = false;
    this.citations = [];
    this.hasAddedCitations = false;
  }
}

export { ReasoningProcessor };
