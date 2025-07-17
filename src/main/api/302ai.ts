import { betterFetch } from "@better-fetch/fetch";
import { extractErrorMessage } from "@main/utils/error-utils";
import type { Language } from "@shared/triplit/types";
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

const ai302ToolListSchema = z.object({
  data: z.object({
    data: z.array(
      z.object({
        tool_id: z.number(),
        tool_name: z.string(),
        tool_description: z.string(),
        enable: z.boolean(),
        category_name: z.string(),
        category_id: z.number(),
      }),
    ),
  }),
});

type Ai302ToolsList = z.infer<typeof ai302ToolListSchema>;

export async function fetch302AIToolList(lang: Language) {
  const langMap: Record<Language, string> = {
    zh: "cn",
    en: "en",
    ja: "ja",
  };

  const { data, error } = await betterFetch<Ai302ToolsList>(
    "https://dash-api.302.ai/gpt/api/tool/list",
    {
      method: "GET",
      headers: {
        Lang: langMap[lang],
      },
    },
  );

  if (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Failed to fetch 302.AI tools list: ${errorMessage}`);
  }

  return data.data;
}
