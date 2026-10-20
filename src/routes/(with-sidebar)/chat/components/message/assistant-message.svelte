<script lang="ts" module>
	export type AssistantMessage = ChatMessage & {
		role: "assistant";
	};

	interface Props {
		message: AssistantMessage;
	}
</script>

<script lang="ts">
	import { ButtonWithTooltip } from "$lib/components/buss/button-with-tooltip";
	import { LdrsLoader } from "$lib/components/buss/ldrs-loader/index.js";
	import {
		copyImageToClipboard,
		downloadImage,
	} from "$lib/components/buss/markdown/download-utils";
	import { MarkdownRenderer } from "$lib/components/buss/markdown/index.js";
	import { ModelIcon } from "$lib/components/buss/model-icon/index.js";
	import library from "$lib/openui/library.runtime";
	import OPENUI_SYSTEM_PROMPT from "$lib/openui/system-prompt";
	import { Renderer } from "@openuidev/svelte-lang";
	import { m } from "$lib/paraglide/messages.js";
	import { getLocale } from "$lib/paraglide/runtime";
	import { chatParameters } from "$lib/stores/chat-paramters/chat-parameters.svelte";
	import { chatState } from "$lib/stores/chat-state.svelte";
	import { mcpState } from "$lib/stores/mcp-state.svelte";
	import { preferencesSettings } from "$lib/stores/preferences-settings.state.svelte";
	import { tabBarState } from "$lib/stores/tab-bar-state.svelte";
	import { persistedThemeState } from "$lib/stores/theme.state.svelte";
	import type { ChatMessage } from "$lib/types/chat";
	import {
		MessageSquareShare,
		Server,
		ThumbsDown,
		ThumbsUp,
		Volume2,
		VolumeX,
	} from "@lucide/svelte";
	import { createLogger } from "@shared/logger";
	import type { DynamicToolUIPart } from "ai";
	import { onDestroy } from "svelte";
	import { toast } from "svelte-sonner";
	import AssistantReasoningItem from "./assistant-reasoning-item.svelte";
	import {
		AskUserQuestionCard,
		ClaudeCodeToolCard,
		McpToolCard,
		SkillCard,
		TodoWriteCard,
		WriteCard,
		extractMcpToolInfo,
		extractToolNameFromType,
		isClaudeCodeTool,
		isClaudeCodeToolType,
		isMcpToolType,
	} from "./claude-code-tools";
	import AgentTaskFiles from "./code-agent/agent-task-files.svelte";
	import AgentTaskResult from "./code-agent/agent-task-result.svelte";
	import ExportDialog from "./export-dialog.svelte";
	import MessageActions from "./message-actions.svelte";
	import MessageContextMenu from "./message-context-menu.svelte";
	import ToolCallModal from "./tool-call-modal.svelte";
	import { formatTimeAgo, getAssistantMessageContent } from "./utils";

	const logger = createLogger("ui");

	let { message }: Props = $props();

	let selectedToolPart = $state<DynamicToolUIPart | null>(null);
	let isToolModalOpen = $state(false);
	let isExportDialogOpen = $state(false);
	let isReading = $state(false);
	let _currentUtterance: SpeechSynthesisUtterance | null = null;
	let _isUserCancelled = $state(false);
	let speechSynthesisAvailable = $state(false);

	// Extract thinking content from <think>...</think> or incomplete think tags
	function extractThinkingFromText(text: string) {
		const endIdx = text.indexOf("</think>");
		if (endIdx === -1) return null;

		const startIdx = text.indexOf("<think>");
		const reasoningStart = startIdx === -1 ? 0 : startIdx;
		const reasoningEnd = endIdx + "</think>".length;
		const reasoning = text
			.substring(reasoningStart, reasoningEnd)
			.replace(/<\/?think>/g, "")
			.trim();

		if (!reasoning) return null;

		const before = startIdx === -1 ? "" : text.substring(0, startIdx);
		const after = text.substring(reasoningEnd);

		return { reasoning, before, after };
	}

	// Extract and inject reasoning parts from <think>...</think> or incomplete think tags
	const messagePartsWithExtractedReasoning = $derived(() => {
		// Check if any text part contains think tags that need extraction
		const hasThinkTagsInText = message.parts.some(
			(part) =>
				part.type === "text" &&
				"text" in part &&
				(part.text.includes("<think>") || part.text.includes("</think>")),
		);

		// If no think tags in text parts, return original parts
		if (!hasThinkTagsInText) {
			return message.parts;
		}

		const newParts: typeof message.parts = [];

		for (const part of message.parts) {
			if (part.type === "text" && "text" in part) {
				const extracted = extractThinkingFromText(part.text);
				if (!extracted) {
					newParts.push(part);
					continue;
				}

				if (extracted.before.trim()) {
					newParts.push({ type: "text", text: extracted.before });
				}
				newParts.push({ type: "reasoning", text: extracted.reasoning });
				if (extracted.after.trim()) {
					newParts.push({ type: "text", text: extracted.after });
				}
			} else {
				newParts.push(part);
			}
		}

		return newParts;
	});

	// Extract suggestions from message parts
	const suggestions = $derived(() => {
		const suggestionPart = message.parts.find((part) => part.type === "data-suggestions");

		if (suggestionPart && "data" in suggestionPart && suggestionPart.data) {
			const data = suggestionPart.data as { suggestions?: string[] };
			return data.suggestions || [];
		}
		return [];
	});

	// Update getAssistantMessageContent to use extracted reasoning
	const assistantMessageContent = $derived(
		getAssistantMessageContent({ ...message, parts: messagePartsWithExtractedReasoning() }),
	);

	function getServerIcon(toolName: string): string | null {
		// Extract server ID from toolName (format: toolName__serverId)
		const parts = toolName.split("__");
		if (parts.length >= 2) {
			const serverId = parts[parts.length - 1];
			const server = mcpState.getServer(serverId);
			return server?.icon || null;
		}

		return null;
	}

	function getServerName(toolName: string): string {
		// Extract server ID from toolName (format: toolName__serverId)
		const parts = toolName.split("__");
		if (parts.length >= 2) {
			const serverId = parts[parts.length - 1];
			const server = mcpState.getServer(serverId);
			return server?.name || m.tool_call_label();
		}

		return m.tool_call_label();
	}

	function getDisplayToolName(toolName: string): string {
		// Remove server ID suffix from display name
		const parts = toolName.split("__");
		return parts.length >= 2 ? parts.slice(0, -1).join("__") : toolName;
	}

	// Check if speech synthesis is available
	$effect(() => {
		if (typeof window !== "undefined" && window.speechSynthesis) {
			// Try to get voices to check availability
			const checkVoices = () => {
				const voices = window.speechSynthesis.getVoices();
				if (voices.length > 0) {
					speechSynthesisAvailable = true;
					logger.debug("Speech synthesis available with", voices.length, "voices");
				}
			};

			checkVoices();
			window.speechSynthesis.onvoiceschanged = checkVoices;
		}
	});

	const isCurrentMessageStreaming = $derived(
		chatState.isLastMessageStreaming && chatState.lastAssistantMessage?.id === message.id,
	);

	const isLastAssistantMessage = $derived(chatState.lastAssistantMessage?.id === message.id);

	const hasReasoningContent = $derived(
		messagePartsWithExtractedReasoning().some((part) => part.type === "reasoning"),
	);
	const hasTextContent = $derived(
		messagePartsWithExtractedReasoning().some((part) => part.type === "text"),
	);
	const isStreamingReasoning = $derived(
		isCurrentMessageStreaming && hasReasoningContent && !hasTextContent,
	);
	const isStreamingText = $derived(
		isCurrentMessageStreaming && (hasTextContent || (!hasReasoningContent && !hasTextContent)),
	);
	const isOpenUIMessage = $derived(chatParameters.systemPromptContent === OPENUI_SYSTEM_PROMPT);

	async function handleCopyMessage() {
		try {
			await navigator.clipboard.writeText(assistantMessageContent);
			toast.success(m.toast_copied_success());
		} catch {
			toast.error(m.toast_copied_failed());
		}
	}

	function handleRegenerate() {
		chatState.regenerateMessage(message.id);
	}

	function handleDelete() {
		chatState.deleteMessage(message.id);
	}

	async function handleCreateBranch() {
		try {
			const newThreadId = await chatState.createBranch(message.id);
			if (newThreadId) {
				// Open the new thread in a new tab
				await tabBarState.handleNewTabForExistingThread(newThreadId);
			} else {
				toast.error(m.toast_unknown_error());
			}
		} catch (error) {
			logger.error("Failed to create branch:", error);
			toast.error(m.toast_unknown_error());
		}
	}

	function handleFeedback(feedback: "like" | "dislike") {
		// Toggle feedback if clicking the same button
		const currentFeedback = message.metadata?.feedback;
		const newFeedback = currentFeedback === feedback ? null : feedback;
		chatState.updateMessageFeedback(message.id, newFeedback);
	}

	async function handleDownloadImage(src: string) {
		try {
			await downloadImage(src);
			toast.success(m.toast_download_file_success({ fileName: "image" }));
		} catch (error) {
			logger.error("Failed to download image:", error);
			toast.error(m.toast_download_failed());
		}
	}

	async function handleCopyImage(src: string) {
		try {
			await copyImageToClipboard(src);
			toast.success(m.toast_copied_success());
		} catch (error) {
			logger.error("Failed to copy image:", error);
			toast.error(m.toast_copied_failed());
		}
	}

	async function handleReadAloud() {
		if (isReading) {
			// Stop current reading
			_isUserCancelled = true;
			window.speechSynthesis.cancel();
			isReading = false;
			_currentUtterance = null;
		} else {
			// Check if speech synthesis is available
			if (!window.speechSynthesis) {
				toast.error(m.toast_read_aloud_not_supported());
				return;
			}

			// Start reading
			const textContent = assistantMessageContent;
			if (!textContent.trim()) {
				toast.error(m.toast_read_aloud_no_content());
				return;
			}

			// Cancel any ongoing speech first
			window.speechSynthesis.cancel();

			// Set language based on content (simple heuristic)
			const hasChinese = /[\u4e00-\u9fa5]/.test(textContent);
			const targetLang = hasChinese ? "zh-CN" : "en-US";

			// Get available voices - wait for them to load if necessary
			let voices = window.speechSynthesis.getVoices();
			logger.debug("Initial voices:", voices.length);

			if (voices.length === 0) {
				// Wait for voices to load
				logger.debug("Waiting for voices to load...");
				voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
					let timeout: NodeJS.Timeout;

					const handler = () => {
						const loadedVoices = window.speechSynthesis.getVoices();
						if (loadedVoices.length > 0) {
							clearTimeout(timeout);
							logger.debug("Voices loaded:", loadedVoices.length, loadedVoices);
							resolve(loadedVoices);
						}
					};

					window.speechSynthesis.onvoiceschanged = handler;

					// Also try to trigger loading
					window.speechSynthesis.getVoices();

					// Timeout after 3 seconds
					timeout = setTimeout(() => {
						logger.debug("Timeout waiting for voices");
						resolve([]);
					}, 3000);
				});
			}

			if (voices.length === 0) {
				toast.error(m.toast_read_aloud_no_voice());
				return;
			}

			const utterance = new SpeechSynthesisUtterance(textContent);

			// Find a voice for the target language
			let selectedVoice = voices.find((voice) =>
				voice.lang.startsWith(targetLang.split("-")[0]),
			);

			// Fallback to any available voice
			if (!selectedVoice) {
				selectedVoice = voices[0];
				logger.debug("Using fallback voice:", selectedVoice.name, selectedVoice.lang);
			}

			utterance.voice = selectedVoice;
			utterance.lang = selectedVoice.lang;
			utterance.rate = 1.0;
			utterance.pitch = 1.0;
			utterance.volume = 1.0;

			utterance.onstart = () => {
				isReading = true;
				logger.debug("Started reading");
			};

			utterance.onend = () => {
				isReading = false;
				_currentUtterance = null;
				logger.debug("Finished reading");
			};

			utterance.onerror = (event) => {
				logger.error("Error:", event);
				isReading = false;
				_currentUtterance = null;
				if (!_isUserCancelled) {
					toast.error(m.toast_read_aloud_failed({ error: event.error }));
				}
				_isUserCancelled = false;
			};

			_currentUtterance = utterance;

			// Start speaking
			window.speechSynthesis.speak(utterance);
			logger.debug(
				"Speech synthesis started with voice:",
				utterance.voice.name,
				utterance.voice.lang,
			);
		}
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (isReading) {
			window.speechSynthesis.cancel();
		}
	});
</script>

{#snippet messageHeader(model: string)}
	<div class="flex items-center gap-2 mb-2">
		<ModelIcon className="size-6" modelName={model} />
		<span class="text-xs text-muted-foreground">{model}</span>
	</div>
{/snippet}

{#snippet messageFooter()}
	{@const isOCCronJobResult = message.metadata?.isOCCronJobResult === true}
	<div class="flex items-center gap-2">
		{#if !isCurrentMessageStreaming}
			<MessageActions
				{message}
				enabledActions={isOCCronJobResult ? ["copy"] : ["copy", "regenerate"]}
			/>

			<!-- Read aloud button (only show if speech synthesis is available) -->
			{#if speechSynthesisAvailable}
				<ButtonWithTooltip
					tooltipSide="bottom"
					class="{isReading
						? 'text-blue-600 dark:text-blue-400'
						: 'text-muted-foreground'} hover:!bg-chat-action-hover"
					tooltip={isReading ? m.text_stop_reading() : m.text_read_aloud()}
					onclick={handleReadAloud}
				>
					{#if isReading}
						<VolumeX />
					{:else}
						<Volume2 />
					{/if}
				</ButtonWithTooltip>
			{/if}

			<ButtonWithTooltip
				tooltipSide="bottom"
				class="text-muted-foreground hover:!bg-chat-action-hover"
				tooltip={m.export_button()}
				onclick={() => {
					isExportDialogOpen = true;
				}}
			>
				<MessageSquareShare />
			</ButtonWithTooltip>

			{#if !isOCCronJobResult}
				{#if message.metadata?.result}
					<AgentTaskResult result={message.metadata.result} />
				{/if}

				<div class="h-4 w-px bg-border"></div>

				<!-- Feedback buttons -->
				<div class="flex items-center gap-2">
					<ButtonWithTooltip
						tooltipSide="bottom"
						class="{message.metadata?.feedback === 'like'
							? 'text-green-600 dark:text-green-400'
							: 'text-muted-foreground'} hover:!bg-chat-action-hover"
						tooltip={m.text_feedback_like()}
						onclick={() => handleFeedback("like")}
					>
						<ThumbsUp />
					</ButtonWithTooltip>
					<ButtonWithTooltip
						tooltipSide="bottom"
						class="{message.metadata?.feedback === 'dislike'
							? 'text-red-600 dark:text-red-400'
							: 'text-muted-foreground'} hover:!bg-chat-action-hover"
						tooltip={m.text_feedback_dislike()}
						onclick={() => handleFeedback("dislike")}
					>
						<ThumbsDown />
					</ButtonWithTooltip>
				</div>
			{/if}
		{/if}

		<span class="text-xs text-muted-foreground">
			{formatTimeAgo(message.metadata?.createdAt?.toLocaleString() || "", getLocale())}
		</span>
	</div>
{/snippet}

<MessageContextMenu
	onCopy={handleCopyMessage}
	onCopyImage={handleCopyImage}
	onRegenerate={handleRegenerate}
	onCreateBranch={handleCreateBranch}
	onDelete={handleDelete}
	onDownloadImage={handleDownloadImage}
	onExport={() => {
		isExportDialogOpen = true;
	}}
>
	<div class="group flex flex-col" data-message-id={message.id}>
		{@render messageHeader(message.metadata?.model || "gpt-4o")}

		{#each messagePartsWithExtractedReasoning() as part, partIndex (partIndex)}
			{#if part.type === "text"}
				{#if isOpenUIMessage}
					<div class="overflow-hidden rounded-chat border bg-background/40 p-3">
						<Renderer
							response={part.text}
							{library}
							isStreaming={isCurrentMessageStreaming}
							onAction={() => {}}
						/>
					</div>
				{:else if preferencesSettings.autoDisableMarkdown}
					<div class="whitespace-pre-wrap break-all text-sm leading-relaxed">
						{part.text}
					</div>
				{:else}
					<MarkdownRenderer
						content={part.text}
						messageId={message.id}
						messagePartIndex={partIndex}
						isStreaming={isCurrentMessageStreaming}
						codeTheme={persistedThemeState.current.shouldUseDarkColors
							? "vitesse-dark"
							: "vitesse-light"}
					/>
				{/if}
			{:else if part.type === "reasoning" && part.text.trim()}
				<AssistantReasoningItem
					text={part.text}
					messageId={message.id}
					index={partIndex}
					{isStreamingReasoning}
					{isCurrentMessageStreaming}
				/>
			{:else if part.type === "dynamic-tool"}
				{#if isClaudeCodeTool(part.toolName)}
					<!-- Claude Code Tools - Render specialized cards -->
					{#if part.toolName === "TodoWrite"}
						<TodoWriteCard {part} messageId={message.id} />
					{:else if part.toolName === "Write" || part.toolName === "Edit"}
						<WriteCard {part} messageId={message.id} messagePartIndex={partIndex} />
					{:else if part.toolName === "Skill"}
						<SkillCard {part} messageId={message.id} />
					{:else if part.toolName === "AskUserQuestion"}
						<AskUserQuestionCard {part} messageId={message.id} />
					{:else}
						<ClaudeCodeToolCard {part} messageId={message.id} />
					{/if}
				{:else}
					<!-- MCP Tools - Keep original behavior with modal -->
					<button
						type="button"
						class="mb-3 block w-full cursor-pointer rounded-[10px] border-0 bg-white px-3.5 py-3 text-left hover:bg-[#F9F9F9] dark:bg-[#1A1A1A] dark:hover:bg-[#2D2D2D]"
						onclick={() => {
							selectedToolPart = part;
							isToolModalOpen = true;
						}}
					>
						<div class="flex w-full items-center justify-between gap-x-4">
							<!-- Left: Tool Icon and Name -->
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
								>
									{#if getServerIcon(part.toolName)}
										<span class="text-xl">{getServerIcon(part.toolName)}</span>
									{:else}
										<Server class="h-5 w-5 text-muted-foreground" />
									{/if}
								</div>

								<!-- Tool Name -->
								<div class="flex flex-col items-start gap-1">
									<h3 class="text-sm font-medium text-foreground">
										{getDisplayToolName(part.toolName)}
									</h3>
									<p class="text-xs text-muted-foreground">
										{getServerName(part.toolName)}
									</p>
								</div>
							</div>

							<!-- Right: Status -->
							<div class="flex items-center gap-2">
								{#if part.state === "input-streaming"}
									<div
										class="h-2 w-2 animate-pulse rounded-full bg-[#0056FE]"
									></div>
									<span class="text-sm text-[#0056FE]"
										>{m.tool_call_status_preparing()}</span
									>
								{:else if part.state === "input-available"}
									<div
										class="h-2 w-2 animate-pulse rounded-full bg-[#0056FE]"
									></div>
									<span class="text-sm text-[#0056FE]"
										>{m.tool_call_status_executing()}</span
									>
								{:else if part.state === "output-available"}
									<div class="h-2 w-2 rounded-full bg-[#38B865]"></div>
									<span class="text-sm text-[#38B865]"
										>{m.tool_call_status_success()}</span
									>
								{:else if part.state === "output-error"}
									<div class="h-2 w-2 rounded-full bg-[#D82525]"></div>
									<span class="text-sm text-[#D82525]"
										>{m.tool_call_status_error()}</span
									>
								{/if}
							</div>
						</div>
					</button>
				{/if}
			{:else if isClaudeCodeToolType(part.type)}
				<!-- 302.AI Claude Code format: tool-{ToolName} -->
				{@const toolName = extractToolNameFromType(part.type)}
				{@const toolPart = {
					...part,
					toolName,
					type: "dynamic-tool",
				} as unknown as DynamicToolUIPart}
				{#if toolName === "TodoWrite"}
					<TodoWriteCard part={toolPart} messageId={message.id} />
				{:else if toolName === "Write" || toolName === "Edit"}
					<WriteCard
						part={toolPart}
						messageId={message.id}
						messagePartIndex={partIndex}
					/>
				{:else if toolName === "Skill"}
					<SkillCard part={toolPart} messageId={message.id} />
				{:else if toolName === "AskUserQuestion"}
					<AskUserQuestionCard part={toolPart} messageId={message.id} />
				{:else}
					<ClaudeCodeToolCard part={toolPart} messageId={message.id} />
				{/if}
			{:else if isMcpToolType(part.type)}
				<!-- 302.AI Claude Code MCP tool format: tool-mcp__serverId__toolName -->
				{@const mcpToolInfo = extractMcpToolInfo(part.type)}
				{#if mcpToolInfo}
					{@const toolPart = {
						...part,
						toolName: `${mcpToolInfo.serverId}__${mcpToolInfo.toolName}`,
						type: "dynamic-tool",
					} as unknown as DynamicToolUIPart}
					<McpToolCard part={toolPart} messageId={message.id} {mcpToolInfo} />
				{/if}
			{/if}
		{/each}

		{#if isStreamingText}
			<div class="flex items-center gap-3 py-3 animate-in fade-in duration-300">
				<div class="flex items-center justify-center">
					<LdrsLoader
						type="dot-pulse"
						size={24}
						speed={1.2}
						color={persistedThemeState.current.shouldUseDarkColors
							? "#a1a1aa"
							: "#71717a"}
					/>
				</div>
				<span class="text-sm text-muted-foreground italic">
					{m.text_chat_responding()}...
				</span>
			</div>
		{/if}

		<!-- Tool Call Modal -->
		{#if selectedToolPart}
			<ToolCallModal
				part={selectedToolPart}
				messageId={message.id}
				bind:open={isToolModalOpen}
				onOpenChange={(open) => {
					isToolModalOpen = open;
					if (!open) {
						selectedToolPart = null;
					}
				}}
			/>
		{/if}

		<!-- Export Dialog -->
		<ExportDialog
			bind:open={isExportDialogOpen}
			startFromMessageId={message.id}
			onOpenChange={(open) => {
				isExportDialogOpen = open;
			}}
		/>

		<!-- Result Download Files -->
		<AgentTaskFiles files={[...(message.metadata?.result?.result_files ?? [])]} />

		{@render messageFooter()}

		<!-- Suggestions -->
		{#if suggestions().length > 0 && !isCurrentMessageStreaming && (!preferencesSettings.showOnlyLastSuggestion || isLastAssistantMessage)}
			<div class="mt-3 flex flex-wrap gap-2">
				{#each suggestions() as suggestion, index (index)}
					<button
						type="button"
						onclick={() => {
							chatState.inputValue = suggestion;
						}}
						class="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
					>
						{suggestion}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</MessageContextMenu>
