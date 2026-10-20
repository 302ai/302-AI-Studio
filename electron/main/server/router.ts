import type { SearchProvider } from "$lib/stores/preferences-settings.state.svelte";
import { createAI302 } from "@302ai/ai-sdk";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { serve } from "@hono/node-server";
import { createLogger } from "@shared/logger";
import type { CodeAgentType, CodingAgentClass } from "@shared/storage/code-agent";
import type { ModelProvider } from "@shared/storage/provider";
import type { ChatMessage, McpServer, Skill, ThinkingBudgetType } from "@shared/types";
import { parseGeneratedTitleContent } from "@shared/utils/title-generation";
import {
	ToolLoopAgent as Agent,
	convertToModelMessages,
	createUIMessageStreamResponse,
	extractReasoningMiddleware,
	generateText,
	smoothStream,
	stepCountIs,
	wrapLanguageModel,
	type LanguageModel,
	type ModelMessage,
	type UIMessage,
} from "ai";
import dedent from "dedent";
import getPort from "get-port";
import { Hono, type Context } from "hono";
import { codeAgentService, ssoService } from "../services";
import { chatParametersService } from "../services/chat-parameters-service";
import { mcpService } from "../services/mcp-service";
import { storageService } from "../services/storage-service";
import { codeAgentGlobalConfigsStorage } from "../services/storage-service/code-agent/code-agent-storage";
import { providerStorage } from "../services/storage-service/provider-storage";
import { createProxyFetch } from "../utils/proxy-helper";
import { createCitationsFetch } from "./citations-processor";
import { createClaudeCodeFetch } from "./claude-code-processor";
import { THINKING_BUDGET_MAP } from "./constant";
import {
	appendPromptToLastUserMessage,
	appendPromptToSystemMessage,
	applyContextCompression,
	convertAiSdkMessagesToOpenAiMessages,
	createUIMessageStreamFromGenerator,
	isStreamingSupported,
	sendStreamError,
	uploadAttachmentsFromMessages,
} from "./utils";

const logger = createLogger("server");

export type RouterRequestBody = {
	baseUrl?: string;
	model?: string;
	apiKey?: string;
	temperature?: number;
	topP?: number;
	maxTokens?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	isThinkingActive?: boolean;
	isOnlineSearchActive?: boolean;
	isOCRActive?: boolean;
	isMCPActive?: boolean;
	mcpServerIds?: string[];
	autoParseUrl?: boolean;
	searchProvider?: SearchProvider;
	speedOptions?: {
		enabled: boolean;
		speed: "slow" | "normal" | "fast";
	};
	messages: UIMessage[];
	language?: string;
	threadId: string;
	sessionId?: string;
	systemPrompt?: string;
	mcpServers?: string[];
	sandboxName?: string;
	autoDeploy?: boolean;
	skills?: Skill[];
	isCreateSkillMode?: boolean;
	inPlanMode?: boolean;
	inTaskOrchestrationMode?: boolean;
	workspacePath?: string;
	thinkingBudget?: ThinkingBudgetType;
	reasoningEffort?: ThinkingBudgetType;
	vibeMode?: CodeAgentType;
	agentType?: number;
	contextSummary?: string;
	compressedMessageCount?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDefinedParams(options: any, params: any) {
	if (params.temperature !== undefined && params.temperature !== null) {
		options.temperature = params.temperature;
	}
	if (params.topP !== undefined && params.topP !== null) {
		options.topP = params.topP;
	}
	if (params.maxTokens !== undefined && params.maxTokens !== null) {
		options.maxOutputTokens = params.maxTokens;
	}
	if (params.frequencyPenalty !== undefined && params.frequencyPenalty !== null) {
		options.frequencyPenalty = params.frequencyPenalty;
	}
	if (params.presencePenalty !== undefined && params.presencePenalty !== null) {
		options.presencePenalty = params.presencePenalty;
	}
}

// 续写拼接去重：裁掉模型续写时重复的上文末尾（最长后缀/前缀重叠，200 字符内）
function dedupeOverlap(prev: string, next: string): string {
	const max = Math.min(prev.length, next.length, 200);
	for (let len = max; len > 0; len--) {
		if (prev.endsWith(next.slice(0, len))) {
			return next.slice(len);
		}
	}
	return next;
}

// max_tokens 截断时自动续写拼接；maxRounds 轮后仍截断则返回 truncated: true
async function generateTextWithContinuation(
	options: {
		model: LanguageModel;
		prompt?: string;
		messages?: ModelMessage[];
		maxOutputTokens?: number;
	},
	maxRounds = 3,
): Promise<{ text: string; truncated: boolean }> {
	const { prompt, messages, ...rest } = options;
	let history: ModelMessage[] = messages ?? [{ role: "user", content: prompt ?? "" }];
	let fullText = "";
	for (let round = 0; ; round++) {
		const result = await generateText({ ...rest, messages: history });
		if (result.finishReason !== "length" || round === maxRounds) {
			return { text: fullText + result.text, truncated: result.finishReason === "length" };
		}
		fullText += dedupeOverlap(fullText, result.text);
		if (!result.text) {
			// 本轮无有效输出（如 thinking 块吃掉全部额度），继续轮询无意义
			return { text: fullText, truncated: true };
		}
		history = [
			...history,
			{ role: "assistant", content: fullText },
			{
				role: "user",
				content:
					"Your previous output was cut off by the length limit. Continue exactly where you stopped. Do not repeat any previously generated text.",
			},
		];
	}
}

// Generate suggestion prompt based on user's language preference and count
function getSuggestionsPrompt(language?: string, count: number = 3): string {
	if (language === "zh") {
		return `基于我们的对话，建议${count}个我可能会问的后续问题。只返回一个包含${count}个字符串的JSON数组，例如：["问题1？", "问题2？", "问题3？"]。不要包含其他文本。`;
	}
	// Default to English
	return `Based on our conversation, suggest ${count} follow-up questions I might ask next. Return ONLY a JSON array of ${count} strings, like: ["Question 1?", "Question 2?", "Question 3?"]. No other text.`;
}

// Add feedback information from metadata to messages
function enhanceMessagesWithFeedback(messages: UIMessage[]) {
	return messages.map((msg) => {
		// Only add feedback for assistant messages that have feedback
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const metadata = msg.metadata as any;
		if (msg.role === "assistant" && metadata?.feedback) {
			const feedbackText =
				metadata.feedback === "like"
					? "[User feedback: 👍 Liked this response]"
					: "[User feedback: 👎 Disliked this response]";

			// Add feedback as a system-like annotation
			return {
				...msg,
				parts: [
					...msg.parts,
					{
						type: "text" as const,
						text: `\n\n${feedbackText}`,
					},
				],
			};
		}
		return msg;
	});
}

function smartChunking(buffer: string): string {
	// whitespace
	const whitespaceMatch = buffer.match(/^\s+/);
	if (whitespaceMatch) {
		return whitespaceMatch[0];
	}

	// Chinese
	const chineseMatch = buffer.match(/^[\u4e00-\u9fff]/);
	if (chineseMatch) {
		return chineseMatch[0];
	}

	// English
	const wordMatch = buffer.match(/^[a-zA-Z]+\d*/);
	if (wordMatch) {
		return wordMatch[0];
	}

	// Numbers
	const numberMatch = buffer.match(/^\d+/);
	if (numberMatch) {
		return numberMatch[0];
	}

	// Punctuation
	return buffer[0];
}

function getDelayForSpeed(speed: "slow" | "normal" | "fast"): number {
	switch (speed) {
		case "slow":
			return 150;
		case "normal":
			return 50;
		case "fast":
			return 20;
		default:
			return 50;
	}
}

const app = new Hono();

app.post("/chat/302ai", async (c) => {
	const {
		baseUrl,
		model = "gpt-4o",
		apiKey,
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
		isThinkingActive,
		isOnlineSearchActive,
		isOCRActive,
		isMCPActive,
		mcpServerIds = [],
		autoParseUrl,
		searchProvider = "search1api",
		messages,
		speedOptions,
		language: _language,
		systemPrompt,
		threadId,
		contextSummary,
		compressedMessageCount,
		reasoningEffort,
	} = await c.req.json<{
		baseUrl?: string;
		model?: string;
		apiKey?: string;
		temperature?: number;
		topP?: number;
		maxTokens?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;

		isThinkingActive?: boolean;
		isOnlineSearchActive?: boolean;
		isOCRActive?: boolean;
		isMCPActive?: boolean;
		mcpServerIds?: string[];
		autoParseUrl?: boolean;
		searchProvider?: SearchProvider;

		speedOptions?: {
			enabled: boolean;
			speed: "slow" | "normal" | "fast";
		};

		messages: UIMessage[];
		language?: string;
		systemPrompt?: string;
		threadId: string;
		contextSummary?: string;
		compressedMessageCount?: number;
		reasoningEffort?: ThinkingBudgetType;
	}>();
	logger.info(
		"Router request params:",
		baseUrl,
		model,
		apiKey,
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
		reasoningEffort,
		isThinkingActive,
		isOnlineSearchActive,
		messages,
		speedOptions,
		systemPrompt,
		threadId,
	);

	const provider302Options: Record<string, boolean | string> = {};

	if (autoParseUrl) {
		provider302Options["file-parse"] = true;
	}

	if (isThinkingActive) {
		provider302Options["fusion"] = true;
	}

	if (isOnlineSearchActive) {
		provider302Options["web-search"] = true;
		provider302Options["search-service"] = searchProvider;
	}

	if (isOCRActive) {
		provider302Options["ocr_model"] = "gpt-4o-mini";
	}

	if (reasoningEffort && reasoningEffort !== "off") {
		provider302Options["reasoning_effort"] = reasoningEffort;
	}

	// Create proxy-enabled fetch for AI SDK
	const proxyFetch = await createProxyFetch();

	const ai302 = createAI302({
		baseURL: baseUrl || "https://api.openai.com/v1",
		apiKey: apiKey || "[REDACTED:sk-secret]",
		fetch: createCitationsFetch(provider302Options, proxyFetch),
	});

	// Only enable thinking for DeepSeek models
	const isDeepSeekModel = model.toLowerCase().includes("deepseek");
	const modelOptions = {
		...(isDeepSeekModel ? { thinking: { type: "enabled" as const } } : {}),
	};

	// 302ai 的 chat/completions 端点对 claude 系模型返回 Anthropic 原生格式流，OpenAI 兼容解析器无法解析，需走原生 /v1/messages
	const isClaudeModel = /claude/i.test(model);
	const wrapModel = wrapLanguageModel({
		model: isClaudeModel
			? createAnthropic({
					baseURL: baseUrl || "https://api.302ai.cn/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				}).chat(model)
			: ai302.chatModel(model, modelOptions),
		middleware: [
			extractReasoningMiddleware({ tagName: "think" }),
			extractReasoningMiddleware({ tagName: "thinking" }),
		],
		providerId: "302.AI",
	});

	// Get MCP tools if MCP is active
	let mcpTools = undefined;
	if (isMCPActive && mcpServerIds.length > 0) {
		try {
			const allServers = await storageService.getItemInternal("app-mcp-servers");
			if (allServers) {
				mcpTools = await mcpService.getToolsFromServerIds(
					mcpServerIds,
					allServers as McpServer[],
				);
				logger.debug(`Loaded ${mcpTools.length} tools from MCP servers`);
			}
		} catch (error) {
			logger.error("Failed to load MCP tools:", error);
		}
	}
	let resolvedMessages = messages;
	logger.info(
		"Resolving user prompt template variables for thread - before:",
		JSON.stringify(resolvedMessages, null, 2),
	);

	if (await chatParametersService.validateUserPromptTemplateVariables(threadId)) {
		// Find the last user message
		const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
		if (lastUserMessage) {
			const prevResolvedMessages =
				await chatParametersService.resolvePrevUserMsgsByUserPromptTemp(
					threadId,
					model,
					lastUserMessage.id, // Exclude last user message to avoid duplicate processing
				);

			const resolvedLastMessage =
				await chatParametersService.resolveLastUserTextByUserPromptTemp(
					threadId,
					lastUserMessage as ChatMessage,
					model,
				);
			resolvedMessages = [...prevResolvedMessages, resolvedLastMessage];
		}
	}

	logger.info(
		"Resolving user prompt template variables for thread - after:",
		JSON.stringify(resolvedMessages, null, 2),
	);

	// Apply context compression after template resolution
	let messagesToSend = resolvedMessages;
	let effectiveSystemPrompt = systemPrompt;
	if (contextSummary && compressedMessageCount && compressedMessageCount > 0) {
		const compressed = applyContextCompression(
			resolvedMessages,
			systemPrompt,
			contextSummary,
			compressedMessageCount,
		);
		messagesToSend = compressed.messages;
		effectiveSystemPrompt = compressed.systemPrompt;
	}

	const convertedMessages = (
		await convertToModelMessages(enhanceMessagesWithFeedback(messagesToSend))
	).filter((m) => !(Array.isArray(m.content) && m.content.length === 0)); // 上游会拒绝 content 为 null 的空消息（失败回合留下的空 assistant 消息）

	const baseConfig = {
		model: wrapModel,
		messages: convertedMessages,
		providerOptions: {
			"302": provider302Options,
		},
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
		// anthropic 端点必须带 max_tokens；给足上限避免长回复被截断（按实际用量计费）
		...(isClaudeModel && maxTokens == null && { maxOutputTokens: 64000 }),
	};

	addDefinedParams(baseConfig, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	// Check if model supports streaming (image generation models don't)
	if (!isStreamingSupported(model)) {
		logger.debug(`[302ai] Model ${model} does not support streaming, using generateText`);

		const streamTextOptions = {
			...baseConfig,
			...(effectiveSystemPrompt && { system: effectiveSystemPrompt }),
		};

		// Use createUIMessageStreamFromGenerator for immediate start event and async content generation
		const stream = createUIMessageStreamFromGenerator(
			async () => {
				const result = await generateText(streamTextOptions);
				return result.text || "";
			},
			model,
			"ai302",
		);

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"x-vercel-ai-ui-message-stream": "v1",
			},
		});
	}

	// Stream the main text response using Agent without waiting for suggestions
	// Note: Agent uses 'instructions' for system prompt, not 'system'
	const agentConfig = {
		...baseConfig,
		...(effectiveSystemPrompt && { instructions: effectiveSystemPrompt }),
		stopWhen: stepCountIs(20),
	};

	const result = await new Agent(agentConfig).stream({
		messages: convertedMessages,
		...(speedOptions?.enabled && {
			experimental_transform: smoothStream({
				chunking: smartChunking,
				delayInMs: getDelayForSpeed(speedOptions.speed),
			}),
		}),
	});

	const stream = result.toUIMessageStream({
		messageMetadata: () => ({
			model,
			provider: "ai302",
			createdAt: new Date().toISOString(),
		}),
	});

	logger.debug("[302ai] Stream created successfully, returning response");

	// 	const debugStream = stream.pipeThrough(
	// 	new TransformStream({
	// 		transform(chunk, controller) {
	// 			logger.debug("Stream chunk:", chunk);
	// 			controller.enqueue(chunk);
	// 		},
	// 	}),
	// );

	// return createUIMessageStreamResponse({ stream: debugStream });

	// AI SDK's createUIMessageStreamResponse automatically handles:
	// - controller.close() in all paths (success, error, abort)
	// - [DONE] marker emission after finish event
	// - Error propagation and cleanup
	// No manual lifecycle management needed for this endpoint.
	return createUIMessageStreamResponse({ stream });
});

app.post("/chat/openai", async (c) => {
	const {
		baseUrl,
		model = "gpt-4o",
		apiKey,
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
		isMCPActive,
		mcpServerIds = [],
		messages,
		speedOptions,
		language: _language,
		systemPrompt,
		threadId,
		contextSummary,
		compressedMessageCount,
	} = await c.req.json<{
		baseUrl?: string;
		model?: string;
		apiKey?: string;
		temperature?: number;
		topP?: number;
		maxTokens?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		isMCPActive?: boolean;
		mcpServerIds?: string[];
		speedOptions?: {
			enabled: boolean;
			speed: "slow" | "normal" | "fast";
		};
		messages: UIMessage[];
		language?: string;
		systemPrompt?: string;
		threadId: string;
		contextSummary?: string;
		compressedMessageCount?: number;
	}>();

	const openai = createOpenAI({
		baseURL: baseUrl || "https://api.openai.com/v1",
		apiKey: apiKey || "[REDACTED:sk-secret]",
		fetch: await createProxyFetch(),
	});

	const wrapModel = wrapLanguageModel({
		model: openai.chat(model),
		middleware: [
			extractReasoningMiddleware({ tagName: "think" }),
			extractReasoningMiddleware({ tagName: "thinking" }),
		],
	});

	// Get MCP tools if MCP is active
	let mcpTools = undefined;
	if (isMCPActive && mcpServerIds.length > 0) {
		try {
			const allServers = await storageService.getItemInternal("app-mcp-servers");
			if (allServers) {
				mcpTools = await mcpService.getToolsFromServerIds(
					mcpServerIds,
					allServers as McpServer[],
				);
				logger.debug(`Loaded ${mcpTools.length} tools from MCP servers`);
			}
		} catch (error) {
			logger.error("Failed to load MCP tools:", error);
		}
	}

	// Resolve user prompt template variables
	let resolvedMessages = messages;
	if (await chatParametersService.validateUserPromptTemplateVariables(threadId)) {
		// Find the last user message
		const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
		if (lastUserMessage) {
			// Resolve previous user messages (using metadata)
			const prevResolvedMessages =
				await chatParametersService.resolvePrevUserMsgsByUserPromptTemp(
					threadId,
					model,
					lastUserMessage.id, // Exclude last user message to avoid duplicate processing
				);
			// Resolve last user message (using storage)
			const resolvedLastMessage =
				await chatParametersService.resolveLastUserTextByUserPromptTemp(
					threadId,
					lastUserMessage as ChatMessage,
					model,
				);
			resolvedMessages = [...prevResolvedMessages, resolvedLastMessage];
		}
	}

	// Apply context compression after template resolution
	let messagesToSend = resolvedMessages;
	let effectiveSystemPrompt = systemPrompt;
	if (contextSummary && compressedMessageCount && compressedMessageCount > 0) {
		const compressed = applyContextCompression(
			resolvedMessages,
			systemPrompt,
			contextSummary,
			compressedMessageCount,
		);
		messagesToSend = compressed.messages;
		effectiveSystemPrompt = compressed.systemPrompt;
	}

	const convertedMessages = (
		await convertToModelMessages(enhanceMessagesWithFeedback(messagesToSend))
	).filter((m) => !(Array.isArray(m.content) && m.content.length === 0)); // 上游会拒绝 content 为 null 的空消息（失败回合留下的空 assistant 消息）

	const streamTextOptions = {
		model: wrapModel,
		messages: convertedMessages,
		...(effectiveSystemPrompt && { system: effectiveSystemPrompt }),
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
	};

	addDefinedParams(streamTextOptions, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	// Check if model supports streaming (image generation models don't)
	if (!isStreamingSupported(model)) {
		logger.debug(`[openai] Model ${model} does not support streaming, using generateText`);

		// Use createUIMessageStreamFromGenerator for immediate start event and async content generation
		const stream = createUIMessageStreamFromGenerator(
			async () => {
				const result = await generateText(streamTextOptions);
				return result.text || "";
			},
			model,
			"openai",
		);

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"x-vercel-ai-ui-message-stream": "v1",
			},
		});
	}

	// Stream the main text response using Agent
	// Note: Agent uses 'instructions' for system prompt, not 'system'
	const agentConfig = {
		model: wrapModel,
		...(effectiveSystemPrompt && { instructions: effectiveSystemPrompt }),
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
		stopWhen: stepCountIs(20),
	};
	addDefinedParams(agentConfig, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	const result = await new Agent(agentConfig).stream({
		messages: convertedMessages,
		...(speedOptions?.enabled && {
			experimental_transform: smoothStream({
				chunking: smartChunking,
				delayInMs: getDelayForSpeed(speedOptions.speed),
			}),
		}),
	});

	const stream = result.toUIMessageStream({
		messageMetadata: () => ({
			model,
			provider: "openai",
			createdAt: new Date().toISOString(),
		}),
	});

	logger.debug("[openai] Stream created successfully, returning response");

	// AI SDK's createUIMessageStreamResponse automatically handles:
	// - controller.close() in all paths (success, error, abort)
	// - [DONE] marker emission after finish event
	// - Error propagation and cleanup
	// No manual lifecycle management needed for this endpoint.
	return createUIMessageStreamResponse({ stream });
});

app.post("/chat/anthropic", async (c) => {
	const {
		baseUrl,
		model = "claude-sonnet-4-20250514",
		apiKey,
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
		isMCPActive,
		mcpServerIds = [],
		messages,
		speedOptions,
		language: _language,
		systemPrompt,
		threadId,
		contextSummary,
		compressedMessageCount,
	} = await c.req.json<{
		baseUrl?: string;
		model?: string;
		apiKey?: string;
		temperature?: number;
		topP?: number;
		maxTokens?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		isMCPActive?: boolean;
		mcpServerIds?: string[];
		speedOptions?: {
			enabled: boolean;
			speed: "slow" | "normal" | "fast";
		};
		messages: UIMessage[];
		language?: string;
		systemPrompt?: string;
		threadId: string;
		contextSummary?: string;
		compressedMessageCount?: number;
	}>();

	const anthropic = createAnthropic({
		baseURL: baseUrl || "https://api.anthropic.com/v1",
		apiKey: apiKey || "[REDACTED:sk-secret]",
		fetch: await createProxyFetch(),
	});

	const wrapModel = wrapLanguageModel({
		model: anthropic.chat(model),
		middleware: [
			extractReasoningMiddleware({ tagName: "think" }),
			extractReasoningMiddleware({ tagName: "thinking" }),
		],
	});

	// Get MCP tools if MCP is active
	let mcpTools = undefined;
	if (isMCPActive && mcpServerIds.length > 0) {
		try {
			const allServers = await storageService.getItemInternal("app-mcp-servers");
			if (allServers) {
				mcpTools = await mcpService.getToolsFromServerIds(
					mcpServerIds,
					allServers as McpServer[],
				);
				logger.debug(`Loaded ${mcpTools.length} tools from MCP servers`);
			}
		} catch (error) {
			logger.error("Failed to load MCP tools:", error);
		}
	}

	// Resolve user prompt template variables
	let resolvedMessages = messages;
	if (await chatParametersService.validateUserPromptTemplateVariables(threadId)) {
		// Find the last user message
		const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
		if (lastUserMessage) {
			// Resolve previous user messages (using metadata)
			const prevResolvedMessages =
				await chatParametersService.resolvePrevUserMsgsByUserPromptTemp(
					threadId,
					model,
					lastUserMessage.id, // Exclude last user message to avoid duplicate processing
				);
			// Resolve last user message (using storage)
			const resolvedLastMessage =
				await chatParametersService.resolveLastUserTextByUserPromptTemp(
					threadId,
					lastUserMessage as ChatMessage,
					model,
				);
			resolvedMessages = [...prevResolvedMessages, resolvedLastMessage];
		}
	}

	// Apply context compression after template resolution
	let messagesToSend = resolvedMessages;
	let effectiveSystemPrompt = systemPrompt;
	if (contextSummary && compressedMessageCount && compressedMessageCount > 0) {
		const compressed = applyContextCompression(
			resolvedMessages,
			systemPrompt,
			contextSummary,
			compressedMessageCount,
		);
		messagesToSend = compressed.messages;
		effectiveSystemPrompt = compressed.systemPrompt;
	}

	const convertedMessages = (
		await convertToModelMessages(enhanceMessagesWithFeedback(messagesToSend))
	).filter((m) => !(Array.isArray(m.content) && m.content.length === 0)); // 上游会拒绝 content 为 null 的空消息（失败回合留下的空 assistant 消息）

	const streamTextOptions = {
		model: wrapModel,
		messages: convertedMessages,
		...(effectiveSystemPrompt && { system: effectiveSystemPrompt }),
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
	};

	addDefinedParams(streamTextOptions, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	// Check if model supports streaming (image generation models don't)
	if (!isStreamingSupported(model)) {
		logger.debug(`[anthropic] Model ${model} does not support streaming, using generateText`);

		// Use createUIMessageStreamFromGenerator for immediate start event and async content generation
		const stream = createUIMessageStreamFromGenerator(
			async () => {
				const result = await generateText(streamTextOptions);
				return result.text || "";
			},
			model,
			"anthropic",
		);

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"x-vercel-ai-ui-message-stream": "v1",
			},
		});
	}

	// Stream the main text response using Agent
	// Note: Agent uses 'instructions' for system prompt, not 'system'
	const agentConfig = {
		model: wrapModel,
		...(effectiveSystemPrompt && { instructions: effectiveSystemPrompt }),
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
		stopWhen: stepCountIs(20),
	};
	addDefinedParams(agentConfig, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	const result = await new Agent(agentConfig).stream({
		messages: convertedMessages,
		...(speedOptions?.enabled && {
			experimental_transform: smoothStream({
				chunking: smartChunking,
				delayInMs: getDelayForSpeed(speedOptions.speed),
			}),
		}),
	});

	const stream = result.toUIMessageStream({
		messageMetadata: () => ({
			model,
			provider: "anthropic",
			createdAt: new Date().toISOString(),
		}),
	});

	logger.debug("[anthropic] Stream created successfully, returning response");

	// AI SDK's createUIMessageStreamResponse automatically handles:
	// - controller.close() in all paths (success, error, abort)
	// - [DONE] marker emission after finish event
	// - Error propagation and cleanup
	// No manual lifecycle management needed for this endpoint.
	return createUIMessageStreamResponse({ stream });
});

app.post("/chat/gemini", async (c) => {
	const {
		baseUrl,
		model = "gemini-2.0-flash-exp",
		apiKey,
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
		isMCPActive,
		mcpServerIds = [],
		messages,
		speedOptions,
		language: _language,
		systemPrompt,
		threadId,
		contextSummary,
		compressedMessageCount,
	} = await c.req.json<{
		baseUrl?: string;
		model?: string;
		apiKey?: string;
		temperature?: number;
		topP?: number;
		maxTokens?: number;
		frequencyPenalty?: number;
		presencePenalty?: number;
		isMCPActive?: boolean;
		mcpServerIds?: string[];
		speedOptions?: {
			enabled: boolean;
			speed: "slow" | "normal" | "fast";
		};
		messages: UIMessage[];
		language?: string;
		systemPrompt?: string;
		threadId: string;
		contextSummary?: string;
		compressedMessageCount?: number;
	}>();

	const google = createGoogleGenerativeAI({
		baseURL: baseUrl || "https://generativelanguage.googleapis.com/v1beta",
		apiKey: apiKey || "[REDACTED:sk-secret]",
		fetch: await createProxyFetch(),
	});

	const wrapModel = wrapLanguageModel({
		model: google.chat(model),
		middleware: [
			extractReasoningMiddleware({ tagName: "think" }),
			extractReasoningMiddleware({ tagName: "thinking" }),
		],
	});

	// Get MCP tools if MCP is active
	let mcpTools = undefined;
	if (isMCPActive && mcpServerIds.length > 0) {
		try {
			const allServers = await storageService.getItemInternal("app-mcp-servers");
			if (allServers) {
				mcpTools = await mcpService.getToolsFromServerIds(
					mcpServerIds,
					allServers as McpServer[],
				);
				logger.debug(`Loaded ${mcpTools.length} tools from MCP servers`);
			}
		} catch (error) {
			logger.error("Failed to load MCP tools:", error);
		}
	}

	let resolvedMessages = messages;
	if (await chatParametersService.validateUserPromptTemplateVariables(threadId)) {
		// Find the last user message
		const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
		if (lastUserMessage) {
			// Resolve previous user messages (using metadata)
			const prevResolvedMessages =
				await chatParametersService.resolvePrevUserMsgsByUserPromptTemp(
					threadId,
					model,
					lastUserMessage.id, // Exclude last user message to avoid duplicate processing
				);
			// Resolve last user message (using storage)
			const resolvedLastMessage =
				await chatParametersService.resolveLastUserTextByUserPromptTemp(
					threadId,
					lastUserMessage as ChatMessage,
					model,
				);
			resolvedMessages = [...prevResolvedMessages, resolvedLastMessage];
		}
	}

	// Apply context compression after template resolution
	let messagesToSend = resolvedMessages;
	let effectiveSystemPrompt = systemPrompt;
	if (contextSummary && compressedMessageCount && compressedMessageCount > 0) {
		const compressed = applyContextCompression(
			resolvedMessages,
			systemPrompt,
			contextSummary,
			compressedMessageCount,
		);
		messagesToSend = compressed.messages;
		effectiveSystemPrompt = compressed.systemPrompt;
	}

	const convertedMessages = (
		await convertToModelMessages(enhanceMessagesWithFeedback(messagesToSend))
	).filter((m) => !(Array.isArray(m.content) && m.content.length === 0)); // 上游会拒绝 content 为 null 的空消息（失败回合留下的空 assistant 消息）

	const streamTextOptions = {
		model: wrapModel,
		messages: convertedMessages,
		...(effectiveSystemPrompt && { system: effectiveSystemPrompt }),
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
	};

	addDefinedParams(streamTextOptions, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	// Check if model supports streaming (image generation models don't)
	if (!isStreamingSupported(model)) {
		logger.debug(`[gemini] Model ${model} does not support streaming, using generateText`);

		// Use createUIMessageStreamFromGenerator for immediate start event and async content generation
		const stream = createUIMessageStreamFromGenerator(
			async () => {
				const result = await generateText(streamTextOptions);
				return result.text || "";
			},
			model,
			"gemini",
		);

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"x-vercel-ai-ui-message-stream": "v1",
			},
		});
	}

	// Stream the main text response using Agent
	// Note: Agent uses 'instructions' for system prompt, not 'system'
	const agentConfig = {
		model: wrapModel,
		...(effectiveSystemPrompt && { instructions: effectiveSystemPrompt }),
		...(mcpTools && Object.keys(mcpTools).length > 0 && { tools: mcpTools }),
		stopWhen: stepCountIs(20),
	};
	addDefinedParams(agentConfig, {
		temperature,
		topP,
		maxTokens,
		frequencyPenalty,
		presencePenalty,
	});

	const result = await new Agent(agentConfig).stream({
		messages: convertedMessages,
		...(speedOptions?.enabled && {
			experimental_transform: smoothStream({
				chunking: smartChunking,
				delayInMs: getDelayForSpeed(speedOptions.speed),
			}),
		}),
	});

	const stream = result.toUIMessageStream({
		messageMetadata: () => ({
			model,
			provider: "gemini",
			createdAt: new Date().toISOString(),
		}),
	});

	logger.debug("[gemini] Stream created successfully, returning response");

	// AI SDK's createUIMessageStreamResponse automatically handles:
	// - controller.close() in all paths (success, error, abort)
	// - [DONE] marker emission after finish event
	// - Error propagation and cleanup
	// No manual lifecycle management needed for this endpoint.
	return createUIMessageStreamResponse({ stream });
});

app.post("/generate-title", async (c) => {
	const { messages, model, apiKey, baseUrl, providerType, previousSummary, isFirstGeneration } =
		await c.req.json<{
			messages: UIMessage[];
			model: string;
			apiKey?: string;
			baseUrl?: string;
			providerType: ModelProvider["apiType"];
			previousSummary?: string;
			isFirstGeneration?: boolean;
		}>();

	const conversationText = messages
		.map((msg) => {
			const role = msg.role === "user" ? "User" : "Assistant";
			const textParts = msg.parts.filter((part) => part.type === "text");
			const text = textParts.map((part) => ("text" in part ? part.text : "")).join(" ");
			return `${role}: ${text}`;
		})
		.join("\n");

	let languageModel;
	const proxyFetch = await createProxyFetch();
	switch (providerType) {
		case "302ai": {
			if (/claude/i.test(model)) {
				// 302ai 的 chat/completions 对 claude 系模型返回 Anthropic 原生格式，需走原生 /v1/messages
				const anthropic = createAnthropic({
					baseURL: baseUrl || "https://api.302ai.cn/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = anthropic.chat(model);
			} else {
				const openai = createOpenAICompatible({
					name: "302.AI",
					baseURL: baseUrl || "https://api.openai.com/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = openai.chatModel(model);
			}
			break;
		}
		case "openai": {
			const openai = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = openai.chat(model);
			break;
		}
		case "anthropic": {
			const anthropic = createAnthropic({
				baseURL: baseUrl || "https://api.anthropic.com/v1",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = anthropic.chat(model);
			break;
		}
		case "gemini": {
			const google = createGoogleGenerativeAI({
				baseURL: baseUrl || "https://generativelanguage.googleapis.com/v1beta",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = google.chat(model);
			break;
		}
		default:
			return c.json({ error: "Invalid provider type" }, 400);
	}

	try {
		let prompt: string;

		if (isFirstGeneration || !previousSummary) {
			// First generation: only use user's first message
			prompt = `Based on the following conversation, generate a concise title and summary(Please limit your response to a very short length: approximately 10-20 words if in English, or 10-20 characters if in Chinese., no punctuation):

${conversationText}

Requirements:
- Accurately summarize the main topic
- Be concise and clear
- Do not use punctuation

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"title": "your title here", "summary": "your summary here"}`;
		} else {
			// Incremental generation: use previous summary + latest messages
			prompt = `Based on the previous summary and latest conversation, update the title and summary(Please limit your response to a very short length: approximately 10-20 words if in English, or 10-20 characters if in Chinese., no punctuation):

Previous Summary: ${previousSummary}

Latest Conversation:
${conversationText}

Requirements:
- Use the SAME LANGUAGE as the main language in the conversation (if the conversation is primarily in Chinese, generate Chinese title and summary; if primarily in English, use English)
- If the conversation contains mixed languages, use the language that appears most frequently or is used by the user
- Accurately summarize the main topic
- Be concise and clear
- Do not use punctuation

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"title": "your title here", "summary": "your summary here"}`;
		}

		const { text } = await generateTextWithContinuation({
			model: languageModel,
			prompt,
			maxOutputTokens: 2048, // 302ai 上游部分模型必须带 max_tokens；opus 系思考 token 也占额度，留足余量
		});

		const { title, summary } = parseGeneratedTitleContent(text, previousSummary || "");

		return c.json({ title, summary });
	} catch (error) {
		logger.error("Title generation error:", error);
		return c.json({ error: "Failed to generate title" }, 500);
	}
});

app.post("/generate-context-summary", async (c) => {
	const {
		messages,
		model,
		apiKey,
		baseUrl,
		providerType,
		previousSummary,
		language: _language,
	} = await c.req.json<{
		messages: UIMessage[];
		model: string;
		apiKey?: string;
		baseUrl?: string;
		providerType: ModelProvider["apiType"];
		previousSummary?: string;
		language?: string;
	}>();

	const conversationText = messages
		.map((msg) => {
			const role = msg.role === "user" ? "User" : "Assistant";
			const textParts = msg.parts.filter((part) => part.type === "text");
			const text = textParts.map((part) => ("text" in part ? part.text : "")).join(" ");
			return `${role}: ${text}`;
		})
		.join("\n");

	let languageModel;
	const proxyFetch = await createProxyFetch();
	switch (providerType) {
		case "302ai": {
			if (/claude/i.test(model)) {
				// 302ai 的 chat/completions 对 claude 系模型返回 Anthropic 原生格式，需走原生 /v1/messages
				const anthropic = createAnthropic({
					baseURL: baseUrl || "https://api.302ai.cn/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = anthropic.chat(model);
			} else {
				const openai = createOpenAICompatible({
					name: "302.AI",
					baseURL: baseUrl || "https://api.302ai.com/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = openai.chatModel(model);
			}
			break;
		}
		case "openai": {
			const openai = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "sk-placeholder",
				fetch: proxyFetch,
			});
			languageModel = openai.chat(model);
			break;
		}
		case "anthropic": {
			const anthropic = createAnthropic({
				baseURL: baseUrl || "https://api.anthropic.com/v1",
				apiKey: apiKey || "sk-placeholder",
				fetch: proxyFetch,
			});
			languageModel = anthropic.chat(model);
			break;
		}
		case "gemini": {
			const google = createGoogleGenerativeAI({
				baseURL: baseUrl || "https://generativelanguage.googleapis.com/v1beta",
				apiKey: apiKey || "sk-placeholder",
				fetch: proxyFetch,
			});
			languageModel = google.chat(model);
			break;
		}
		default:
			return c.json({ error: "Invalid provider type" }, 400);
	}

	try {
		let prompt: string;

		if (!previousSummary) {
			prompt = `Summarize the following conversation into a concise context summary (200-500 characters). Preserve:
- Key topics and decisions made
- Important facts, names, numbers, and dates mentioned
- User preferences and requirements stated
- Any ongoing tasks or action items

Conversation:
${conversationText}

Requirements:
- Use the SAME LANGUAGE as the main language in the conversation
- Keep between 200-500 characters
- Focus on information that would be useful context for continuing the conversation
- Do not include pleasantries or greetings

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"summary": "your summary here"}`;
		} else {
			prompt = `Update the following context summary with new conversation messages. The updated summary should be 200-500 characters and incorporate the new information while preserving important context from the previous summary.

Previous Summary: ${previousSummary}

New Messages:
${conversationText}

Requirements:
- Use the SAME LANGUAGE as the main language in the conversation
- Keep between 200-500 characters
- Preserve key facts, decisions, and context from the previous summary
- Add new important information from the latest messages
- Remove outdated or superseded information
- Focus on information useful for continuing the conversation

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{"summary": "your updated summary here"}`;
		}

		const { text } = await generateTextWithContinuation({
			model: languageModel,
			prompt,
			maxOutputTokens: 2048, // 302ai 上游部分模型必须带 max_tokens；opus 系思考 token 也占额度，留足余量
		});

		// Parse JSON response with fallback handling
		let summary = "";

		try {
			// Try to extract JSON from the response (handle potential markdown code blocks)
			let jsonStr = text.trim();

			// Strip thinking/reasoning blocks from model response (handles both closed and unclosed tags)
			// Pattern 1: Complete thinking blocks with closing tags
			jsonStr = jsonStr.replace(/<(think|thinking|reason|reasoning)>[\s\S]*?<\/\1>/gi, "");
			// Pattern 2: Unclosed thinking blocks (tag at start without closing)
			jsonStr = jsonStr.replace(/^<(think|thinking|reason|reasoning)>[\s\S]*?(?=\{)/i, "");
			// Pattern 3: Any remaining opening thinking tags that might be at the start
			jsonStr = jsonStr.replace(/^<(think|thinking|reason|reasoning)>[\s\S]*/i, "");

			jsonStr = jsonStr.trim();

			// Remove markdown code blocks if present
			if (jsonStr.startsWith("```")) {
				jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
			}
			const parsed = JSON.parse(jsonStr);
			summary = parsed.summary || "";
		} catch {
			// Fallback: if JSON parsing fails, use the raw text as summary
			logger.warn("Failed to parse context summary JSON response, using fallback");
			// Strip any thinking tags from fallback text too
			let fallbackText = text.trim();
			fallbackText = fallbackText.replace(
				/<(think|thinking|reason|reasoning)>[\s\S]*?<\/\1>/gi,
				"",
			);
			fallbackText = fallbackText.replace(/<(think|thinking|reason|reasoning)>[\s\S]*/gi, "");
			fallbackText = fallbackText.trim();
			summary = fallbackText.slice(0, 500);
		}

		return c.json({ summary });
	} catch (error) {
		logger.error("Context summary generation error:", error);
		return c.json({ error: "Failed to generate context summary" }, 500);
	}
});

app.post("/generate-suggestions", async (c) => {
	const {
		messages,
		model,
		apiKey,
		baseUrl,
		providerType,
		language,
		count = 3,
	} = await c.req.json<{
		messages: UIMessage[];
		model: string;
		apiKey?: string;
		baseUrl?: string;
		providerType: ModelProvider["apiType"];
		language?: string;
		count?: number;
	}>();

	let languageModel;
	const proxyFetch = await createProxyFetch();
	switch (providerType) {
		case "302ai": {
			if (/claude/i.test(model)) {
				// 302ai 的 chat/completions 对 claude 系模型返回 Anthropic 原生格式，需走原生 /v1/messages
				const anthropic = createAnthropic({
					baseURL: baseUrl || "https://api.302ai.cn/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = anthropic.chat(model);
			} else {
				const openai = createOpenAICompatible({
					name: "302.AI",
					baseURL: baseUrl || "https://api.openai.com/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = openai.chatModel(model);
			}
			break;
		}
		case "openai": {
			const openai = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = openai.chat(model);
			break;
		}
		case "anthropic": {
			const anthropic = createAnthropic({
				baseURL: baseUrl || "https://api.anthropic.com/v1",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = anthropic.chat(model);
			break;
		}
		case "gemini": {
			const google = createGoogleGenerativeAI({
				baseURL: baseUrl || "https://generativelanguage.googleapis.com/v1beta",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = google.chat(model);
			break;
		}
		default:
			return c.json({ error: "Invalid provider type" }, 400);
	}

	try {
		logger.debug("[Suggestions] Starting to generate suggestions...");
		const convertedMessages = await convertToModelMessages(
			enhanceMessagesWithFeedback(messages),
		);
		const { text } = await generateTextWithContinuation({
			model: languageModel,
			messages: [
				...convertedMessages,
				{
					role: "user",
					content: getSuggestionsPrompt(language, count),
				},
			],
			maxOutputTokens: 2048, // 302ai 上游部分模型必须带 max_tokens；opus 系思考 token 也占额度，留足余量
		});

		logger.debug("[Suggestions] Received text:", text);

		// Parse the JSON array
		try {
			// Clean up the text - remove markdown code blocks if present
			let cleanText = text.trim();
			if (cleanText.startsWith("```")) {
				cleanText = cleanText
					.replace(/```json?\n?/g, "")
					.replace(/```/g, "")
					.trim();
			}

			const suggestions = JSON.parse(cleanText);
			if (Array.isArray(suggestions)) {
				logger.debug("[Suggestions] Parsed suggestions:", suggestions);
				return c.json({ suggestions: suggestions.slice(0, count) });
			}
			logger.info("[Suggestions] Invalid suggestions format");
			return c.json({ error: "Invalid suggestions format" }, 500);
		} catch (parseError) {
			logger.error("[Suggestions] Failed to parse JSON:", parseError);
			return c.json({ error: "Failed to parse suggestions" }, 500);
		}
	} catch (error) {
		logger.error("[Suggestions] Failed to generate suggestions:", error);
		return c.json({ error: "Failed to generate suggestions" }, 500);
	}
});

// Task decomposition prompt
function getTaskDecomposePrompt(count: number): string {
	return `你是“看板任务拆解器（Task Decomposer）”。
你的职责是：将用户输入的一句或几句高层需求，拆解成可由 AI Coding Agent 顺序执行的看板任务列表。
目标
输出一组可执行、可验证、顺序明确的子任务（从调研/澄清→设计→实现→测试→交付）。
任务必须尽量小粒度，避免“一条任务干完一整个系统”。
如果需求信息不足，先产生澄清任务（或澄清问题），保证后续任务可落地。
拆解原则（必须遵守）
先理解再拆解：识别目标、范围、约束、成功标准、依赖。
可执行：每条任务要具体到“改哪些文件/模块/接口/页面/脚本/配置”这类层面（若未知则写“待确认/按项目结构定位”）。
可验证：每条任务给出验收标准（如测试用例、接口返回、页面行为、性能指标等）。
顺序与依赖：输出顺序编号；如可并行，在依赖字段标明。
默认最小可交付（MVP）优先：先做最小闭环，再做增强项。
适配不同类型任务：开发/修复bug/重构/数据处理/自动化/文档/部署/集成/算法/插件等都能覆盖。
风险控制：遇到不确定项或高风险改动，生成“风险评估/备份/回滚方案”任务。
不要输出空泛任务：如“完善功能”“优化代码”必须拆到具体点。
输出格式（严格 JSON，便于程序解析）
只输出 JSON，不要输出任何额外文本。

JSON范例:
{
  "tasks": [
    {
      "id": "1",
      "content": "具体的任务描述",
    },
    {
      "id": "2",
      "content": "另一个任务描述",
    }
  ]
}

User requires decomposition into ${count} sub-tasks.`;
}

app.post("/decompose-tasks", async (c) => {
	const {
		requirement,
		count = 3,
		model,
		apiKey,
		baseUrl,
		providerType,
	} = await c.req.json<{
		requirement: string;
		count?: number;
		model: string;
		apiKey?: string;
		baseUrl?: string;
		providerType: ModelProvider["apiType"];
	}>();

	let languageModel;
	const proxyFetch = await createProxyFetch();
	const configured302AIBaseUrl = baseUrl || (await providerStorage.get302AIBaseUrl());
	switch (providerType) {
		case "302ai": {
			if (/claude/i.test(model)) {
				// 302ai 的 chat/completions 对 claude 系模型返回 Anthropic 原生格式，需走原生 /v1/messages
				const anthropic = createAnthropic({
					baseURL: configured302AIBaseUrl || "https://api.302ai.cn/v1",
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = anthropic.chat(model);
			} else {
				const openai = createOpenAICompatible({
					name: "302.AI",
					baseURL: configured302AIBaseUrl,
					apiKey: apiKey || "[REDACTED:sk-secret]",
					fetch: proxyFetch,
				});
				languageModel = openai.chatModel(model);
			}
			break;
		}
		case "openai": {
			const openai = createOpenAI({
				baseURL: baseUrl || "https://api.openai.com/v1",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = openai.chat(model);
			break;
		}
		case "anthropic": {
			const anthropic = createAnthropic({
				baseURL: baseUrl || "https://api.anthropic.com/v1",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = anthropic.chat(model);
			break;
		}
		case "gemini": {
			const google = createGoogleGenerativeAI({
				baseURL: baseUrl || "https://generativelanguage.googleapis.com/v1beta",
				apiKey: apiKey || "[REDACTED:sk-secret]",
				fetch: proxyFetch,
			});
			languageModel = google.chat(model);
			break;
		}
		default:
			return c.json({ error: "Invalid provider type" }, 400);
	}

	// Helper function to perform task decomposition
	const doDecompose = async (modelToUse: typeof languageModel) => {
		const { text } = await generateTextWithContinuation({
			model: modelToUse,
			messages: [
				{
					role: "user",
					content: getTaskDecomposePrompt(count) + "\n\n用户需求：\n" + requirement,
				},
			],
			maxOutputTokens: 2048, // 302ai 上游部分模型必须带 max_tokens；opus 系思考 token 也占额度，留足余量
		});

		logger.debug("[TaskDecompose] Received text:", text);

		// Parse the JSON response
		let jsonStr = text.trim();
		// Remove markdown code blocks if present
		if (jsonStr.startsWith("```")) {
			jsonStr = jsonStr
				.replace(/```json?\n?/g, "")
				.replace(/```/g, "")
				.trim();
		}

		const parsed = JSON.parse(jsonStr);
		if (parsed.tasks && Array.isArray(parsed.tasks)) {
			logger.debug("[TaskDecompose] Parsed tasks:", parsed.tasks.length);
			return parsed.tasks;
		} else {
			logger.debug("[TaskDecompose] Invalid response format");
			return [];
		}
	};

	try {
		logger.debug("[TaskDecompose] Starting task decomposition with model:", model);
		const tasks = await doDecompose(languageModel);
		return c.json({ tasks });
	} catch (error) {
		logger.error("[TaskDecompose] Model failed:", error);
		// Return error - let frontend handle retry with different model
		return c.json({ error: "Failed to decompose tasks" }, 500);
	}
});

app.post("/chat/302ai-code-agent", async (c) => {
	const {
		baseUrl,
		model = "claude-sonnet-4-5-20250929",
		apiKey,
		messages,
		language,
		threadId,
		sessionId,
		autoDeploy,
		skills,
		isCreateSkillMode,
		inPlanMode,
		inTaskOrchestrationMode,
		workspacePath,
		thinkingBudget,
		vibeMode,
		agentType,
	} = await c.req.json<RouterRequestBody>();

	const currentVibeMode = vibeMode ?? "remote";

	const [{ data: globalConfigs }, { data: codeAgentConfig }, { sandboxId }] = await Promise.all([
		codeAgentGlobalConfigsStorage.getGlobalConfigs(),
		codeAgentService.getCodeAgentConfig(threadId),
		codeAgentService.getClaudeCodeSandboxId(threadId),
	]);

	// Persist lastVibeMode when it changes
	if (globalConfigs.lastVibeMode !== currentVibeMode) {
		await codeAgentGlobalConfigsStorage.setLastVibeMode(currentVibeMode);
		logger.debug("[302ai-code-agent] Updated lastVibeMode to:", currentVibeMode);
	}

	// Persist lastAgentId when it changes
	const currentAgentId = codeAgentConfig.currentAgentId as CodingAgentClass;
	if (globalConfigs.lastAgentId !== currentAgentId) {
		// await codeAgentGlobalConfigsStorage.setLastAgentId(currentAgentId);
		logger.debug("[302ai-code-agent] Updated lastAgentId to:", currentAgentId);
	}

	logger.info(
		"[302ai-code-agent] Received request",
		JSON.stringify({
			baseUrl,
			model,
			apiKey,
			messages,
			threadId,
			sessionId,
			autoDeploy,
			isCreateSkillMode,
			inPlanMode,
			inTaskOrchestrationMode,
			workspacePath,
			thinkingBudget,
			vibeMode,
			agentType,
		}),
	);

	// Generate messageId upfront for immediate start event
	const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

	// Use createClaudeCodeFetch to get the transformed stream directly
	const proxyFetch = await createProxyFetch();
	const claudeCodeFetch = createClaudeCodeFetch(messageId, proxyFetch);

	const availableSkills =
		skills?.reduce<string[]>((acc, skill) => {
			if (!skill.isBuiltin) {
				acc.push(skill.name);
			}
			return acc;
		}, []) ?? [];

	// Collect forced skills for native backend injection
	// Using 302.AI's force_skill parameter instead of prompt injection
	const forcedSkills = skills?.filter((skill) => skill.forceUse) ?? [];

	if (inTaskOrchestrationMode) {
		const taskOrchestrationPrompt =
			language === "zh"
				? `\n\n 规则（不能将此规则体现在你的回复中）：如果用户在提示词中引用了附件（例如： @attachment_name），则附件内容在${workspacePath}/.302ai/attachments当中。`
				: `\n\n Rule (do not include this rule in your response): If the user references attachments in the prompt (e.g., @attachment_name), the attachment content is located in ${workspacePath}/.302ai/attachments.`;
		appendPromptToLastUserMessage(messages, taskOrchestrationPrompt);
	}

	// Add plan mode instructions to system message when plan mode is enabled
	if (inPlanMode) {
		const planModePrompt =
			language === "zh"
				? dedent`
					<plan_mode_instructions>

					⚠️ 你处于计划模式 ⚠️

					关键规则：每轮只问一个问题 - 严格执行
					- 在计划模式下，每轮只能调用 AskUserQuestion 一次
					- 不要在本轮对话中调用 AskUserQuestion 之后再次调用 AskUserQuestion
					- 等待用户的实际回答后再继续

					工作流程：
					第1轮：调用 AskUserQuestion → 等待用户回答
					第2轮：处理用户回答 → 调用 AskUserQuestion（如需要）→ 等待用户回答
					第3轮：处理用户回答 → 创建计划 → 调用 ExitPlanMode

					重要提示：
					- 如果你看到输出 "Answer questions?"，这意味着工具正在工作
					- 等待用户的真实回答
					- 不要在同一轮中再次尝试调用 AskUserQuestion

					每次行动前检查：
					□ 我在本轮中已经调用过 AskUserQuestion 了吗？ → 如果是：不要再次调用
					□ 我即将调用 AskUserQuestion 吗？ → 如果是：这将是本轮唯一一次调用

					</plan_mode_instructions>
				`
				: dedent`
					<plan_mode_instructions>

					⚠️ YOU ARE IN PLAN MODE ⚠️

					CRITICAL RULE: ONE QUESTION PER TURN - STRICTLY ENFORCED
					- In plan mode, you can only call AskUserQuestion ONCE per turn
					- DO NOT call AskUserQuestion again after calling it in the same turn
					- Wait for the user's actual response before proceeding

					WORKFLOW:
					Turn 1: Call AskUserQuestion → Wait for user response
					Turn 2: Process user's answer → Call AskUserQuestion (if needed) → Wait for user response
					Turn 3: Process user's answer → Create plan → Call ExitPlanMode

					IMPORTANT:
					- If you see output "Answer questions?", this means the tool is working
					- Wait for the user's real answer
					- Do NOT try to call AskUserQuestion again in the same turn

					CHECK BEFORE EVERY ACTION:
					□ Have I already called AskUserQuestion in this turn? → If YES: Do NOT call it again
					□ Am I about to call AskUserQuestion? → If YES: This will be my ONLY call this turn

					</plan_mode_instructions>
				`;
		appendPromptToSystemMessage(messages, planModePrompt);
	}

	// Build request body for 302.AI Claude Code API
	const convertedMessages = await convertToModelMessages(enhanceMessagesWithFeedback(messages));
	logger.info(
		"[302ai-code-agent] After convertToModelMessages:",
		JSON.stringify(convertedMessages, null, 2),
	);

	// Convert messages to OpenAI format
	// Send the last message (incremental update for 302.AI session)
	const messagesToConvert = convertedMessages.slice(-1);
	const openAiMessages = convertAiSdkMessagesToOpenAiMessages(messagesToConvert);
	const forceSkillNames = forcedSkills.map((s) => s.name);

	const requestBody = {
		model: codeAgentConfig.type === "remote" ? sandboxId : model,
		messages: openAiMessages,
		session_id: sessionId ?? "",
		structured_output: true,
		enable_pre_deploy_check: autoDeploy,
		available_skills: isCreateSkillMode ? [] : availableSkills,
		...(forceSkillNames.length > 0 ? { force_skill: forceSkillNames } : {}),
		...(isCreateSkillMode ? { action: "create_skill" } : {}),
		...(inPlanMode && !isCreateSkillMode ? { action: "plan" } : {}),
		...(inTaskOrchestrationMode ? { action: "sync_tasks_json" } : {}),
		...(thinkingBudget ? { max_thinking_token: THINKING_BUDGET_MAP[thinkingBudget] } : {}),
		...(agentType !== undefined ? { agent_type: agentType } : {}),
	};

	// Debug log for agentType
	if (agentType !== undefined) {
		logger.info(`[302ai-code-agent] agentType detected: ${agentType}`);
	}

	logger.debug("[302ai-code-agent] Messages:", JSON.stringify(requestBody.messages));
	logger.debug("[302ai-code-agent] Sending request to 302.AI...");
	logger.debug("[302ai-code-agent] Request body:", JSON.stringify(requestBody, null, 2));

	// Create immediate start event for optimistic UI update
	// Include messageMetadata with model and provider info so the UI shows correct icon/name
	const encoder = new TextEncoder();
	const immediateStartEvent = `data: ${JSON.stringify({
		type: "start",
		messageId,
		messageMetadata: {
			model,
			provider: "302ai-code-agent",
			createdAt: new Date().toISOString(),
		},
	})}\n\n`;

	// Create a combined stream that sends start immediately, then pipes upstream data
	const combinedStream = new ReadableStream({
		async start(controller) {
			// Track if stream has been closed to prevent double-close errors
			let streamClosed = false;

			// Helper function to safely close the controller exactly once
			const safeClose = () => {
				if (!streamClosed) {
					try {
						controller.close();
						logger.debug("[302ai-code-agent] Stream closed via safeClose");
					} catch (_closeError) {
						// Controller already closed, ignore
					}
					streamClosed = true;
				}
			};

			// Send start event immediately for optimistic UI update
			controller.enqueue(encoder.encode(immediateStartEvent));
			logger.debug("[302ai-code-agent] Sent immediate start event");

			// Upload attachments after sending start event (non-blocking UX)
			// This allows the UI to show "AI is typing" immediately while upload happens in background

			try {
				await uploadAttachmentsFromMessages(
					sandboxId,
					workspacePath ?? "",
					vibeMode ?? "remote",
					messages,
				);
			} catch (uploadError) {
				logger.error("[302ai-code-agent] Failed to upload attachments:", uploadError);
				sendStreamError(controller, "Failed to upload attachments");
				streamClosed = true; // sendStreamError closes the controller
				logger.debug("[302ai-code-agent] Error sent, stream closed via sendStreamError");
				return;
			}

			// Make the request using the custom fetch that transforms the response
			// after attachments have been successfully uploaded
			const abortController = new AbortController();

			try {
				const configured302AIBaseUrl = baseUrl ?? (await providerStorage.get302AIBaseUrl());
				const responsePromise = claudeCodeFetch(
					`${configured302AIBaseUrl}/chat/completions`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${apiKey}`,
						},
						body: JSON.stringify(requestBody),
						signal: abortController.signal,
					},
				);
				const response = await responsePromise;

				logger.info(
					"[302ai-code-agent] Response status:",
					response.status,
					response.statusText,
				);
				logger.info(
					"[302ai-code-agent] Response headers:",
					Object.fromEntries(response.headers.entries()),
				);
				if (!response.ok) {
					const errorText = await response.text();
					logger.error(
						"[302ai-code-agent] API error:",
						response.status,
						response.statusText,
					);
					logger.error("[302ai-code-agent] Error response body:", errorText || "(empty)");
					logger.error("[302ai-code-agent] Request that caused error:");
					logger.error(JSON.stringify(requestBody, null, 2));
					sendStreamError(
						controller,
						errorText || `HTTP ${response.status}: ${response.statusText}`,
					);
					streamClosed = true; // sendStreamError closes the controller
					logger.debug(
						"[302ai-code-agent] Error sent, stream closed via sendStreamError",
					);
					return;
				}

				logger.debug("[302ai-code-agent] Got response, streaming...");

				// Pipe the transformed stream from ClaudeCodeProcessor
				const reader = response.body?.getReader();
				if (!reader) {
					logger.debug("[302ai-code-agent] No reader available, closing stream");
					return; // finally block will call safeClose
				}

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							logger.debug("[302ai-code-agent] Reader done, stream complete");
							break; // finally block will call safeClose
						}
						try {
							controller.enqueue(value);
						} catch (_error) {
							// Client disconnected or controller closed
							logger.debug("[302ai-code-agent] Controller closed, stopping stream");
							reader.cancel();
							abortController.abort();
							streamClosed = true; // Controller was closed externally
							break;
						}
					}
				} catch (error) {
					logger.error("[302ai-code-agent] Reader error:", error);
					reader.cancel().catch(() => {
						// Ignore cancel errors
					});
					throw error; // Re-throw to be caught by outer catch
				}
			} catch (error) {
				logger.error("[302ai-code-agent] Stream error:", error);
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				sendStreamError(controller, errorMessage);
				streamClosed = true; // sendStreamError closes the controller
				logger.debug("[302ai-code-agent] Error sent, stream closed via sendStreamError");
			} finally {
				// CRITICAL: Guarantee stream closure in ALL code paths
				logger.info("[302ai-code-agent] Finally block reached, ensuring stream closure");
				safeClose();
			}
		},
	});

	return new Response(combinedStream, {
		status: 200,
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"x-vercel-ai-ui-message-stream": "v1",
		},
	});
});

// Helper function to render SSO callback page
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSsoCallbackPage(c: Context<any>, apikey: string | undefined, lang: string) {
	// Simple i18n for callback page
	const i18n = {
		zh: {
			successTitle: "登录成功",
			successMessage: "您可以关闭此页面，返回应用继续使用",
			errorTitle: "登录失败",
			errorMessage: "未收到有效的 API Key",
		},
		en: {
			successTitle: "Login Successful",
			successMessage: "You can close this page and return to the app",
			errorTitle: "Login Failed",
			errorMessage: "No valid API Key received",
		},
	};

	const t = i18n[lang as "zh" | "en"] || i18n.zh;

	if (apikey) {
		// Notify SSO service
		ssoService.handleSsoCallbackFromServer(apikey);

		// Return success page
		return c.html(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>${t.successTitle}</title>
				<meta charset="utf-8">
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
						display: flex;
						align-items: center;
						justify-content: center;
						height: 100vh;
						margin: 0;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					}
					.container {
						text-align: center;
						background: white;
						padding: 40px;
						border-radius: 20px;
						box-shadow: 0 10px 40px rgba(0,0,0,0.2);
					}
					.icon {
						font-size: 64px;
						margin-bottom: 20px;
					}
					h1 {
						color: #333;
						margin: 0 0 10px 0;
					}
					p {
						color: #666;
						margin: 0;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="icon">✓</div>
					<h1>${t.successTitle}</h1>
					<p>${t.successMessage}</p>
				</div>
				<script>
					setTimeout(() => window.close(), 2000);
				</script>
			</body>
			</html>
		`);
	}

	return c.html(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>${t.errorTitle}</title>
			<meta charset="utf-8">
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
					display: flex;
					align-items: center;
					justify-content: center;
					height: 100vh;
					margin: 0;
					background: #f5f5f5;
				}
				.container {
					text-align: center;
					background: white;
					padding: 40px;
					border-radius: 20px;
					box-shadow: 0 10px 40px rgba(0,0,0,0.1);
				}
				.icon {
					font-size: 64px;
					margin-bottom: 20px;
					color: #f56c6c;
				}
				h1 {
					color: #333;
					margin: 0 0 10px 0;
				}
				p {
					color: #666;
					margin: 0;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="icon">✗</div>
				<h1>${t.errorTitle}</h1>
				<p>${t.errorMessage}</p>
			</div>
		</body>
		</html>
	`);
}

// SSO callback endpoint - language is now in path to avoid query param conflicts
// 302.AI appends ?apikey=... to redirect URL, so we use path for language
app.get("/sso/callback/:lang", async (c) => {
	const apikey = c.req.query("apikey");
	const uid = c.req.query("uid");
	const username = c.req.query("username");
	const lang = c.req.param("lang") || "zh"; // Get language from path param

	logger.debug("[SSO Callback] Received:", {
		apikey: apikey ? "exists" : "missing",
		uid,
		username,
		lang,
	});

	return renderSsoCallbackPage(c, apikey, lang);
});

// Backwards compatibility: handle old format with lang in query params
// Also handles malformed URLs where apikey might be embedded in lang param
app.get("/sso/callback", async (c) => {
	let apikey = c.req.query("apikey");
	const uid = c.req.query("uid");
	const username = c.req.query("username");
	let lang = c.req.query("lang") || "zh";

	// Handle malformed URL: ?lang=zh?apikey=xxx becomes lang="zh?apikey=xxx"
	// Extract apikey from lang if it contains ?apikey=
	if (!apikey && lang.includes("?apikey=")) {
		const match = lang.match(/\?apikey=([^&]+)/);
		if (match) {
			apikey = match[1];
			// Extract actual language
			lang = lang.split("?")[0] || "zh";
		}
	}

	logger.debug("[SSO Callback Legacy] Received:", {
		apikey: apikey ? "exists" : "missing",
		uid,
		username,
		lang,
	});

	return renderSsoCallbackPage(c, apikey, lang);
});

export async function initServer(preferredPort = 8089): Promise<number> {
	const port = await getPort({ port: preferredPort });

	serve({
		fetch: app.fetch,
		port,
		hostname: "localhost",
	});

	logger.debug(`Server started successfully on port ${port}`);
	return port;
}
