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

export async function fetch302AIToolList(lang: "cn" | "en" | "jp") {
  const { data, error } = await betterFetch<Ai302ToolsList>(
    "https://dash-api.302.ai/gpt/api/tool/list",
    {
      method: "GET",
      headers: {
        Lang: lang,
      },
    },
  );

  if (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Failed to fetch 302.AI tools list: ${errorMessage}`);
  }

  const drawingRobotData = {
    tool_id: -1,
    tool_name:
      lang === "cn"
        ? "绘画机器人"
        : lang === "jp"
          ? "描画ロボット"
          : "Drawing Robot",
    tool_description:
      lang === "cn"
        ? "支持Midjourney、Flux、SD、Ideogram、Recraft"
        : lang === "jp"
          ? "Midjourney、Flux、SD、Ideogram、Recraftをサポート"
          : "Supports Midjourney, Flux, SD, Ideogram, Recraft",
    enable: true,
    category_name:
      lang === "cn" ? "机器人" : lang === "jp" ? "ロボット" : "Robots",
    category_id: 999,
  };
  const tools = [drawingRobotData, ...data.data.data];

  return tools;
}

const ai302ToolDetailSchema = z.object({
  data: z.object({
    app_box_detail: z.record(
      z.string(),
      z.object({
        api_key: z.string().optional(),
        url: z.string(),
      }),
    ),
  }),
});

type Ai302ToolDetail = z.infer<typeof ai302ToolDetailSchema>;

export async function fetch302AIToolDetail(uidBase64: string) {
  const { data, error } = await betterFetch<Ai302ToolDetail>(
    `https://dash-api.302.ai/gpt/api/v1/code`,
    {
      method: "GET",
      headers: {
        uid: uidBase64,
      },
    },
  );

  if (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Failed to fetch 302.AI tool detail: ${errorMessage}`);
  }

  return data;
}
