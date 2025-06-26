import {
  interceptSSEResponse,
  ReasoningProcessor,
} from "@main/utils/reasoning";
import Logger from "electron-log";

export function ai302Fetcher(): typeof fetch {
  return async (url, options) => {
    let modifiedOptions = options;

    if (options?.method === "POST" && options?.body) {
      try {
        const bodyData = JSON.parse(options.body as string);

        bodyData["file-parse"] = true;
        bodyData["parse-service"] = "jina";

        Logger.info("Added file-parse parameter to request body");

        modifiedOptions = {
          ...options,
          body: JSON.stringify(bodyData),
        };
      } catch (error) {
        Logger.error("Failed to parse request body:", error);
      }
    }

    const response = await fetch(url, modifiedOptions);
    const reasoningProcessor = new ReasoningProcessor();
    return interceptSSEResponse(response, reasoningProcessor);
  };
}
