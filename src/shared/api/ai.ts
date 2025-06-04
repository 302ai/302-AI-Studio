import ky from "ky";
import { z } from "zod";

const openAIModelSchema = z.object({
  object: z.literal("list"),
  data: z.array(
    z.object({
      id: z.string(),
    })
  ),
});
type OpenAIModel = z.infer<typeof openAIModelSchema>;

/**
 * Fetch OpenAI models
 * @param options - The options for the fetch request
 * @returns The OpenAI models
 */
export async function fetchOpenAIModels(options: {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}): Promise<OpenAIModel> {
  const { apiKey, baseUrl, timeout } = options;
  const response = await ky
    .get(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout,
    })
    .json<OpenAIModel>();

  return response;
}
