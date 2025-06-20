export function createReasoningFetch(): typeof fetch {
  return async (url, options) => {
    const response = await fetch(url, options);
    const clonedResponse = response.clone();
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      const originalStream = clonedResponse.body;
      if (originalStream) {
        const reader = originalStream.getReader();
        const decoder = new TextDecoder();

        const reasoningProcessor = new ReasoningProcessor();

        const interceptedStream = new ReadableStream({
          start: (controller) => {
            const pump = () => {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }

                const chunk = decoder.decode(value, { stream: true });

                const processedChunk =
                  reasoningProcessor.processSSEChunk(chunk);

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
  };
}

class ReasoningProcessor {
  private isInThinkingMode = false;

  processSSEChunk(chunk: string): string {
    const lines = chunk.split("\n");
    const processedLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const jsonStr = line.substring(6);
          if (jsonStr.trim() === "[DONE]") {
            if (this.isInThinkingMode) {
              const doneData = JSON.parse(jsonStr);
              if (doneData?.choices?.[0]?.delta) {
                doneData.choices[0].delta.content = `${doneData.choices[0].delta.content || ""}</think>`;
              }
              this.isInThinkingMode = false;
              processedLines.push(`data: ${JSON.stringify(doneData)}`);
            } else {
              processedLines.push(line);
            }
            continue;
          }

          const data = JSON.parse(jsonStr);

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
          } else if (this.isInThinkingMode) {
            const existingContent = data.choices[0]?.delta?.content || "";
            if (data.choices?.[0]?.delta) {
              data.choices[0].delta.content = `</think>${existingContent}`;
            }
            this.isInThinkingMode = false;
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

  reset(): void {
    this.isInThinkingMode = false;
  }
}

export { ReasoningProcessor };
