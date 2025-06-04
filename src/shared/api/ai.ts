import { betterFetch } from '@better-fetch/fetch';
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

  const { data, error } = await betterFetch<OpenAIModel>(`${baseUrl}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    timeout,
  });

  if (error) {
    throw new Error(`Failed to fetch OpenAI models: ${error}`);
  }

  return data;
}
