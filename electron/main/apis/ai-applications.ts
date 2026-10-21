import { createLogger } from "@shared/logger";
import { type } from "arktype";
import ky from "ky";

const logger = createLogger("apis");

const ai302UserInfoSchema = type({
	data: {
		name: "string",
		email: "string",
		status: "number",
		avatar: "string",
	},
});

type Ai302UserInfo = typeof ai302UserInfoSchema.infer;

/**
 * Fetch 302.AI user info
 * @param apiKey - The API key for the 302.AI user
 * @returns The 302.AI user info
 */
export async function fetch302AIUserInfo(apiKey: string): Promise<Ai302UserInfo> {
	try {
		const response = await ky
			.get("https://dash-api.302ai.cn/user/v2/info", {
				timeout: 180000,
				retry: {
					limit: 3,
					methods: ["get"],
					delay: (attemptCount) => 0.5 * 2 ** (attemptCount - 1) * 1000,
				},
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"HTTP-Referer": "https://studio.302.ai/",
					"X-Title": "302.AI Studio",
				},
			})
			.json();

		const validated = ai302UserInfoSchema(response);
		if (validated instanceof type.errors) {
			logger.error("Failed to validate 302.AI user info:", validated.summary);
			throw new Error("Invalid response format from 302.AI user info API");
		}

		return validated;
	} catch (error) {
		logger.error("Failed to fetch 302.AI user info:", error);
		throw new Error("Failed to fetch 302.AI user info");
	}
}

const ai302ToolListSchema = type({
	data: {
		data: [
			{
				tool_id: "number",
				tool_name: "string",
				tool_description: "string",
				enable: "boolean",
				category_name: "string",
				category_id: "number",
			},
			"[]",
		],
	},
});

type Ai302ToolsList = typeof ai302ToolListSchema.infer;

export async function fetch302AIToolList(
	lang: "cn" | "en" | "jp",
): Promise<Ai302ToolsList["data"]["data"]> {
	try {
		const response = await ky
			.get("https://dash-api.302ai.cn/gpt/api/tool/list", {
				timeout: 180000,
				retry: {
					limit: 3,
					methods: ["get"],
					delay: (attemptCount) => 0.5 * 2 ** (attemptCount - 1) * 1000,
				},
				headers: {
					Lang: lang,
				},
			})
			.json<Ai302ToolsList>();

		const filteredResponse = {
			data: {
				data: response.data.data.filter((tool) => {
					return tool.enable && tool.tool_id !== 9;
				}),
			},
		};

		const validated = ai302ToolListSchema(filteredResponse);
		if (validated instanceof type.errors) {
			logger.error("Failed to validate 302.AI tools list:", validated.summary);
			throw new Error("Invalid response format from 302.AI tools list API");
		}

		const drawingRobotData = {
			tool_id: -1,
			tool_name:
				lang === "cn" ? "绘画机器人" : lang === "jp" ? "描画ロボット" : "Drawing Robot",
			tool_description:
				lang === "cn"
					? "支持Midjourney、Flux、SD、Ideogram、Recraft"
					: lang === "jp"
						? "Midjourney、Flux、SD、Ideogram、Recraftをサポート"
						: "Supports Midjourney, Flux, SD, Ideogram, Recraft",
			enable: true,
			category_name:
				lang === "cn" ? "图片处理" : lang === "jp" ? "画像処理" : "Image Processing",
			category_id: 4,
		};
		const newToolsNotFromApi = [
			{
				tool_id: 9997,
				tool_name:
					lang === "cn"
						? "3D摄影棚"
						: lang === "jp"
							? "3Dカメラスタジオ"
							: "3D Camera Studio",
				tool_description:
					lang === "cn"
						? "对图像进行多角度变换及背景融合处理"
						: lang === "jp"
							? "画像を複数角度で変換し、背景を融合処理"
							: "Transform images from multiple angles and fuse backgrounds",
				enable: true,
				category_name:
					lang === "cn" ? "图片处理" : lang === "jp" ? "画像処理" : "Image Processing",
				category_id: 4,
			},
			{
				tool_id: 9998,
				tool_name: "Nano Banana MD",
				tool_description:
					lang === "cn"
						? "使用Nano-Banana来自动为文章配图"
						: lang === "jp"
							? "Nano-Bananaを使って記事に画像を自動で付ける"
							: "Use Nano-Banana to automatically add images to articles",
				enable: true,
				category_name:
					lang === "cn" ? "工作效率" : lang === "jp" ? "効率化" : "Work Efficiency",
				category_id: 1,
			},
			{
				tool_id: 9999,
				tool_name: "Nano Banana PPT",
				tool_description:
					lang === "cn"
						? "使用Nano-Banana来制作PPT"
						: lang === "jp"
							? "Nano-Bananaを使ってPPTを作成"
							: "Use Nano-Banana to create PPT",
				enable: true,
				category_name:
					lang === "cn" ? "工作效率" : lang === "jp" ? "効率化" : "Work Efficiency",
				category_id: 1,
			},
		];
		const tools = [...newToolsNotFromApi, drawingRobotData, ...validated.data.data];

		return tools;
	} catch (error) {
		logger.error("Failed to fetch 302.AI tools list:", error);
		throw new Error("Failed to fetch 302.AI tools list");
	}
}

const ai302ToolDetailSchema = type({
	data: {
		app_box_detail: {
			"[string]": {
				"api_key?": "string",
				url: "string",
			},
		},
	},
});

type Ai302ToolDetail = typeof ai302ToolDetailSchema.infer;

export async function fetch302AIToolDetail(apiKey: string): Promise<Ai302ToolDetail> {
	try {
		const response = await ky
			.get("https://dash-api.302ai.cn/gpt/api/v1/code", {
				searchParams: {
					apikey: apiKey,
				},
			})
			.json();

		const validated = ai302ToolDetailSchema(response);
		if (validated instanceof type.errors) {
			logger.error(
				"Failed to validate 302.AI tool detail:",
				validated.summary,
				JSON.stringify(response),
			);
			throw new Error("Invalid response format from 302.AI tool detail API");
		}

		return validated;
	} catch (error) {
		logger.error("Failed to fetch 302.AI tool detail:", error);
		throw new Error("Failed to fetch 302.AI tool detail");
	}
}
