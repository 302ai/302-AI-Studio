import { createLogger } from "@shared/logger";

const logger = createLogger("chat");

import { generateContextSummary } from "$lib/api/context-summary-generation";
import { generateSuggestions } from "$lib/api/suggestions-generation";
import { generateTitle, type FallbackModelConfig } from "$lib/api/title-generation";
import { emitter, EventNames } from "$lib/event/emitter";
import { m } from "$lib/paraglide/messages";
import { chatParameters } from "$lib/stores/chat-paramters/chat-parameters.svelte";
import { generalSettings } from "$lib/stores/general-settings.state.svelte";
import { preferencesSettings } from "$lib/stores/preferences-settings.state.svelte";
import { persistedProviderState } from "$lib/stores/provider-state.svelte";
import { sessionState } from "$lib/stores/session-state.svelte";
import { tabBarState } from "$lib/stores/tab-bar-state.svelte";
import {
	clearPendingResultMetadata,
	pendingResultMetadata,
} from "$lib/transport/dynamic-chat-transport";
import type { ChatMessage, MessageMetadata } from "$lib/types/chat";
import type { ModelProvider } from "@shared/storage/provider";
import type { Model, ThreadParmas } from "@shared/types";
import { resolvePrompt } from "@shared/utils/chat-parameters";

type PersistedStateLike<T> = {
	current: T;
	flush: () => Promise<void>;
};

export type AfterChatFinishedChatState = {
	isStreaming: boolean;
	isSubmitted: boolean;
	isGeneratingTitle: boolean;
	shouldApplyCompression: boolean;
	selectedModel: Model | null;
	currentProvider: ModelProvider | null;
	createTitleAbortController: () => AbortSignal;
	createSummaryAbortController: () => AbortSignal;
	createSuggestionsAbortController: () => AbortSignal;
	messages: ChatMessage[];
	contextSummary: string | undefined;
	compressedMessageCount: number | undefined;
	lastCompressionMessageId: string | undefined;
};

type AfterChatFinishedContext = {
	messages: ChatMessage[];
	chatState: AfterChatFinishedChatState;
	persistedChatParamsState: PersistedStateLike<ThreadParmas>;
	persistedMessagesState: PersistedStateLike<ChatMessage[]>;
};

export type OnChatFinishPrePersistArgs = {
	messages: ChatMessage[];
	isAbort: boolean;
	isDisconnect: boolean;
	isError: boolean;
	chatState: AfterChatFinishedChatState;
	codeAgentEnabled: boolean;
	autoDeploy: boolean;
};

export type OnChatFinishPrePersistResult = {
	messages: ChatMessage[];
	onFinishStartTime: number;
};

export async function onChatFinishPrePersist(
	args: OnChatFinishPrePersistArgs,
): Promise<OnChatFinishPrePersistResult> {
	const { messages } = args;
	const { isAbort, isDisconnect, isError, chatState, codeAgentEnabled, autoDeploy } = args;
	const onFinishStartTime = performance.now();

	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	logger.info("[onFinish] Stream completion received at:", new Date().toISOString());
	logger.info("更新完成", $state.snapshot(messages));
	logger.debug("[onFinish] messages", JSON.stringify($state.snapshot(messages), null, 2));
	logger.info("[onFinish] isAbort:", isAbort, "isDisconnect:", isDisconnect, "isError:", isError);

	// Performance: Single-pass reverse iteration to find last user and assistant messages
	const perfStart = performance.now();
	let lastUserIdx = -1;
	let lastAssistantIdx = -1;

	for (let i = messages.length - 1; i >= 0; i--) {
		if (lastUserIdx === -1 && messages[i].role === "user") {
			lastUserIdx = i;
		}
		if (lastAssistantIdx === -1 && messages[i].role === "assistant") {
			lastAssistantIdx = i;
		}
		if (lastUserIdx !== -1 && lastAssistantIdx !== -1) break;
	}
	logger.info(`[Performance] Message lookup: ${(performance.now() - perfStart).toFixed(3)}ms`);

	// Update last user message metadata
	if (lastUserIdx !== -1) {
		messages[lastUserIdx] = {
			...messages[lastUserIdx],
			metadata: {
				...messages[lastUserIdx].metadata,
				userPromptTemplateContent: chatParameters.userPromptTemplateContent,
				userPromptTemplateVariables: chatParameters.userPromptTemplateVariables,
				userPromptTemplateMap: chatParameters.userPromptTemplateMap,
			},
		};
		chatState.messages = messages;
	}

	// Save systemPrompt to the last assistant message
	if (lastAssistantIdx !== -1 && chatParameters.systemPromptContent) {
		const resolvedSystemPrompt = resolvePrompt(chatParameters.systemPromptContent, {
			modelId: chatState.selectedModel?.id ?? "",
			language: generalSettings.language,
			cachedMap: chatParameters.systemPromptMap,
			variables: chatParameters.systemPromptVariables,
		});

		messages[lastAssistantIdx] = {
			...messages[lastAssistantIdx],
			metadata: {
				...messages[lastAssistantIdx].metadata,
				systemPromptContent: resolvedSystemPrompt.content,
				systemPromptVariables: chatParameters.systemPromptVariables,
				systemPromptMap: chatParameters.systemPromptMap,
			},
		};
		chatState.messages = messages;
	}

	logger.info("onFinish: async ({ messages }) pendingResultMetadata", pendingResultMetadata);
	const lastMessageIdx = messages.length - 1;
	if (codeAgentEnabled && pendingResultMetadata && lastMessageIdx >= 0) {
		const lastMessage = messages[lastMessageIdx];
		if (lastMessage.role === "assistant") {
			lastMessage.metadata = {
				...(lastMessage.metadata as MessageMetadata),
				result: pendingResultMetadata,
			};
			logger.info("[ChatState] Merged result metadata into message:", pendingResultMetadata);
		}
		clearPendingResultMetadata();
	}

	logger.info("onFinish: async ({ messages }) codeAgentEnabled", codeAgentEnabled);
	logger.info("onFinish: async ({ messages }) autoDeploy", autoDeploy);

	const isDeployCommand =
		lastUserIdx !== -1 &&
		messages[lastUserIdx].parts.some(
			(part) => part.type === "text" && part.text.trim() === "/deploy",
		);

	emitter.emit(EventNames.CHAT_FINISHED, {
		canDeploy: codeAgentEnabled && (autoDeploy || isDeployCommand),
		lastMessage: messages[lastMessageIdx],
	});
	logger.info(
		"[onFinish] CHAT_FINISHED emitted, elapsed:",
		(performance.now() - onFinishStartTime).toFixed(2),
		"ms",
	);

	return { messages, onFinishStartTime };
}

export type OnChatFinishPostPersistArgs = {
	messages: ChatMessage[];
	chatState: AfterChatFinishedChatState & {
		temperature: number | null;
		topP: number | null;
		maxTokens: number | null;
		frequencyPenalty: number | null;
		presencePenalty: number | null;
		isThinkingActive: boolean;
		isOnlineSearchActive: boolean;
		isMCPActive: boolean;
		mcpServerIds: string[];
	};
	persistedChatParamsState: PersistedStateLike<ThreadParmas>;
	persistedMessagesState: PersistedStateLike<ChatMessage[]>;
	onFinishStartTime: number;
};

export async function onChatFinishPostPersist(args: OnChatFinishPostPersistArgs): Promise<void> {
	const {
		messages,
		chatState,
		persistedChatParamsState,
		persistedMessagesState,
		onFinishStartTime,
	} = args;

	sessionState.latestUsedModel = chatState.selectedModel ?? null;

	await afterChatFinished({
		messages,
		chatState,
		persistedChatParamsState,
		persistedMessagesState,
	});

	logger.info(
		"[onFinish] Callback complete, total elapsed:",
		(performance.now() - onFinishStartTime).toFixed(2),
		"ms",
	);
}

function buildFallbackConfigIfNeeded(
	primaryProvider: ModelProvider | undefined,
	chatState: Pick<AfterChatFinishedChatState, "selectedModel" | "currentProvider">,
): FallbackModelConfig | undefined {
	if (primaryProvider) return;
	if (!chatState.selectedModel || !chatState.currentProvider) return;
	return { model: chatState.selectedModel, provider: chatState.currentProvider };
}

function findProviderForModel(model: Model | null | undefined): ModelProvider | undefined {
	if (!model) return undefined;
	return persistedProviderState.current.find((provider) => provider.id === model.providerId);
}

function isPostProcessInterrupted(
	chatState: Pick<AfterChatFinishedChatState, "isStreaming" | "isSubmitted">,
	signal?: AbortSignal,
): boolean {
	return !!signal?.aborted || chatState.isStreaming || chatState.isSubmitted;
}

async function handleTitleGeneration(context: AfterChatFinishedContext): Promise<void> {
	const { messages, chatState, persistedChatParamsState } = context;
	const { broadcastService } = window.electronAPI;

	const titleTiming = preferencesSettings.titleGenerationTiming;
	const titleModel = preferencesSettings.titleGenerationModel;
	const isFirstMessage = messages.length === 2;
	const currentTitle = persistedChatParamsState.current.title;
	const localizedDefaultTitle = m.title_new_chat();
	const isDefaultTitle =
		!currentTitle ||
		currentTitle === localizedDefaultTitle ||
		currentTitle === "New Chat" ||
		currentTitle === "新对话" ||
		currentTitle === "新会话";

	const shouldGenerateTitleWithModel =
		titleTiming !== "off" &&
		((titleTiming === "firstTime" && isFirstMessage && isDefaultTitle) ||
			(titleTiming === "everyTime" && messages.length >= 2));

	try {
		if (shouldGenerateTitleWithModel && titleModel) {
			const abortSignal = chatState.createTitleAbortController();
			const provider = findProviderForModel(titleModel);
			const fallbackConfig = buildFallbackConfigIfNeeded(provider, chatState);
			const previousSummary = persistedChatParamsState.current.incrementalSummary;
			let messagesToSend: ChatMessage[];
			if (isFirstMessage) {
				// Performance: Direct iteration instead of filter
				for (let i = 0; i < messages.length; i++) {
					if (messages[i].role === "user") {
						messagesToSend = [messages[i]];
						break;
					}
				}
				messagesToSend ??= [];
			} else {
				// Performance: Single reverse pass to find last user and assistant
				let lastUser: ChatMessage | undefined;
				let lastAssistant: ChatMessage | undefined;
				for (let i = messages.length - 1; i >= 0; i--) {
					if (!lastUser && messages[i].role === "user") lastUser = messages[i];
					if (!lastAssistant && messages[i].role === "assistant")
						lastAssistant = messages[i];
					if (lastUser && lastAssistant) break;
				}
				messagesToSend = [lastAssistant, lastUser].filter(Boolean) as ChatMessage[];
			}
			const serverPort = window.app?.serverPort ?? 8089;

			try {
				chatState.isGeneratingTitle = true;
				const result = await generateTitle(
					messagesToSend,
					titleModel,
					provider,
					serverPort,
					previousSummary,
					isFirstMessage,
					fallbackConfig,
					abortSignal,
				);

				if (isPostProcessInterrupted(chatState, abortSignal)) {
					logger.info("[Title] Skipped: request was aborted or new stream in progress");
					return;
				}
				if (!result) return;

				persistedChatParamsState.current.title = result.title;
				persistedChatParamsState.current.incrementalSummary = result.summary;

				emitter.emit(EventNames.THREAD_TITLE_UPDATED, { title: result.title });
				await tabBarState.updateTabTitle(persistedChatParamsState.current.id, result.title);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					logger.info("[Title] Generation cancelled");
					return;
				}
				logger.error("Failed to generate title:", error);
			} finally {
				chatState.isGeneratingTitle = false;
			}
		} else if (isFirstMessage && isDefaultTitle && titleTiming !== "off") {
			// Performance: Direct iteration instead of find
			let firstUserMessage: ChatMessage | undefined;
			for (let i = 0; i < messages.length; i++) {
				if (messages[i].role === "user") {
					firstUserMessage = messages[i];
					break;
				}
			}
			const textPart = firstUserMessage?.parts.find((part) => part.type === "text");
			if (textPart && "text" in textPart) {
				const fallbackTitle = [...textPart.text.trim()].slice(0, 10).join("");
				if (fallbackTitle) {
					persistedChatParamsState.current.title = fallbackTitle;
					await tabBarState.updateTabTitle(
						persistedChatParamsState.current.id,
						fallbackTitle,
					);
				}
			}
		}
	} finally {
		persistedChatParamsState.current.updatedAt = new Date();
		// Preserve existing non-blocking flush behavior.
		persistedChatParamsState.flush();
		await broadcastService.broadcastToAll("thread-list-updated", {});
	}
}

async function handleContextSummaryGeneration(context: AfterChatFinishedContext): Promise<void> {
	const { messages, chatState, persistedChatParamsState } = context;

	if (!chatState.shouldApplyCompression) return;

	const compressionLimit = preferencesSettings.contextCompressionLimit;
	if (messages.length <= compressionLimit) return;

	const summaryModel = preferencesSettings.titleGenerationModel;
	if (!summaryModel) return;

	const existingCompressed = chatState.compressedMessageCount ?? 0;
	const keepRecentCount = Math.min(compressionLimit, messages.length);
	const newCompressionEnd = messages.length - keepRecentCount;
	if (newCompressionEnd <= existingCompressed) return;

	const messagesToCompress = messages.slice(existingCompressed, newCompressionEnd);
	if (messagesToCompress.length < 2) return;

	const abortSignal = chatState.createSummaryAbortController();
	const provider = findProviderForModel(summaryModel);
	const fallbackConfig = buildFallbackConfigIfNeeded(provider, chatState);
	const serverPort = window.app?.serverPort ?? 8089;

	try {
		const summaryResult = await generateContextSummary(
			messagesToCompress,
			summaryModel,
			provider,
			serverPort,
			chatState.contextSummary,
			generalSettings.language,
			fallbackConfig,
			abortSignal,
		);

		if (isPostProcessInterrupted(chatState, abortSignal)) {
			logger.info("[ContextSummary] Skipped: aborted or stream in progress");
			return;
		}
		if (!summaryResult) return;

		chatState.contextSummary = summaryResult;
		chatState.compressedMessageCount = newCompressionEnd;
		chatState.lastCompressionMessageId = messages[newCompressionEnd - 1]?.id;
		persistedChatParamsState.flush();
		logger.info(`[ContextSummary] Updated: ${newCompressionEnd} messages compressed`);
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") {
			logger.info("[ContextSummary] Generation cancelled");
			return;
		}
		logger.error("[ContextSummary] Failed:", error);
	}
}

async function handleSuggestionsGeneration(context: AfterChatFinishedContext): Promise<void> {
	const { messages, chatState, persistedMessagesState } = context;
	const suggestionsModel = preferencesSettings.titleGenerationModel;

	if (
		!preferencesSettings.suggestionsEnabled ||
		preferencesSettings.suggestionsTiming !== "auto" ||
		!suggestionsModel
	) {
		return;
	}

	const lastMessage = messages.at(-1);
	if (!lastMessage || lastMessage.role !== "assistant") return;

	const provider = findProviderForModel(suggestionsModel);
	const fallbackConfig = buildFallbackConfigIfNeeded(provider, chatState);
	const serverPort = window.app?.serverPort ?? 8089;
	const abortSignal = chatState.createSuggestionsAbortController();
	const targetMessageId = lastMessage.id;

	try {
		const suggestions = await generateSuggestions(
			messages,
			suggestionsModel,
			provider,
			generalSettings.language,
			preferencesSettings.suggestionsCount,
			serverPort,
			fallbackConfig,
			abortSignal,
		);

		if (isPostProcessInterrupted(chatState, abortSignal)) {
			logger.info("[Suggestions] Skipped: request was aborted or new stream in progress");
			return;
		}
		if (suggestions.length === 0) return;

		const currentMessages = persistedMessagesState.current;
		const messageIndex = currentMessages.findIndex((message) => message.id === targetMessageId);
		if (messageIndex === -1) return;

		const hasSuggestions = currentMessages[messageIndex].parts.some(
			(part) => part.type === "data-suggestions",
		);
		if (hasSuggestions) return;

		const updatedMessages = [...currentMessages];
		updatedMessages[messageIndex] = {
			...currentMessages[messageIndex],
			parts: [
				...currentMessages[messageIndex].parts,
				{
					type: "data-suggestions" as const,
					data: { suggestions },
				},
			],
		};

		persistedMessagesState.current = updatedMessages;
		if (!chatState.isStreaming && !chatState.isSubmitted) {
			chatState.messages = updatedMessages;
			logger.info("[Suggestions] Successfully added to message");
			return;
		}

		logger.info(
			"[Suggestions] Saved to persisted state, skipped chat.messages update due to active stream",
		);
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") return;
		logger.error("[Suggestions] Failed to generate:", error);
	}
}

export async function afterChatFinished(args: {
	messages: ChatMessage[];
	chatState: AfterChatFinishedChatState;
	persistedChatParamsState: PersistedStateLike<ThreadParmas>;
	persistedMessagesState: PersistedStateLike<ChatMessage[]>;
}): Promise<void> {
	const context: AfterChatFinishedContext = args;

	const [titleResult, summaryResult, suggestionsResult] = await Promise.allSettled([
		handleTitleGeneration(context),
		handleContextSummaryGeneration(context),
		handleSuggestionsGeneration(context),
	]);

	if (titleResult.status === "rejected") {
		logger.error("[afterChatFinished] Title post-process failed:", titleResult.reason);
	}
	if (summaryResult.status === "rejected") {
		logger.error(
			"[afterChatFinished] Context summary post-process failed:",
			summaryResult.reason,
		);
	}
	if (suggestionsResult.status === "rejected") {
		logger.error(
			"[afterChatFinished] Suggestions post-process failed:",
			suggestionsResult.reason,
		);
	}
}
