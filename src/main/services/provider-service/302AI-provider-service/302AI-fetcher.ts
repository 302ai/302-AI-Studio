import type { WebSearchConfig } from "@main/services/db-service/settings-db-service";
import {
  interceptSSEResponse,
  ReasoningProcessor,
} from "@main/utils/reasoning";
import logger from "@shared/logger/main-logger";

export function ai302Fetcher(
  enableReason: boolean = false,
  webSearchConfig: WebSearchConfig = { enabled: false, service: "search1api" },
  enableVison: boolean = false,
  isClaude: boolean = false,
): typeof fetch {
  return async (url, options) => {
    let modifiedOptions = options;

    if (options?.method === "POST" && options?.body) {
      try {
        const bodyData = JSON.parse(options.body as string);

        bodyData["file-parse"] = true;
        bodyData["parse-service"] = "jina";

        if (isClaude) {
          bodyData.thinking = {
            type: "enabled",
            budget_tokens: 16000,
          };
        }

        if (enableVison) {
          // biome-ignore lint/complexity/useLiteralKeys: <ignore>
          bodyData["ocr_model"] = "gpt-4.1-nano";
        }
        if (enableReason) {
          bodyData["r1-fusion"] = true;
        }

        if (webSearchConfig.enabled) {
          bodyData["web-search"] = true;
          bodyData["search-service"] = webSearchConfig.service || "search1api";
        }

        modifiedOptions = {
          ...options,
          body: JSON.stringify(bodyData),
        };
      } catch (error) {
        logger.error("Failed to parse request body:", { error });
      }
    }

    const response = await fetch(url, modifiedOptions);
    const reasoningProcessor = new ReasoningProcessor(enableReason);
    return interceptSSEResponse(response, reasoningProcessor);
  };
}
