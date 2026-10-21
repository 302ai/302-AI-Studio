import type { ListSkillsResponse } from "$lib/api/skills/base-apis";
import { emitter, EventNames } from "$lib/event/emitter";
import { PersistedState } from "$lib/hooks/persisted-state.svelte";
import * as m from "$lib/paraglide/messages";
import { chatState } from "$lib/stores/chat-state.svelte";
import { mcpState } from "$lib/stores/mcp-state.svelte";
import { persistedTabState, tabBarState } from "$lib/stores/tab-bar-state.svelte";
import type { ChatMessage } from "$lib/types/chat";
import { clone } from "$lib/utils/clone";
import { createLogger } from "@shared/logger";
import type { Model } from "@shared/types";
import {
	type AgentClass,
	type CodeAgentCfgs,
	type CodeAgentConfigMetadata,
	type CodeAgentType,
	type Skill,
	type ThinkingBudgetType,
} from "@shared/storage/code-agent";
import type { TabType } from "@shared/types";
import { toast } from "svelte-sonner";
import { match } from "ts-pattern";
import { claudeCodeSandboxState } from "./claude-code-sandbox-state.svelte";
import { claudeCodeAgentState, type ClaudeCodeSandboxInfo } from "./claude-code-state.svelte";
import { codeAgentSharedState } from "./code-agent-shared-state.svelte";
import { cloudModeSessionsState } from "./cloud-mode-sessions-state.svelte";
import { codeAgentGlobalConfigsState } from "./code-agent-global-configs-state.svelte";
import { codeAgentSendMessageButtonState } from "./code-agent-send-message-button-state.svelte";
import { localClaudeCodeSandboxState } from "./local-claude-code-sandbox-state.svelte";
import { localEnvState } from "./local-env-state.svelte";
import { isClaudeCodeOrOpenClaw, withLoadingState } from "./utils";

const logger = createLogger("state");

const tab = window.tab ?? null;
const threadId =
	tab &&
	typeof tab === "object" &&
	"threadId" in tab &&
	typeof tab.threadId === "string" &&
	tab.threadId
		? tab.threadId
		: "shell";
const tabId =
	tab && typeof tab === "object" && "id" in tab && typeof tab.id === "string" && tab.id
		? tab.id
		: "shell";
const codeAgentConfig = window.codeAgentConfig;

function getInitialData() {
	if (codeAgentConfig) {
		return clone(codeAgentConfig as CodeAgentConfigMetadata);
	}

	const initialData: CodeAgentConfigMetadata = {
		enabled: false,
		threadId: threadId,
		type: "remote",
		currentAgentId: "claude-code",
		codingAgentId: "claude-code",
		isDeleted: false,
	};
	return initialData;
}

export const persistedCodeAgentConfigState = new PersistedState<CodeAgentConfigMetadata>(
	"CodeAgentStorage:code-agent-config-state" + "-" + threadId,
	getInitialData(),
);

const { updateClaudeCodeSandboxModel } = window.electronAPI.codeAgentService;
const { notifyTaskCompleted } = window.electronAPI.notificationService;

class CodeAgentState {
	isCodeAgentPanelOpen = $state(false);
	isSkillsPanelOpen = $state(false);
	isLoadingSkills = $state(false);
	isUpdatingSandboxRemark = $state(false);
	isUpdatingSessionRemark = $state(false);
	localBaseUrl = $state("");
	cloudBaseUrl = $state("");

	enabled = $derived.by(() => persistedCodeAgentConfigState.current?.enabled ?? false);
	type = $derived.by(() => {
		if (threadId === "shell") return "remote";
		return persistedCodeAgentConfigState.current?.type ?? "remote";
	});
	currentAgentId = $derived.by(
		() => persistedCodeAgentConfigState.current?.currentAgentId ?? "claude-code",
	);
	codingAgentId = $derived.by(() =>
		(persistedCodeAgentConfigState.current?.codingAgentId ??
		this.currentAgentId === "open-claw")
			? "claude-code"
			: this.currentAgentId,
	);
	isDeleted = $derived.by(() => persistedCodeAgentConfigState.current?.isDeleted ?? false);
	// inPlanMode = $derived.by(() => persistedCodeAgentConfigState.current?.inPlanMode ?? false);

	isFreshTab = $derived(!chatState.hasMessages);
	inCodeAgentMode = $derived(!this.isFreshTab && this.enabled);
	isChecking = $derived(codeAgentSendMessageButtonState.isChecking);

	/**
	 * Represents a fresh, unsynced Agent session that hasn't been initialized on the backend yet.
	 * True when the mode is enabled, the tab is fresh (no messages), and the user chose to start a "new" session.
	 */
	isPristineSession = $derived(this.enabled && this.isFreshTab && this.agentMode === "new");

	async refreshLocalBaseUrl() {
		try {
			const url = await window.electronAPI.localVibeService.getLocalBaseUrl();
			if (url) {
				this.localBaseUrl = url + "/api/v1";
			}
		} catch (error) {
			logger.error("Failed to refresh local base URL:", error);
		}
	}

	handleChatFinished = async (event: { canDeploy: boolean; lastMessage: ChatMessage }) => {
		// Skip deployment if taskboard is still running - deployment will be triggered when all tasks complete
		if (codeAgentSharedState.taskboardIsRunning) {
			return;
		}

		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			const sendRetryMessage = codeAgentGlobalConfigsState.autoFixDeployFailure
				? async (content: string) => {
						await chatState.sendMessage({ content });
					}
				: undefined;

			await claudeCodeAgentState.handleChatFinished({
				...event,
				sendRetryMessage,
			});
		}

		// Send notification if in Vibe mode and tab is inactive
		await this.#showNotificationForChatFinished(event);
	};

	handleThreadTitleUpdated = async (event: { title: string }) => {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			await claudeCodeAgentState.handleThreadTitleUpdated(event);
			if (this.type === "local") {
				await codeAgentState.refreshSessions();
			} else if (this.type === "cloud") {
				await cloudModeSessionsState.refreshSessions();
			}
		}
	};

	handleTaskboardAllTasksDone = async (_event: {
		sandboxId: string;
		sessionId: string;
		taskCount: number;
	}) => {
		// Only trigger deployment if auto-deploy is enabled and current agent is claude-code
		if (isClaudeCodeOrOpenClaw(this.currentAgentId) && codeAgentGlobalConfigsState.autoDeploy) {
			// Get the last message for deployment check
			const lastMessage = chatState.messages[chatState.messages.length - 1];
			if (lastMessage) {
				await claudeCodeAgentState.handleChatFinished({
					canDeploy: true, // Explicitly allow deployment when taskboard completes
					lastMessage,
				});
			}
		}

		// Send notification if in Vibe mode and tab is inactive
		await this.#showNotificationForTaskboardDone(_event);
	};

	// Check if current tab is inactive by looking at the persisted tab state
	#isCurrentTabInactive(): boolean {
		const current = persistedTabState.current;
		if (!current) return true;

		// Find our tab across all windows
		for (const windowId of Object.keys(current)) {
			const windowState = current[windowId];
			if (!windowState?.tabs) continue;

			const currentTab = windowState.tabs.find((t) => t.threadId === threadId);
			if (currentTab) {
				return !currentTab.active;
			}
		}

		// If we can't find the tab, assume it's inactive
		return true;
	}

	// Extract a summary from the last message for notification body
	#extractTaskSummary(lastMessage: ChatMessage | undefined): string {
		if (!lastMessage) return "";

		// Extract content from metadata.result.content (302.AI Claude Code result)
		const resultContent = lastMessage.metadata?.result?.content ?? "";

		// Get first 100 characters as summary
		const summary = resultContent.slice(0, 100).trim();
		return summary.length >= 100 ? summary + "..." : summary;
	}

	// Show notification for CHAT_FINISHED event
	async #showNotificationForChatFinished(event: {
		canDeploy: boolean;
		lastMessage: ChatMessage;
	}): Promise<void> {
		// Only notify if Vibe mode is enabled and tab is inactive OR document is hidden (window backgrounded)
		if (
			this.enabled &&
			(this.#isCurrentTabInactive() || document.hidden) &&
			codeAgentGlobalConfigsState.notificationsEnabled
		) {
			const summary = this.#extractTaskSummary(event.lastMessage);
			await notifyTaskCompleted({
				title: m.notification_vibe_task_completed_title(),
				body: summary,
				windowId: window.windowId,
				tabId: tabId,
			});
		}
	}

	// Show notification for TASKBOARD_ALL_TASKS_DONE event
	async #showNotificationForTaskboardDone(event: { taskCount: number }): Promise<void> {
		// Only notify if Vibe mode is enabled and tab is inactive OR document is hidden (window backgrounded)
		if (
			this.enabled &&
			(this.#isCurrentTabInactive() || document.hidden) &&
			codeAgentGlobalConfigsState.notificationsEnabled
		) {
			const lastMessage = chatState.messages[chatState.messages.length - 1];
			const summary = this.#extractTaskSummary(lastMessage);

			await notifyTaskCompleted({
				title: m.notification_vibe_taskboard_completed_title(),
				body: `${m.notification_vibe_taskboard_completed_body({ count: event.taskCount })}${summary ? "\n" + summary : ""}`,
				windowId: window.windowId,
				tabId: tabId,
			});
		}
	}

	private updateState(partial: Partial<CodeAgentConfigMetadata>): void {
		persistedCodeAgentConfigState.current = {
			...(persistedCodeAgentConfigState.current ?? getInitialData()),
			...partial,
		};
	}

	updateCurrentAgentId(agentId: AgentClass): void {
		const codingAgentId = agentId === "open-claw" ? "claude-code" : agentId;
		this.updateState({ currentAgentId: agentId, codingAgentId });
		codeAgentGlobalConfigsState.updateLastAgentId(agentId);
	}

	updateType(type: CodeAgentType): void {
		const updates: Partial<CodeAgentConfigMetadata> = { type };

		// Only force agent switch when current selection is incompatible with the target mode
		// Remote mode only supports claude-code, so switch from open-claw if needed
		if (type === "remote" && this.currentAgentId === "open-claw") {
			updates.currentAgentId = "claude-code";
			updates.codingAgentId = "claude-code";
		}
		// Cloud and Local modes support both agents, preserve user's choice
		// However, if switching to a fresh tab (no messages yet), use the last saved agent preference
		else if (this.isFreshTab && type !== "remote") {
			const lastAgentId = codeAgentGlobalConfigsState.lastAgentId;
			updates.currentAgentId = lastAgentId;
			updates.codingAgentId = lastAgentId === "open-claw" ? "claude-code" : lastAgentId;
		}

		this.updateState(updates);

		// Save the current platform mode and agent selection to global config for next new session
		// This ensures new sessions use the same platform and agent as the current session
		codeAgentGlobalConfigsState.updateLastVibeMode(type);
		if (updates.currentAgentId) {
			codeAgentGlobalConfigsState.updateLastAgentId(updates.currentAgentId);
		}

		// Reset session and sandbox ID when switching modes to avoid configuration confusion and race conditions
		claudeCodeAgentState.resetSessionAndSandbox(type);
		// Reset local session selection
		if (type === "local") {
			localClaudeCodeSandboxState.reset();
		} else if (type === "cloud") {
			cloudModeSessionsState.reset();
		}
	}

	updateEnabled(enabled: boolean, shouldReset = true): void {
		this.updateState({ enabled });
		if (shouldReset) {
			claudeCodeAgentState.resetSessionAndSandbox(this.type);

			if (this.type === "local") {
				localClaudeCodeSandboxState.reset();
			} else if (this.type === "cloud") {
				cloudModeSessionsState.reset();
			}
		}
	}

	updateInPlanMode(inPlanMode: boolean): void {
		if (this.currentAgentId === "claude-code") {
			claudeCodeAgentState.updateInPlanMode(inPlanMode);
		}
	}

	async executeCodeAgentMode(): Promise<{ isOK: boolean; sandboxInfo?: ClaudeCodeSandboxInfo }> {
		if (!isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			return { isOK: false };
		}

		return match(this.type)
			.with("local", "cloud", () => claudeCodeAgentState.handleLocalOrCloudModeExecute())
			.with("remote", () => claudeCodeAgentState.handleAgentModeExecute())
			.exhaustive();
	}

	updateCurrentSessionId(sessionId: string): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.updateCurrentSessionId(sessionId);
		}
	}

	get codeAgentCfgs(): CodeAgentCfgs {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => {
				return match(this.type)
					.with("local", () => ({
						baseUrl: this.localBaseUrl,
						model: claudeCodeAgentState.model,
					}))
					.with("cloud", () => {
						return {
							baseUrl: this.cloudBaseUrl,
							model: claudeCodeAgentState.model,
						};
					})
					.with("remote", () => ({
						baseUrl: claudeCodeAgentState.baseUrl,
						model: claudeCodeAgentState.sandboxId,
					}))
					.exhaustive();
			})
			.otherwise(() => ({ baseUrl: "", model: "" }));
	}

	get inPlanMode(): boolean {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.inPlanMode)
			.otherwise(() => false);
	}

	get currentSessionId(): string {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.currentSessionId)
			.otherwise(() => "");
	}

	get sandboxId(): string {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.sandboxId)
			.otherwise(() => "");
	}

	get sessionId(): string {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.currentSessionId)
			.otherwise(() => "");
	}

	get currentModel(): string {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.model)
			.otherwise(() => "");
	}

	get currentWorkspacePath(): string {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.currentWorkspacePath)
			.otherwise(() => "");
	}

	get skills(): Skill[] {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.skills)
			.otherwise(() => []);
	}

	get thinkingBudget(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.thinkingBudget)
			.otherwise(() => "off");
	}

	get isUpdatingThinkingBudget(): boolean {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.isUpdatingThinkingBudget)
			.otherwise(() => false);
	}

	// get sessions() {
	// 	return match(this.type)
	// 		.with("local", () => localClaudeCodeSandboxState.sessions)
	// 		.with("cloud", () => cloudModeSessionsState.sessions)
	// 		.otherwise(() => []);
	// }

	// get selectedSessionId() {
	// 	return match(this.type)
	// 		.with("local", () => localClaudeCodeSandboxState.selectedSessionId)
	// 		.with("cloud", () => cloudModeSessionsState.selectedSessionId)
	// 		.with("remote", () => claudeCodeAgentState.selectedSessionId)
	// 		.exhaustive();
	// }

	async getSkillList(isInit: boolean): Promise<ListSkillsResponse> {
		return withLoadingState(
			(loading) => (this.isLoadingSkills = loading),
			() =>
				match(this.currentAgentId)
					.with("claude-code", "open-claw", () =>
						claudeCodeAgentState.listClaudeCodeSkills(isInit),
					)
					.otherwise(() => ({
						success: false,
						user_skills: [],
						builtin_skills: [],
						project_skills: [],
					})),
		);
	}
	async handleCodeAgentModelChange(model: Model): Promise<boolean> {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			const { isOK } = await updateClaudeCodeSandboxModel(threadId, this.sandboxId, model.id);
			return isOK;
		}

		return false;
	}

	updateSandboxModel(model: string): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.updateSandboxModel(model);
		}
	}

	updateThinkingBudget(thinkingBudget: ThinkingBudgetType): void {
		if (this.currentAgentId === "claude-code") {
			claudeCodeAgentState.updateThinkingBudget(thinkingBudget);
		}
	}

	handleSkillsUse(skills: Skill[]): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.handleSkillUse(skills);
		}
	}

	handleSkillsRemove(skills: Skill[]): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.handleSkillRemove(skills);
		}
	}

	async updateSandboxRemark(remark: string): Promise<boolean> {
		return withLoadingState(
			(loading) => (this.isUpdatingSandboxRemark = loading),
			() =>
				match(this.currentAgentId)
					.with("claude-code", "open-claw", () =>
						claudeCodeSandboxState.updateSandboxRemark(
							claudeCodeAgentState.sandboxId,
							remark,
						),
					)
					.otherwise(() => false),
		);
	}

	async updateSessionRemark(remark: string): Promise<boolean> {
		return withLoadingState(
			(loading) => (this.isUpdatingSessionRemark = loading),
			async () => {
				const isOK = await match(this.currentAgentId)
					.with("claude-code", "open-claw", () =>
						claudeCodeAgentState.updateSessionRemark(remark, true),
					)
					.otherwise(() => false);

				if (isOK && ["local", "cloud"].includes(this.type)) {
					await codeAgentState.refreshSessions();
				}

				return isOK;
			},
		);
	}

	handleSkillForceUseToggle(skillName: string, forceUse: boolean): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.handleSkillForceUseToggle(skillName, forceUse);
		}
	}

	// --- Proxy getters for properties accessed by external consumers ---

	get sandboxRemark(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.sandboxRemark)
			.otherwise(() => "");
	}

	get agentMode(): "new" | "existing" {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.agentMode)
			.otherwise(() => "new");
	}

	// --- Proxy methods for operations accessed by external consumers ---

	updateCurrentWorkspacePath(workspacePath: string): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.updateCurrentWorkspacePath(workspacePath);
		}
	}

	init(): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.init();
			if (this.type === "local") {
				localClaudeCodeSandboxState.init(this.currentSessionId, this.currentWorkspacePath);
			} else if (this.type === "cloud") {
				cloudModeSessionsState.init(this.currentSessionId, this.currentWorkspacePath);
			}
		}
	}

	handleEnabled(): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.handleEnabled();
		}
	}

	handleLocalEnabled(sessionId: string, workspacePath: string): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.handleLocalEnabled(sessionId, workspacePath);
		}
	}

	handleCloudEnabled(sessionId: string, workspacePath: string): void {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.handleCloudEnabled(sessionId, workspacePath);
		}
	}

	handleConfirmEnabled(): void {
		this.getSkillList(true);

		// Filter incompatible MCP servers
		if (chatState.mcpServerIds.length > 0) {
			const { compatibleIds, filteredNames } = mcpState.filterStreamableHTTPServers(
				chatState.mcpServerIds,
			);

			if (filteredNames.length > 0) {
				toast.warning(m.mcp_filtered_warning({ names: filteredNames.join(", ") }));
				chatState.handleMCPServerChange(compatibleIds);
			}
		}

		match(this.type)
			.with("local", () => {
				const sessionId = localClaudeCodeSandboxState.selectedSessionId;
				const workspacePath = localClaudeCodeSandboxState.selectedWorkspacePath;
				this.handleLocalEnabled(sessionId, workspacePath);
			})
			.with("cloud", () => {
				const sessionId = cloudModeSessionsState.selectedSessionId;
				const workspacePath = cloudModeSessionsState.selectedWorkspacePath;
				this.handleCloudEnabled(sessionId, workspacePath);
			})
			.with("remote", () => {
				this.handleEnabled();
			})
			.exhaustive();

		this.updateEnabled(true, false);
	}

	async refreshSessions(sandboxId?: string, mode?: CodeAgentType): Promise<void> {
		const targetMode: CodeAgentType = mode ?? this.type;
		if (targetMode === "local") {
			await localClaudeCodeSandboxState.refreshSessions();
		} else if (targetMode === "cloud") {
			await cloudModeSessionsState.refreshSessions();
		} else if (targetMode === "remote") {
			if (sandboxId) {
				await claudeCodeSandboxState.refreshSessions(sandboxId);
			}
		}
	}

	async handleCreateNewSandbox(): Promise<boolean> {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			return claudeCodeAgentState.handleCreateNewSandbox();
		}
		return false;
	}

	// --- Proxy getter/setter for UI form state (used via bind in components) ---

	get selectedSandboxId(): string {
		return match(this.currentAgentId)
			.with("claude-code", "open-claw", () => claudeCodeAgentState.selectedSandboxId)
			.otherwise(() => "auto");
	}
	set selectedSandboxId(value: string) {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.selectedSandboxId = value;
		}
	}

	get selectedSandboxRemark(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.selectedSandboxRemark)
			.otherwise(() => "");
	}
	set selectedSandboxRemark(value: string) {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.selectedSandboxRemark = value;
		}
	}

	get selectedSessionId(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.selectedSessionId)
			.otherwise(() => "new");
	}
	set selectedSessionId(value: string) {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.selectedSessionId = value;
		}
	}

	get selectedWorkspacePath(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.selectedWorkspacePath)
			.otherwise(() => "new");
	}
	set selectedWorkspacePath(value: string) {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.selectedWorkspacePath = value;
		}
	}

	get customSandboxName(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.customSandboxName)
			.otherwise(() => "");
	}
	set customSandboxName(value: string) {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.customSandboxName = value;
		}
	}

	get selectedSessionRemark(): string {
		return match(this.currentAgentId)
			.with("claude-code", () => claudeCodeAgentState.selectedSessionRemark)
			.otherwise(() => "");
	}
	set selectedSessionRemark(value: string) {
		if (isClaudeCodeOrOpenClaw(this.currentAgentId)) {
			claudeCodeAgentState.selectedSessionRemark = value;
		}
	}
}

export const codeAgentState = new CodeAgentState();

$effect.root(() => {
	$effect(() => {
		if (codeAgentState.enabled) {
			const offChat = emitter.on(EventNames.CHAT_FINISHED, codeAgentState.handleChatFinished);
			const offTitle = emitter.on(
				EventNames.THREAD_TITLE_UPDATED,
				codeAgentState.handleThreadTitleUpdated,
			);
			const offTaskboard = emitter.on(
				EventNames.TASKBOARD_ALL_TASKS_DONE,
				codeAgentState.handleTaskboardAllTasksDone,
			);

			return () => {
				offChat();
				offTitle();
				offTaskboard();
			};
		}
	});

	// Auto-refresh local baseUrl when mode is local and sandbox is running
	// This handles both scenarios:
	// 1. Current tab: when sandbox state changes from not running to running
	// 2. New tab: when the tab opens and sandbox is already running
	$effect(() => {
		if (codeAgentState.type === "local" && localEnvState.sandboxRunning) {
			codeAgentState.refreshLocalBaseUrl();
		}
	});

	// Auto-start sandbox health check listening when local Vibe mode is active.
	// This ensures cron job monitoring starts for threads loaded from the sidebar
	// without requiring the user to open the Vibe mode settings panel.
	// startSandboxListening() is idempotent (guarded by unsubscribe checks).
	$effect(() => {
		if (codeAgentState.enabled && codeAgentState.type === "local") {
			localEnvState.startSandboxListening();
		}
	});

	// Sync Tab Type with Code Agent Mode
	$effect(() => {
		const tabId = window.tab?.id;
		if (!tabId || tabId === "shell") return;

		let targetType: TabType = "chat";
		if (codeAgentState.enabled) {
			targetType =
				codeAgentState.currentAgentId === "open-claw"
					? "chat-vibe-openclaw"
					: "chat-vibe-claude";
		}

		tabBarState.updateTabType(tabId, targetType);
	});

	// Listen to local sandbox state changes, refresh baseUrl when sandbox is running
	const offLocalSandboxState = window.electronAPI.onLocalSandboxStateChanged((data) => {
		if (data.running && codeAgentState.type === "local") {
			codeAgentState.refreshLocalBaseUrl();
		}
	});

	return () => {
		offLocalSandboxState();
	};
});
