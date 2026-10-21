import { generateTitle, type FallbackModelConfig } from "$lib/api/title-generation";
import { onChatFinishPostPersist, onChatFinishPrePersist } from "$lib/hooks/chat-hook.svelte";
import { PersistedState } from "$lib/hooks/persisted-state.svelte";
import { m } from "$lib/paraglide/messages.js";
import { DynamicChatTransport } from "$lib/transport/dynamic-chat-transport";
import type { ChatMessage } from "$lib/types/chat";
import {
	convertAttachmentsToMessageParts,
	type MessagePart,
} from "$lib/utils/attachment-converter";
import {
	addAttachmentReference,
	removeAttachmentReference,
} from "$lib/utils/attachment-text-utils";
import { clone } from "$lib/utils/clone";
import { ChatErrorHandler, type ChatError } from "$lib/utils/error-handler";
import { replaceCodeBlockAt } from "$lib/utils/markdown-code-block";
import { Chat } from "@ai-sdk/svelte";
import { createLogger } from "@shared/logger";
import type { ModelProvider } from "@shared/storage/provider";
import type {
	AttachmentFile,
	MCPServer,
	Model,
	ThreadParmas,
	ThinkingBudgetType,
} from "@shared/types";
import { hashApiKey } from "@shared/utils/hash";
import { nanoid } from "nanoid";
import { untrack } from "svelte";
import { toast } from "svelte-sonner";

const logger = createLogger("chat");

import { startListeningOpenClawCronJobs, stopListeningOpenClawCronJobs } from "$lib/api/openclaw";
import {
	pushOpenClawCronJobRecord,
	type OpenClawCronJobResultResponse,
} from "$lib/api/openclaw/base-apis";
import { chatParameters } from "$lib/stores/chat-paramters/chat-parameters.svelte";

import { resolvePrompt } from "@shared/utils/chat-parameters";
import { codeAgentGlobalConfigsState, codeAgentState } from "./code-agent";
import { cloudModeState } from "./code-agent/cloud-mode-state.svelte";
import { codeAgentTaskboardState } from "./code-agent/code-agent-taskboard-state.svelte";
import { localEnvState } from "./code-agent/local-env-state.svelte";
import { generalSettings } from "./general-settings.state.svelte";
import { mcpState } from "./mcp-state.svelte";
import { notificationState } from "./notification-state.svelte";
import { preferencesSettings } from "./preferences-settings.state.svelte";
import {
	persistedModelState,
	persistedProviderState,
	providerState,
} from "./provider-state.svelte";
import { tabBarState } from "./tab-bar-state.svelte";

const { broadcastService, threadService, storageService } = window.electronAPI;

export interface Thread {
	id: string;
}

const tab = window?.tab ?? null;
// Ensure we have a valid threadId, even if window.tab is corrupted or missing after reload
const threadId =
	tab &&
	typeof tab === "object" &&
	"threadId" in tab &&
	typeof tab.threadId === "string" &&
	tab.threadId
		? tab.threadId
		: "shell";

// Check if window.thread has valid data (not just an empty object from failed temp file load)
// A valid thread should have at least an 'id' property that matches our threadId
const hasValidThreadData =
	window?.thread &&
	typeof window.thread === "object" &&
	"id" in window.thread &&
	window.thread.id === threadId;

// Use window data if valid (first load with temp files), otherwise use defaults
// PersistedState will restore from storage if available, overriding these initial values
const initialMessages: ChatMessage[] = Array.isArray(window?.messages)
	? clone(window.messages)
	: [];

const initialThread: ThreadParmas = hasValidThreadData
	? clone(window.thread as ThreadParmas)
	: {
			id: threadId,
			title: "New Chat",
			inputValue: "",
			attachments: [],
			mcpServers: [],
			mcpServerIds: [],
			isThinkingActive: false,
			isOnlineSearchActive: false,
			isOCRActive: false,
			isMCPActive: false,
			isPrivateChatActive: false,
			selectedModel: null,
			temperature: null,
			topP: null,
			maxTokens: null,
			frequencyPenalty: null,
			presencePenalty: null,
			reasoningEffort: "off",
			updatedAt: new Date(),
		};

export const persistedMessagesState = new PersistedState<ChatMessage[]>(
	"app-chat-messages:" + threadId,
	initialMessages,
);
export const persistedChatParamsState = new PersistedState<ThreadParmas>(
	"app-thread:" + threadId,
	initialThread,
);

$effect.root(() => {
	$effect(() => {
		// Avoid clearing too early (e.g. before persisted states are hydrated)
		if (!persistedChatParamsState.isHydrated || !persistedModelState.isHydrated) {
			return;
		}

		const selected = persistedChatParamsState.current.selectedModel;
		if (!selected) return;

		const exists = persistedModelState.current.some(
			(m) => m.id === selected.id && m.providerId === selected.providerId,
		);
		if (!exists) {
			logger.info(
				`[ChatState] Clearing selectedModel ${selected.providerId}:${selected.id} (model not found)`,
			);
			persistedChatParamsState.current.selectedModel = null;
		}
	});

	// Clean up mcpServerIds when MCP servers are deleted
	$effect(() => {
		// Avoid running too early
		if (!persistedChatParamsState.isHydrated || !mcpState.isHydrated) {
			return;
		}

		const currentServerIds = persistedChatParamsState.current.mcpServerIds;
		if (!currentServerIds || currentServerIds.length === 0) {
			return;
		}

		// Get IDs of all existing servers
		const existingServerIds = new Set(mcpState.servers.map((s) => s.id));

		// Filter out IDs that no longer exist
		const validServerIds = currentServerIds.filter((id) => existingServerIds.has(id));

		// If some IDs were removed, update the state
		if (validServerIds.length !== currentServerIds.length) {
			logger.info(
				`[ChatState] Cleaning up deleted MCP server IDs: ${currentServerIds.length - validServerIds.length} removed`,
			);
			persistedChatParamsState.current = {
				...persistedChatParamsState.current,
				mcpServerIds: validServerIds,
				isMCPActive: validServerIds.length > 0,
			};
		}
	});

	// Auto-apply default model for new sessions
	$effect(() => {
		// Wait for states to be hydrated
		if (!persistedChatParamsState.isHydrated) {
			return;
		}

		// Only apply if no model is selected and no messages exist
		const currentParams = persistedChatParamsState.current;
		const hasMessages = persistedMessagesState.current.length > 0;
		if (currentParams.selectedModel || hasMessages) {
			return;
		}

		// Apply default model based on mode
		if (codeAgentState.enabled) {
			const vibeDefault = preferencesSettings.vibeNewSessionModel;
			if (vibeDefault) {
				persistedChatParamsState.current.selectedModel = vibeDefault;
				logger.info("Applied Vibe default model:", vibeDefault.name);
			}
		} else {
			const chatDefault = preferencesSettings.newSessionModel;
			if (chatDefault) {
				persistedChatParamsState.current.selectedModel = chatDefault;
				logger.info("Applied Chat default model:", chatDefault.name);
			}
		}
	});
});

class ChatState {
	private lastError: ChatError | null = $state(null);
	private retryInProgress = $state(false);
	private hydrateCheckInterval: ReturnType<typeof setInterval> | null = null;

	// AbortController for canceling pending suggestions generation
	private suggestionsAbortController: AbortController | null = null;

	// AbortController for canceling pending title generation
	private titleAbortController: AbortController | null = null;

	// AbortController for canceling pending context summary generation
	private summaryAbortController: AbortController | null = null;

	isGeneratingTitle = $state(false);

	// Track loading state for attachments (not persisted)
	loadingAttachmentIds = $state(new Set<string>());
	isParametersOpen = $state(false);
	isCreateSkillMode = $state(false);
	private _isSearchInput = $state(false);

	// Task result rendering state and queue
	isRenderingTaskResult = $state(false);
	private pendingTaskResults = $state<OpenClawCronJobResultResponse["data"][number]["runs"][]>(
		[],
	);

	private isActive = $derived(tabBarState.activeTab?.id === tab.id);

	/**
	 * Cancel any pending suggestions generation request.
	 * Should be called before sending a new message to avoid race conditions.
	 */
	cancelPendingSuggestions() {
		if (this.suggestionsAbortController) {
			this.suggestionsAbortController.abort();
			this.suggestionsAbortController = null;
			logger.debug("Cancelled pending suggestions generation");
		}
	}

	/**
	 * Cancel any pending title generation request.
	 * Should be called before sending a new message to avoid race conditions.
	 */
	cancelPendingTitle() {
		if (this.titleAbortController) {
			this.titleAbortController.abort();
			this.titleAbortController = null;
			logger.debug("Cancelled pending title generation");
		}
	}

	/**
	 * Cancel any pending context summary generation request.
	 * Should be called before sending a new message to avoid race conditions.
	 */
	cancelPendingSummary() {
		if (this.summaryAbortController) {
			this.summaryAbortController.abort();
			this.summaryAbortController = null;
			logger.debug("Cancelled pending summary generation");
		}
	}

	/**
	 * Create a new AbortController for suggestions generation.
	 * Returns the AbortSignal to be passed to the fetch request.
	 */
	createSuggestionsAbortController(): AbortSignal {
		// Cancel any existing pending request first
		this.cancelPendingSuggestions();
		this.suggestionsAbortController = new AbortController();
		return this.suggestionsAbortController.signal;
	}

	/**
	 * Create a new AbortController for title generation.
	 * Returns the AbortSignal to be passed to the fetch request.
	 */
	createTitleAbortController(): AbortSignal {
		// Cancel any existing pending request first
		this.cancelPendingTitle();
		this.titleAbortController = new AbortController();
		return this.titleAbortController.signal;
	}

	/**
	 * Create a new AbortController for context summary generation.
	 * Returns the AbortSignal to be passed to the fetch request.
	 */
	createSummaryAbortController(): AbortSignal {
		// Cancel any existing pending request first
		this.cancelPendingSummary();
		this.summaryAbortController = new AbortController();
		return this.summaryAbortController.signal;
	}

	constructor() {
		// Effect to control Cron polling based on Vibe mode and Active Tab
		$effect.root(() => {
			$effect(() => {
				// Only start polling if: Vibe mode enabled + Tab active + SessionId exists
				if (
					codeAgentState.enabled &&
					codeAgentState.type === "local" &&
					localEnvState.openClawHealthStatus === "healthy" &&
					this.isActive &&
					codeAgentState.currentSessionId
				) {
					startListeningOpenClawCronJobs(codeAgentState.currentSessionId, (runs) => {
						if (runs && runs.length > 0) {
							this.pendingTaskResults.push(runs);
						}
					});
				} else {
					// Immediately stop when switching tabs or exiting Vibe mode
					untrack(() => stopListeningOpenClawCronJobs());
				}
			});

			// Effect to consume the pending task results when chat is ready (not streaming)
			$effect(() => {
				if (
					this.isReady &&
					this.pendingTaskResults.length > 0 &&
					!this.isRenderingTaskResult
				) {
					untrack(() => this.processNextTaskResult());
				}
			});
		});

		// Watch for busy state and report to ThreadStateService
		$effect.root(() => {
			$effect(() => {
				const isBusy = this.isStreaming || this.isGeneratingTitle;
				const reason = this.isStreaming
					? "streaming"
					: this.isGeneratingTitle
						? "generating-title"
						: undefined;
				const threadId = untrack(() => this.id);
				window.electronAPI.threadStateService.updateBusyState({
					threadId,
					isBusy,
					reason,
				});
			});
		});

		// Watch for PersistedState hydration and sync messages to chat
		// This handles the case where reload happens before hydration completes
		this.hydrateCheckInterval = setInterval(() => {
			if (persistedMessagesState.isHydrated && persistedChatParamsState.isHydrated) {
				this.syncPersistedStatesToChat();
				if (this.hydrateCheckInterval) {
					clearInterval(this.hydrateCheckInterval);
					this.hydrateCheckInterval = null;
				}
			}
		}, 50);

		// Also clear after 5 seconds to prevent infinite checking
		setTimeout(() => {
			if (this.hydrateCheckInterval) {
				clearInterval(this.hydrateCheckInterval);
				this.hydrateCheckInterval = null;
			}
		}, 5000);

		// Listen for models-deleted events and clear selectedModel if it was deleted
		// (or if the whole provider's models were cleared)
		window.electronAPI.onModelsDeleted(({ deletedModelIds, providerId }) => {
			const currentModel = this.selectedModel;
			const shouldClear =
				!!currentModel &&
				(deletedModelIds.includes(currentModel.id) ||
					(!!providerId && currentModel.providerId === providerId));
			if (shouldClear) {
				logger.info(
					`[ChatState] Clearing selectedModel ${currentModel?.providerId}:${currentModel?.id} (models deleted)`,
				);
				this.selectedModel = null;
			}
		});
	}

	private syncPersistedStatesToChat() {
		const persistedMessages = persistedMessagesState.snapshot;
		const currentChatMessages = chat.messages;

		// Sync messages if persisted state has data but chat doesn't (e.g., after reload/hydration)
		if (persistedMessages.length > 0 && currentChatMessages.length === 0) {
			chat.messages = persistedMessages;
		}
	}

	private resetChat() {
		persistedChatParamsState.current = {
			...(persistedChatParamsState.current ?? initialThread),
			inputValue: "",
			attachments: [],
		};
	}

	get id(): string {
		return persistedChatParamsState.current.id;
	}

	get inputValue(): string {
		return persistedChatParamsState.current.inputValue;
	}
	set inputValue(value: string) {
		persistedChatParamsState.current.inputValue = value;
	}

	get attachments(): AttachmentFile[] {
		return persistedChatParamsState.current.attachments;
	}
	set attachments(value: AttachmentFile[]) {
		persistedChatParamsState.current.attachments = value;
	}

	get messages(): ChatMessage[] {
		return chat.messages;
	}

	set messages(value: ChatMessage[]) {
		chat.messages = value;
	}

	get mcpServers(): MCPServer[] {
		return persistedChatParamsState.current.mcpServers;
	}
	set mcpServers(value: MCPServer[]) {
		persistedChatParamsState.current.mcpServers = value;
	}

	get mcpServerIds(): string[] {
		return persistedChatParamsState.current.mcpServerIds;
	}
	set mcpServerIds(value: string[]) {
		persistedChatParamsState.current.mcpServerIds = value;
	}

	get isThinkingActive(): boolean {
		return persistedChatParamsState.current.isThinkingActive;
	}
	set isThinkingActive(value: boolean) {
		persistedChatParamsState.current.isThinkingActive = value;
	}

	get reasoningEffort(): ThinkingBudgetType {
		return persistedChatParamsState.current.reasoningEffort ?? "off";
	}
	set reasoningEffort(value: ThinkingBudgetType) {
		persistedChatParamsState.current.reasoningEffort = value;
	}

	get isOnlineSearchActive(): boolean {
		return persistedChatParamsState.current.isOnlineSearchActive;
	}
	set isOnlineSearchActive(value: boolean) {
		persistedChatParamsState.current.isOnlineSearchActive = value;
	}

	get isOCRActive(): boolean {
		return persistedChatParamsState.current.isOCRActive;
	}
	set isOCRActive(value: boolean) {
		persistedChatParamsState.current.isOCRActive = value;
	}

	get isMCPActive(): boolean {
		return persistedChatParamsState.current.isMCPActive;
	}
	set isMCPActive(value: boolean) {
		persistedChatParamsState.current.isMCPActive = value;
	}

	get selectedModel(): Model | null {
		return persistedChatParamsState.current.selectedModel;
	}
	set selectedModel(value: Model | null) {
		persistedChatParamsState.current.selectedModel = value;
	}

	get isPrivateChatActive(): boolean {
		return persistedChatParamsState.current.isPrivateChatActive;
	}
	set isPrivateChatActive(value: boolean) {
		persistedChatParamsState.current.isPrivateChatActive = value;
	}

	get title(): string {
		return persistedChatParamsState.current.title;
	}
	set title(value: string) {
		persistedChatParamsState.current.title = value;
	}

	// Chat Parameters
	get temperature(): number | null {
		return persistedChatParamsState.current.temperature;
	}
	set temperature(value: number | null) {
		persistedChatParamsState.current.temperature = value;
	}

	get topP(): number | null {
		return persistedChatParamsState.current.topP;
	}
	set topP(value: number | null) {
		persistedChatParamsState.current.topP = value;
	}

	get frequencyPenalty(): number | null {
		return persistedChatParamsState.current.frequencyPenalty;
	}
	set frequencyPenalty(value: number | null) {
		persistedChatParamsState.current.frequencyPenalty = value;
	}

	get presencePenalty(): number | null {
		return persistedChatParamsState.current.presencePenalty;
	}
	set presencePenalty(value: number | null) {
		persistedChatParamsState.current.presencePenalty = value;
	}

	get maxTokens(): number | null {
		return persistedChatParamsState.current.maxTokens;
	}
	set maxTokens(value: number | null) {
		persistedChatParamsState.current.maxTokens = value;
	}

	get clearScreenMessageId(): string | undefined {
		return persistedChatParamsState.current.clearScreenMessageId;
	}
	set clearScreenMessageId(value: string | undefined) {
		persistedChatParamsState.current.clearScreenMessageId = value;
	}

	// Context compression state accessors
	get contextSummary(): string | undefined {
		return persistedChatParamsState.current.contextSummary;
	}
	set contextSummary(value: string | undefined) {
		persistedChatParamsState.current.contextSummary = value;
	}

	get compressedMessageCount(): number | undefined {
		return persistedChatParamsState.current.compressedMessageCount;
	}
	set compressedMessageCount(value: number | undefined) {
		persistedChatParamsState.current.compressedMessageCount = value;
	}

	get lastCompressionMessageId(): string | undefined {
		return persistedChatParamsState.current.lastCompressionMessageId;
	}
	set lastCompressionMessageId(value: string | undefined) {
		persistedChatParamsState.current.lastCompressionMessageId = value;
	}

	get compressionEnabled(): boolean | undefined {
		return persistedChatParamsState.current.compressionEnabled;
	}
	set compressionEnabled(value: boolean | undefined) {
		persistedChatParamsState.current.compressionEnabled = value;
	}

	providerType = $derived<string | null>(
		this.selectedModel
			? (providerState.getProvider(this.selectedModel.providerId)?.apiType ?? null)
			: null,
	);
	currentProvider = $derived<ModelProvider | null>(
		this.selectedModel ? providerState.getProvider(this.selectedModel.providerId) : null,
	);

	isStreaming = $derived(chat.status === "streaming");
	isSubmitted = $derived(chat.status === "submitted");
	isReady = $derived(chat.status === "ready");
	isError = $derived(chat.status === "error");

	sendMessageEnabled = $derived<boolean>(
		(this.inputValue.trim() !== "" || this.attachments.length > 0) &&
			!!this.selectedModel &&
			!this.isStreaming &&
			!this.isSubmitted &&
			this.loadingAttachmentIds.size === 0 && // 确保没有附件正在加载
			!this.isRenderingTaskResult, // 确保当前不在渲染后台任务
	);
	hasMessages = $derived(this.messages.length > 0);

	/**
	 * Messages visible to the user after applying clear screen filter.
	 * Messages up to and including clearScreenMessageId are hidden.
	 */
	visibleMessages = $derived.by(() => {
		const clearId = this.clearScreenMessageId;
		if (!clearId) {
			return this.messages;
		}
		const clearIndex = this.messages.findIndex((msg) => msg.id === clearId);
		if (clearIndex === -1) {
			return this.messages;
		}
		return this.messages.slice(clearIndex + 1);
	});

	/**
	 * Whether clear screen is active (has hidden messages)
	 */
	hasClearScreen = $derived(
		!!this.clearScreenMessageId &&
			this.messages.findIndex((msg) => msg.id === this.clearScreenMessageId) !== -1,
	);

	/**
	 * Whether there are visible messages (after applying clear screen filter)
	 */
	hasVisibleMessages = $derived(this.visibleMessages.length > 0);

	/**
	 * Whether context compression should be applied for this thread.
	 * Returns false when:
	 * - Global compression is disabled in preferences
	 * - Per-thread compression is explicitly disabled
	 * - Code Agent mode is enabled (needs full context)
	 * - Private chat mode is active (no persistence)
	 */
	shouldApplyCompression = $derived.by(() => {
		// Check global preference first
		if (!preferencesSettings.contextCompressionEnabled) return false;
		// Check per-thread override (explicit false disables)
		if (this.compressionEnabled === false) return false;
		// Exempt: Code Agent mode needs full context for code understanding
		if (codeAgentState.enabled) return false;
		// Exempt: Private chat mode doesn't persist, no need to compress
		if (this.isPrivateChatActive) return false;
		return true;
	});

	canTogglePrivacy = $derived(!this.hasMessages);
	canRegenerate = $derived(
		(this.isReady || this.isError) &&
			this.hasMessages &&
			!!this.selectedModel &&
			this.messages.some((msg) => msg.role === "assistant"),
	);
	lastAssistantMessage = $derived(this.messages.findLast((msg) => msg.role === "assistant"));

	isLastMessageStreaming = $derived(this.isStreaming && this.hasMessages);

	get hasError(): boolean {
		return this.lastError !== null;
	}

	get canRetry(): boolean {
		return (
			this.hasError &&
			!this.retryInProgress &&
			this.lastError !== null &&
			ChatErrorHandler.isRetryable(this.lastError) &&
			notificationState.canRetry
		);
	}

	private handleChatError = async (error: unknown) => {
		const chatError = ChatErrorHandler.createError(error, {
			provider: this.currentProvider?.name,
			model: this.selectedModel?.id,
			action: "send_message",
			retryable: true,
		});

		this.lastError = chatError;
		notificationState.setError(chatError);
		ChatErrorHandler.showErrorNotification(chatError);
	};

	private resetError = () => {
		this.lastError = null;
		notificationState.clearError();
	};

	retryLastMessage = async () => {
		if (!this.canRetry || !this.lastError) {
			return;
		}

		this.retryInProgress = true;
		notificationState.incrementRetryCount();

		try {
			const retryDelay = ChatErrorHandler.getRetryDelay(this.lastError);
			if (retryDelay > 0) {
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
			}

			this.resetError();

			if (this.hasMessages && this.messages.length > 0) {
				await this.regenerateMessage();
			}
		} catch (error) {
			this.handleChatError(error);
		} finally {
			this.retryInProgress = false;
		}
	};

	sendMessage = async (options?: { content?: string }) => {
		const contentOverride = options?.content;
		const hasContent =
			contentOverride?.trim() || this.inputValue.trim() !== "" || this.attachments.length > 0;
		const canSend =
			hasContent &&
			!!this.selectedModel &&
			!this.isStreaming &&
			!this.isSubmitted &&
			this.loadingAttachmentIds.size === 0;

		if (canSend) {
			// Cancel any pending suggestions generation to avoid race conditions
			this.cancelPendingSuggestions();
			// Cancel any pending title generation to avoid race conditions
			this.cancelPendingTitle();
			// Cancel any pending context summary generation to avoid race conditions
			this.cancelPendingSummary();

			try {
				const currentModel = this.selectedModel!;
				const currentAttachments = [...this.attachments];
				const currentInputValue = contentOverride ?? this.inputValue;

				// Ensure session association is recorded for tabs created at app boot
				// (boot-created initial tabs may not have apiKeyHash until the first real send)
				if (currentModel.providerId === "302AI") {
					persistedChatParamsState.current.apiKeyHash = this.get302AIApiKeyHash();
				}

				this.resetError();

				const codeAgentEnabled = codeAgentState.enabled;

				if (codeAgentEnabled) {
					const workspacePath = codeAgentState.currentWorkspacePath;
					if (currentAttachments.length > 0 && !workspacePath) {
						toast.error(m.taskboard_error_attachment_upload_failed());
						return;
					}

					// Agent mode: attachments will be uploaded by backend before sending to AI provider.
					// Only send metadata for UI preview, no content in message parts.
					const attachmentMetadata = currentAttachments.map((att) => ({
						id: att.id,
						name: att.name,
						type: att.type,
						size: att.size,
						preview: att.preview,
						filePath: att.filePath,
					}));

					chat.sendMessage(
						{
							text: currentInputValue,
							metadata: { attachments: attachmentMetadata },
						},
						{
							body: {
								model: currentModel.id,
								apiKey: this.getApiKey(currentModel.providerId),
							},
						},
					);
				} else {
					const { parts: attachmentParts, metadataList: attachmentMetadata } =
						await convertAttachmentsToMessageParts(currentAttachments, {
							enableZipSupport: false,
						});

					const textParts = attachmentParts.filter(
						(part): part is { type: "text"; text: string } => part.type === "text",
					);
					const fileParts = attachmentParts.filter(
						(part): part is import("ai").FileUIPart => part.type === "file",
					);

					if (fileParts.length > 0 && textParts.length > 0) {
						const fileContent = textParts.map((part) => part.text).join("\n\n");

						chat.sendMessage(
							{
								parts: [
									...fileParts,
									{ type: "text" as const, text: fileContent },
									{ type: "text" as const, text: currentInputValue },
								],
								metadata: {
									attachments: attachmentMetadata,
									fileContentPartIndex: fileParts.length,
								},
							},
							{
								body: {
									model: currentModel.id,
									apiKey: this.getApiKey(currentModel.providerId),
								},
							},
						);
					} else if (fileParts.length > 0) {
						chat.sendMessage(
							{
								text: currentInputValue,
								files: fileParts,
								metadata: { attachments: attachmentMetadata },
							},
							{
								body: {
									model: currentModel.id,
									apiKey: this.getApiKey(currentModel.providerId),
								},
							},
						);
					} else if (textParts.length > 0) {
						const fileContent = textParts.map((part) => part.text).join("\n\n");

						chat.sendMessage(
							{
								parts: [
									{ type: "text" as const, text: fileContent },
									{ type: "text" as const, text: currentInputValue },
								],
								metadata: {
									attachments: attachmentMetadata,
									fileContentPartIndex: 0,
								},
							},
							{
								body: {
									model: currentModel.id,
									apiKey: this.getApiKey(currentModel.providerId),
								},
							},
						);
					} else {
						chat.sendMessage(
							{ text: currentInputValue },
							{
								body: {
									model: currentModel.id,
									apiKey: this.getApiKey(currentModel.providerId),
								},
							},
						);
					}
				}

				await threadService.addThread(threadId);

				await broadcastService.broadcastToAll("thread-list-updated", { threadId });

				if (!contentOverride) {
					this.resetChat();
				}
			} catch (error) {
				this.handleChatError(error);
			}
		}
	};

	regenerateMessage = async (messageId?: string) => {
		if (!this.canRegenerate) {
			logger.warn("Cannot regenerate: chat is not ready or no model selected");
			return;
		}

		// For local mode, ensure sandbox is running before regenerating
		if (codeAgentState.enabled) {
			if (codeAgentState.type === "local") {
				const result = await localEnvState.ensureSandboxRunning();
				if (!result.isOk) {
					toast.error(result.error ?? m.code_agent_local_sandbox_start_failed());
					return;
				}
				// Update localBaseUrl with the port
				if (result.port) {
					codeAgentState.localBaseUrl = `http://localhost:${result.port}/api/v1`;
				}
				// Show success toast only when actually started (not already running)
				if (!result.wasAlreadyRunning) {
					toast.success(m.code_agent_local_sandbox_started());
				}
			} else if (codeAgentState.type === "cloud") {
				if (cloudModeState.state.status === "running") {
					const { baseUrl } =
						await window.electronAPI.cloudModeService.getCloudModeInstanceBaseUrlByIpc();
					codeAgentState.cloudBaseUrl = baseUrl + "/api/v1";
				} else {
					toast.error(m.code_agent_cloud_instance_not_running());
				}
			}
		}

		// Cancel any pending suggestions generation to avoid race conditions
		this.cancelPendingSuggestions();
		// Cancel any pending title generation to avoid race conditions
		this.cancelPendingTitle();
		// Cancel any pending context summary generation to avoid race conditions
		this.cancelPendingSummary();

		const currentModel = this.selectedModel!;

		try {
			this.resetError();

			let regenerateMessageId = messageId;

			// If messageId is provided, remove messages to prevent duplicates when regenerating
			if (messageId) {
				const messageIndex = this.messages.findIndex((msg) => msg.id === messageId);
				if (messageIndex !== -1) {
					const message = this.messages[messageIndex];

					if (message.role === "assistant") {
						// If regenerating an assistant message, find the previous user message
						// and remove the assistant message and all messages after it
						let userMessageId: string | undefined;
						for (let i = messageIndex - 1; i >= 0; i--) {
							if (this.messages[i].role === "user") {
								userMessageId = this.messages[i].id;
								break;
							}
						}

						// Remove the assistant message and all messages after it
						const messagesToKeep = this.messages.slice(0, messageIndex);
						chat.messages = messagesToKeep;
						persistedMessagesState.current = messagesToKeep;

						// Use the user message ID for regeneration
						regenerateMessageId = userMessageId;
					} else if (message.role === "user") {
						// If regenerating a user message, remove all messages after it (including assistant messages)
						const messagesToKeep = this.messages.slice(0, messageIndex + 1);
						const messagesAfter = this.messages.slice(messageIndex + 1);
						const hasAssistantAfter = messagesAfter.some(
							(msg) => msg.role === "assistant",
						);

						if (hasAssistantAfter) {
							chat.messages = messagesToKeep;
							persistedMessagesState.current = messagesToKeep;
						}
					}
				}
			}

			await chat.regenerate({
				...(regenerateMessageId && { messageId: regenerateMessageId }),
				body: {
					model: currentModel.id,
					apiKey: this.getApiKey(currentModel.providerId),
				},
			});
		} catch (error) {
			logger.error("Failed to regenerate message:", error);
			this.handleChatError(error);
		}
	};

	stopGeneration = () => {
		if (
			codeAgentTaskboardState.taskboardStatus === "running" ||
			codeAgentTaskboardState.taskboardStatus === "waiting_to_stop"
		) {
			codeAgentTaskboardState.stopExecution();
		}
		chat.stop();
	};

	clearMessages() {
		this.messages = [];
		persistedMessagesState.current = [];
	}

	/**
	 * Clear screen by marking the last message as the clear point.
	 * Messages up to and including this message will be hidden from view,
	 * but preserved in history.
	 */
	clearScreen() {
		const lastMessage = this.messages[this.messages.length - 1];
		if (lastMessage) {
			this.clearScreenMessageId = lastMessage.id;
		}
	}

	/**
	 * Restore all hidden messages by removing the clear screen marker.
	 */
	restoreClearScreen() {
		this.clearScreenMessageId = undefined;
	}

	updateMessage(messageId: string, content: string) {
		const updatedMessages = this.messages.map((msg) => {
			if (msg.id === messageId) {
				return {
					...msg,
					parts: msg.parts.map((part) =>
						part.type === "text" ? { ...part, text: content } : part,
					),
				};
			}
			return msg;
		});

		chat.messages = updatedMessages;
	}

	updateMessageFeedback(messageId: string, feedback: "like" | "dislike" | null) {
		const updatedMessages = this.messages.map((msg) => {
			if (msg.id === messageId) {
				return {
					...msg,
					metadata: {
						...msg.metadata,
						feedback: feedback || undefined,
					},
				};
			}
			return msg;
		});

		chat.messages = updatedMessages;
		persistedMessagesState.current = updatedMessages;
	}

	updateMessageCodeBlock(
		messageId: string,
		messagePartIndex: number,
		blockId: string,
		code: string,
		language?: string | null,
		meta?: string | null,
	) {
		const blockIndex = Number(blockId.replace("code-", ""));
		if (!Number.isFinite(blockIndex) || Number.isNaN(blockIndex)) {
			return false;
		}

		const messageIndex = this.messages.findIndex((msg) => msg.id === messageId);
		if (messageIndex === -1) {
			return false;
		}

		const targetMessage = this.messages[messageIndex];
		const targetPart = targetMessage.parts?.[messagePartIndex];
		if (!targetPart || targetPart.type !== "text") {
			return false;
		}

		const updatedContent = replaceCodeBlockAt(targetPart.text, blockIndex, {
			code,
			language,
			meta,
		});

		if (updatedContent === null) {
			return false;
		}

		const updatedMessages = this.messages.map((msg, idx) => {
			if (idx !== messageIndex) {
				return msg;
			}
			return {
				...msg,
				parts: msg.parts.map((part, partIdx) => {
					if (partIdx === messagePartIndex && part.type === "text") {
						return {
							...part,
							text: updatedContent,
						};
					}
					return part;
				}),
			};
		});

		chat.messages = updatedMessages;
		persistedMessagesState.current = updatedMessages;
		return true;
	}

	deleteMessage(messageId: string) {
		const updatedMessages = this.messages.filter((msg) => msg.id !== messageId);
		chat.messages = updatedMessages;
		persistedMessagesState.current = updatedMessages;
	}

	rerunToolCall = async (messageId: string, toolCallId: string) => {
		if (!this.canRegenerate) {
			logger.warn("Cannot rerun tool: chat is not ready or no model selected");
			return;
		}

		const messageIndex = this.messages.findIndex((msg) => msg.id === messageId);
		if (messageIndex === -1) {
			throw new Error("Message not found");
		}

		const message = this.messages[messageIndex];
		if (!message) {
			throw new Error("Message not found");
		}

		const toolCallPartIndex = message.parts.findIndex(
			(part) => part.type === "dynamic-tool" && part.toolCallId === toolCallId,
		);

		if (toolCallPartIndex === -1) {
			throw new Error("Tool call not found");
		}
		const updatedParts = message.parts.slice(0, toolCallPartIndex);
		const updatedMessage = { ...message, parts: updatedParts };
		const updatedMessages = [...this.messages.slice(0, messageIndex), updatedMessage];

		chat.messages = updatedMessages;
		persistedMessagesState.current = updatedMessages;

		const currentModel = this.selectedModel!;

		try {
			this.resetError();
			await chat.sendMessage(undefined, {
				body: {
					model: currentModel.id,
					apiKey: this.getApiKey(currentModel.providerId),
				},
			});
		} catch (error) {
			logger.error("Failed to rerun tool call:", error);
			this.handleChatError(error);
		}
	};

	async generateTitleManually(): Promise<void> {
		const titleModel = preferencesSettings.titleGenerationModel;

		if (!titleModel) {
			logger.warn("No title generation model configured");
			toast.warning(m.toast_no_title_generation_model());
			return;
		}

		if (this.messages.length < 2) {
			logger.warn("Not enough messages to generate title");
			toast.warning(m.toast_empty_message());
			return;
		}

		try {
			this.isGeneratingTitle = true;
			const provider = persistedProviderState.current.find(
				(p) => p.id === titleModel.providerId,
			);
			const serverPort = window.app?.serverPort ?? 8089;

			// Get previous summary and determine if first generation
			const previousSummary = persistedChatParamsState.current.incrementalSummary;
			const isFirstGeneration = this.messages.length === 2;

			// Prepare messages for incremental generation
			let messagesToSend: ChatMessage[];
			if (isFirstGeneration) {
				// First generation: only send the first user message
				messagesToSend = this.messages.filter((m) => m.role === "user").slice(0, 1);
			} else {
				// Incremental: send previous assistant message + latest user message
				const userMessages = this.messages.filter((m) => m.role === "user");
				const assistantMessages = this.messages.filter((m) => m.role === "assistant");
				const lastUserMsg = userMessages.at(-1);
				const prevAssistantMsg = assistantMessages.at(-1);
				messagesToSend = [prevAssistantMsg, lastUserMsg].filter(Boolean) as ChatMessage[];
			}

			// 准备兜底配置：如果 provider 未配置，使用当前聊天模型
			let fallbackConfig: FallbackModelConfig | undefined;
			if (!provider && this.selectedModel && this.currentProvider) {
				fallbackConfig = {
					model: this.selectedModel,
					provider: this.currentProvider,
				};
			}

			const result = await generateTitle(
				messagesToSend,
				titleModel,
				provider,
				serverPort,
				previousSummary,
				isFirstGeneration,
				fallbackConfig,
			);

			if (result) {
				persistedChatParamsState.current.title = result.title;
				persistedChatParamsState.current.incrementalSummary = result.summary;
				await tabBarState.updateTabTitle(persistedChatParamsState.current.id, result.title);

				// Force flush to ensure all changes are persisted before broadcasting
				persistedChatParamsState.flush();

				// Broadcast update event to trigger sidebar refresh
				await broadcastService.broadcastToAll("thread-list-updated", {});

				// 如果是 code agent 类型，同步备注到 302.AI
				// 使用 handleThreadTitleUpdated 以正确检查 isManualNote 标志
				if (codeAgentState.enabled) {
					try {
						await codeAgentState.handleThreadTitleUpdated({ title: result.title });
						logger.info("Session note synced to 302.AI");
					} catch (syncError) {
						logger.error("Failed to sync session note:", syncError);
						// 不阻塞主流程，只记录错误
					}
				}

				toast.success(m.toast_title_generation_success());
			} else {
				toast.error(m.toast_title_generation_failed());
			}
		} catch (error) {
			logger.error("Failed to generate title manually:", error);
			toast.error(m.toast_title_generation_failed());
		} finally {
			this.isGeneratingTitle = false;
		}
	}

	/**
	 * Get the API key for a specific provider
	 */
	getApiKey(providerId: string): string | undefined {
		// const codeAgentEnabled = codeAgentState.enabled;
		// if (codeAgentEnabled) {
		// 	return codeAgentGlobalConfigsState.apiKey;
		// }

		const apiKey = persistedProviderState.current.find((p) => p.id === providerId)?.apiKey;
		return apiKey;
	}

	/**
	 * Get the current 302.AI provider's API key hash for session tracking
	 */
	private get302AIApiKeyHash(): string | undefined {
		const provider = providerState.getProvider("302AI");
		return hashApiKey(provider?.apiKey);
	}

	async createBranch(upToMessageId: string): Promise<string | null> {
		try {
			// 1. find the target message index
			const messageIndex = this.messages.findIndex((msg) => msg.id === upToMessageId);
			if (messageIndex === -1) {
				logger.error("Message not found:", upToMessageId);
				return null;
			}

			// 2. slice messages
			const branchMessages = clone(this.messages.slice(0, messageIndex + 1));

			// 3. generate threadId
			const newThreadId = nanoid();

			// 4. clone thread data
			const newThread: ThreadParmas = clone({
				id: newThreadId,
				title: `${this.title}`,
				inputValue: "",
				attachments: [],
				mcpServers: this.mcpServers,
				mcpServerIds: persistedChatParamsState.current.mcpServerIds || [],
				isThinkingActive: this.isThinkingActive,
				isOnlineSearchActive: this.isOnlineSearchActive,
				isOCRActive: this.isOCRActive,
				isMCPActive: this.isMCPActive,
				isPrivateChatActive: this.isPrivateChatActive,
				selectedModel: this.selectedModel,
				temperature: this.temperature,
				topP: this.topP,
				maxTokens: this.maxTokens,
				frequencyPenalty: this.frequencyPenalty,
				presencePenalty: this.presencePenalty,
				reasoningEffort: this.reasoningEffort,
				updatedAt: new Date(),
				apiKeyHash: this.get302AIApiKeyHash(),
			});

			// 5. save thread data
			await storageService.setItem(`app-thread:${newThreadId}`, newThread);
			await storageService.setItem(`app-chat-messages:${newThreadId}`, branchMessages);

			// 6. add to thread list
			await threadService.addThread(newThreadId);

			// 7. broadcast thread list update
			await broadcastService.broadcastToAll("thread-list-updated", {});

			return newThreadId;
		} catch (error) {
			logger.error("Failed to create branch:", error);
			return null;
		}
	}

	async createBranchAndSend(
		upToMessageId: string,
		userInput: string,
		userAttachments: AttachmentFile[],
	): Promise<string | null> {
		try {
			// 1. find the target message index
			const messageIndex = this.messages.findIndex((msg) => msg.id === upToMessageId);
			if (messageIndex === -1) {
				logger.error("Message not found:", upToMessageId);
				return null;
			}

			// 2. slice messages up to and including the target message
			const branchMessages = clone(this.messages.slice(0, messageIndex + 1));

			// 3. convert attachments to message parts
			const { parts: attachmentParts, metadataList: attachmentMetadata } =
				await convertAttachmentsToMessageParts(userAttachments, {
					enableZipSupport: codeAgentState.enabled,
				});

			// 4. Separate text and file parts
			const textParts = attachmentParts.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			);
			const fileParts = attachmentParts.filter(
				(part): part is import("ai").FileUIPart => part.type === "file",
			);

			// 5. Build message parts array - always include at least the user input as a text part
			let messageParts: MessagePart[] = [];
			let fileContentPartIndex: number | undefined = undefined;

			if (fileParts.length > 0 && textParts.length > 0) {
				// Has both files and text content from files
				const fileContent = textParts.map((part) => part.text).join("\n\n");
				messageParts = [
					...fileParts,
					{ type: "text" as const, text: fileContent },
					{ type: "text" as const, text: userInput },
				];
				fileContentPartIndex = fileParts.length;
			} else if (fileParts.length > 0) {
				// Has only files
				messageParts = [...fileParts, { type: "text" as const, text: userInput }];
			} else if (textParts.length > 0) {
				// Has only text content from files
				const fileContent = textParts.map((part) => part.text).join("\n\n");
				messageParts = [
					{ type: "text" as const, text: fileContent },
					{ type: "text" as const, text: userInput },
				];
				fileContentPartIndex = 0;
			} else {
				// No attachments, just user input
				messageParts = [{ type: "text" as const, text: userInput }];
			}

			// 6. Create user message with proper structure
			const userMessage: ChatMessage = {
				id: nanoid(),
				role: "user",
				parts: messageParts,
				metadata: {
					createdAt: new Date().toISOString(),
					attachments: attachmentMetadata,
					...(fileContentPartIndex !== undefined && { fileContentPartIndex }),
				},
			};

			// 7. add user message to branch messages
			branchMessages.push(userMessage);

			// 8. generate threadId
			const newThreadId = nanoid();

			// 9. clone thread data with autoSendOnLoad flag
			const newThread: ThreadParmas = clone({
				id: newThreadId,
				title: `${this.title}`,
				inputValue: "", // Keep input empty
				attachments: [], // Keep attachments empty
				mcpServers: this.mcpServers,
				mcpServerIds: persistedChatParamsState.current.mcpServerIds || [],
				isThinkingActive: this.isThinkingActive,
				isOnlineSearchActive: this.isOnlineSearchActive,
				isOCRActive: this.isOCRActive,
				isMCPActive: this.isMCPActive,
				isPrivateChatActive: this.isPrivateChatActive,
				selectedModel: this.selectedModel,
				temperature: this.temperature,
				topP: this.topP,
				maxTokens: this.maxTokens,
				frequencyPenalty: this.frequencyPenalty,
				presencePenalty: this.presencePenalty,
				reasoningEffort: this.reasoningEffort,
				updatedAt: new Date(),
				autoSendOnLoad: true, // Set flag to trigger AI reply on load
				apiKeyHash: this.get302AIApiKeyHash(),
			});

			// 8. save thread data and messages
			await storageService.setItem(`app-thread:${newThreadId}`, newThread);
			await storageService.setItem(`app-chat-messages:${newThreadId}`, branchMessages);

			// 9. add to thread list
			await threadService.addThread(newThreadId);

			// 10. broadcast thread list update
			await broadcastService.broadcastToAll("thread-list-updated", {});

			return newThreadId;
		} catch (error) {
			logger.error("Failed to create branch and send:", error);
			return null;
		}
	}

	addAttachment(attachment: AttachmentFile) {
		this.attachments = [...this.attachments, attachment];
		if (codeAgentState.enabled) {
			this.inputValue = addAttachmentReference(this.inputValue, attachment.name);
		}
	}

	addAttachments(attachments: AttachmentFile[]) {
		this.attachments = [...this.attachments, ...attachments];
		if (codeAgentState.enabled) {
			for (const attachment of attachments) {
				this.inputValue = addAttachmentReference(this.inputValue, attachment.name);
			}
		}
	}

	updateAttachment(id: string, updates: Partial<AttachmentFile>) {
		this.attachments = this.attachments.map((att) =>
			att.id === id ? { ...att, ...updates } : att,
		);
	}

	removeAttachment(id: string) {
		if (codeAgentState.enabled) {
			const attachment = this.attachments.find((att) => att.id === id);
			if (attachment) {
				this.inputValue = removeAttachmentReference(this.inputValue, attachment.name);
			}
		}
		this.attachments = this.attachments.filter((att) => att.id !== id);
		// Also remove from loading state if present
		this.loadingAttachmentIds.delete(id);
	}

	setAttachmentLoading(id: string, isLoading: boolean) {
		if (isLoading) {
			this.loadingAttachmentIds.add(id);
		} else {
			this.loadingAttachmentIds.delete(id);
		}
	}

	isAttachmentLoading(id: string): boolean {
		return this.loadingAttachmentIds.has(id);
	}

	handleThinkingActiveChange(active: boolean) {
		this.isThinkingActive = active;
	}

	handleReasoningEffortChange(effort: ThinkingBudgetType) {
		this.reasoningEffort = effort;
	}

	handleOnlineSearchActiveChange(active: boolean) {
		this.isOnlineSearchActive = active;
	}

	handleOCRActiveChange(active: boolean) {
		this.isOCRActive = active;
	}

	handleMCPActiveChange(active: boolean) {
		this.isMCPActive = active;
	}

	handleMCPServerIdsChange(serverIds: string[]) {
		this.mcpServerIds = serverIds;
	}

	/**
	 * Update MCP server IDs and active state in a single operation to avoid race conditions
	 */
	handleMCPServerChange(serverIds: string[]) {
		persistedChatParamsState.current = {
			...persistedChatParamsState.current,
			mcpServerIds: serverIds,
			isMCPActive: serverIds.length > 0,
		};
	}

	handleSelectedModelChange(model: Model | null) {
		this.selectedModel = model;
	}

	handlePrivateChatActiveChange(active: boolean) {
		this.isPrivateChatActive = active;
	}

	handleSearchInputStateChange(value: boolean) {
		this._isSearchInput = value;
	}

	get isSearchInput() {
		return this._isSearchInput;
	}

	handleTemperatureChange(value: number | null) {
		this.temperature = value;
	}

	handleTopPChange(value: number | null) {
		this.topP = value;
	}

	handleFrequencyPenaltyChange(value: number | null) {
		this.frequencyPenalty = value;
	}

	handlePresencePenaltyChange(value: number | null) {
		this.presencePenalty = value;
	}

	handleMaxTokensChange(value: number | null) {
		this.maxTokens = value;
	}

	private async processNextTaskResult() {
		if (this.pendingTaskResults.length === 0 || this.isRenderingTaskResult) return;
		this.isRenderingTaskResult = true;

		try {
			const newMessages: ChatMessage[] = [];
			const cronJobRecords: { job_id: string; ts: number }[] = [];

			while (this.pendingTaskResults.length > 0) {
				const runsArray = this.pendingTaskResults.shift();
				if (!runsArray || !Array.isArray(runsArray)) continue;

				for (const run of runsArray) {
					const taskMsg: ChatMessage = {
						id: nanoid(),
						role: "assistant",
						parts: [{ type: "text" as const, text: run.summary ?? run.error }],
						metadata: {
							createdAt: new Date(run.ts).toISOString(),
							isOCCronJobResult: true,
							OCCronJobRunData: run,
							model: "openclaw",
						},
					};
					newMessages.push(taskMsg);
					cronJobRecords.push({ job_id: run.jobId, ts: run.ts });
				}
			}

			if (newMessages.length > 0) {
				this.messages = [...this.messages, ...newMessages];
				persistedMessagesState.current = this.messages;

				// Sync processed cron job records to backend
				try {
					await pushOpenClawCronJobRecord({ items: cronJobRecords });
				} catch (error) {
					logger.error("failed to push cron job records:", error);
				}

				logger.info(
					`[CronPoll] successfully merged ${newMessages.length} cron job results`,
				);
			}
		} catch (error) {
			logger.error("failed to merge cron job results:", error);
		} finally {
			this.isRenderingTaskResult = false;
		}
	}
}

export const chatState = new ChatState();

export const chat = new Chat({
	messages: persistedMessagesState.current,
	transport: new DynamicChatTransport<ChatMessage>({
		api: () => {
			const port = window.app?.serverPort ?? 8089;

			const codeAgentEnabled = codeAgentState.enabled;

			switch (chatState.currentProvider?.apiType) {
				case "302ai": {
					if (codeAgentEnabled) {
						return `http://localhost:${port}/chat/302ai-code-agent`;
					}
					return `http://localhost:${port}/chat/302ai`;
				}
				case "openai":
					return `http://localhost:${port}/chat/openai`;
				case "anthropic":
					return `http://localhost:${port}/chat/anthropic`;
				case "gemini":
					return `http://localhost:${port}/chat/gemini`;
				default:
					return `http://localhost:${port}/chat/302`;
			}
		},
		body: () => {
			const codeAgentEnabled = codeAgentState.enabled;
			const currentAgentId = codeAgentState.currentAgentId;
			const sessionId = codeAgentEnabled
				? (() => {
						if (codeAgentState.currentSessionId) {
							return codeAgentState.currentSessionId;
						}

						// Fallback: If no session exists, generate a new one
						// This should rarely happen if the flow is controlled correctly
						const newSessionId = nanoid();
						codeAgentState.updateCurrentSessionId(newSessionId);
						return newSessionId;
					})()
				: "";

			// Debug log for OpenClaw agent type
			if (codeAgentEnabled && currentAgentId === "open-claw") {
				logger.debug("[ChatTransport] OpenClaw mode detected, setting agentType=1", {
					codeAgentEnabled,
					currentAgentId,
				});
			}

			return {
				baseUrl: codeAgentEnabled
					? codeAgentState.codeAgentCfgs.baseUrl
					: chatState.currentProvider?.baseUrl,
				temperature: persistedChatParamsState.current.temperature,
				maxTokens: persistedChatParamsState.current.maxTokens,
				frequencyPenalty: persistedChatParamsState.current.frequencyPenalty,
				presencePenalty: persistedChatParamsState.current.presencePenalty,

				isThinkingActive: persistedChatParamsState.current.isThinkingActive,
				isOnlineSearchActive: persistedChatParamsState.current.isOnlineSearchActive,
				isOCRActive: persistedChatParamsState.current.isOCRActive,
				isMCPActive: persistedChatParamsState.current.isMCPActive,
				mcpServerIds: persistedChatParamsState.current.mcpServerIds,
				reasoningEffort: persistedChatParamsState.current.reasoningEffort,

				autoParseUrl: preferencesSettings.autoParseUrl,
				searchProvider: preferencesSettings.searchProvider,

				speedOptions: {
					enabled: preferencesSettings.streamOutputEnabled,
					speed: preferencesSettings.streamSpeed,
				},

				language: generalSettings.language,

				threadId,
				sessionId,
				sandboxName: codeAgentState.sandboxRemark,

				// Resolved system prompt with variables substituted
				// Note: input variable is not supported for system prompts
				systemPrompt: (() => {
					if (!chatParameters.systemPromptContent) return undefined;

					const result = resolvePrompt(chatParameters.systemPromptContent, {
						modelId: chatState.selectedModel?.id ?? "",
						language: generalSettings.language,
						cachedMap: chatParameters.systemPromptMap,
						variables: chatParameters.systemPromptVariables,
					});

					// Update cache with newly computed values
					if (Object.keys(result.updatedMap).length > 0) {
						chatParameters.updateSystemPromptMap(result.updatedMap);
					}

					return result.content;
				})(),

				autoDeploy: codeAgentGlobalConfigsState.autoDeploy,
				skills: codeAgentState.skills,
				isCreateSkillMode: chatState.isCreateSkillMode,
				inPlanMode: codeAgentEnabled && codeAgentState.inPlanMode,
				thinkingBudget: codeAgentEnabled && codeAgentState.thinkingBudget,

				inTaskOrchestrationMode:
					codeAgentEnabled && codeAgentTaskboardState.taskboardStatus === "running",
				workspacePath: codeAgentEnabled && codeAgentState.currentWorkspacePath,
				vibeMode: codeAgentEnabled && codeAgentState.type,
				// Context compression (only sent when compression is active)
				...(chatState.shouldApplyCompression &&
					chatState.contextSummary && {
						contextSummary: chatState.contextSummary,
						compressedMessageCount: chatState.compressedMessageCount ?? 0,
					}),
				// OpenClaw agent type - use captured currentAgentId to ensure correct value
				...(codeAgentEnabled && currentAgentId === "open-claw" && { agentType: 1 }),
			};
		},
	}),
	onError: (error) => {
		logger.error("", error);
	},
	onFinish: async ({ messages, isAbort, isDisconnect, isError }) => {
		const { messages: updatedMessages, onFinishStartTime } = await onChatFinishPrePersist({
			messages,
			isAbort,
			isDisconnect,
			isError,
			chatState,
			codeAgentEnabled: codeAgentState.enabled,
			autoDeploy: codeAgentGlobalConfigsState.autoDeploy,
		});

		persistedMessagesState.current = updatedMessages;

		await onChatFinishPostPersist({
			messages,
			chatState,
			persistedChatParamsState,
			persistedMessagesState,
			onFinishStartTime,
		});
	},
});
