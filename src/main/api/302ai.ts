import { betterFetch } from "@better-fetch/fetch";
import { extractErrorMessage } from "@main/utils/error-utils";
import { z } from "zod";

const ai302UserInfoSchema = z.object({
  data: z.object({
    uid: z.number(),
    user_name: z.string(),
    email: z.string(),
  }),
});

type Ai302UserInfo = z.infer<typeof ai302UserInfoSchema>;

/**
 * Fetch 302.AI user info
 * @param apiKey - The API key for the 302.AI user
 * @returns The 302.AI user info
 */
export async function fetch302AIUserInfo(
  apiKey: string,
): Promise<Ai302UserInfo> {
  const { data, error } = await betterFetch<Ai302UserInfo>(
    "https://dash-api.302.ai/user/info",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Failed to fetch 302.AI user info: ${errorMessage}`);
  }

  return data;
}

// export async function fetch302AIDefaultToolboxApiKey();
