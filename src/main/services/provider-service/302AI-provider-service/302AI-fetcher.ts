import type { WebSearchConfig } from "@main/services/db-service/settings-db-service";
import {
  interceptSSEResponse,
  ReasoningProcessor,
} from "@main/utils/reasoning";
import Logger from "electron-log";

export function ai302Fetcher(
  enableReason: boolean = false,
  webSearchConfig: WebSearchConfig = { enabled: false, service: "search1api" },
): typeof fetch {
  return async (url, options) => {
    let modifiedOptions = options;

    if (options?.method === "POST" && options?.body) {
      try {
        const bodyData = JSON.parse(options.body as string);

        bodyData["file-parse"] = true;
        bodyData["parse-service"] = "jina";
        bodyData["ocr_model"] = "gpt-4o-mini";

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
        Logger.error("Failed to parse request body:", error);
      }
    }

    const response = await fetch(url, modifiedOptions);
    const reasoningProcessor = new ReasoningProcessor(enableReason);
    return interceptSSEResponse(response, reasoningProcessor);
  };
}
