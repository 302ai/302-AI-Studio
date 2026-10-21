import type { ChatMessage } from "$lib/stores/chat-state.svelte";
import type { ElectronAPI } from "@electron-toolkit/preload";
import type { SandboxHealthResponse } from "@shared/storage/cloud-mode";
import type { CodeAgentConfigMetadata, CodeAgentMetadata } from "@shared/storage/code-agent";
import type {
	BroadcastEventData,
	OpenClawWeixinLoginMsg,
	ShellWindowFullscreenChange,
	Tab,
	TabDragGhostClear,
	TabDragGhostHover,
	TabUIState,
	Theme,
	ThreadParmas,
} from "@shared/types";
import type {
	ShortcutActionEvent,
	ShortcutKeyPressEvent,
	ShortcutSyncEvent,
} from "@shared/types/shortcut";
import type { ElectronAPIExtension } from "../electron/main/generated/preload-services";

declare global {
	const __APP_VERSION__: string;

	namespace App {}

	interface Window {
		electron: ElectronAPI;
		electronAPI: ElectronAPIExtension & {
			threadStateService: ElectronAPIExtension["threadStateService"] & {
				getBusyThreads(): Promise<Record<string, { isBusy: boolean; reason?: string }>>;
			};
			theme: {
				setTheme: (theme: Theme) => void;
				onThemeChange: (callback: (theme: Theme) => void) => void;
				getCurrentTheme: () => Promise<Theme>;
			};
			shortcut: {
				onShortcutSync: (callback: (data: ShortcutSyncEvent) => void) => () => void;
				onShortcutAction: (callback: (event: ShortcutActionEvent) => void) => () => void;
				sendShortcutKeyPressed: (event: ShortcutKeyPressEvent) => () => void;
			};
			onThemeChange: (callback: (theme: Theme) => void) => () => void;
			onScreenshotTriggered: (callback: (data: { threadId: string }) => void) => () => void;
			onShowToast: (
				callback: (data: { type: string; message: string; threadId?: string }) => void,
			) => () => void;
			onTriggerSendMessage: (callback: (data: { threadId: string }) => void) => () => void;
			onTriggerCreateSkillSummary: (
				callback: (data: { threadId: string }) => void,
			) => () => void;
			onSidebarStateChanged: (callback: (data: { open: boolean }) => void) => () => void;
			onSidebarSearchChanged: (callback: (data: { query: string }) => void) => () => void;
			onSidebarSearchResultsUpdated: (
				callback: (data: { query: string; resultIds: string[] }) => void,
			) => () => void;
			onSidebarSearchNavigate: (
				callback: (data: { threadId: string; query: string }) => void,
			) => () => void;
			onApplyDefaultModel: (callback: (data: { model: unknown }) => void) => () => void;
			onModelsDeleted: (
				callback: (data: { deletedModelIds: string[]; providerId?: string }) => void,
			) => () => void;
			onThreadListUpdate: (callback: (eventData: BroadcastEventData) => void) => () => void;
			onThreadBusyStateChanged: (
				callback: (data: { threadId: string; isBusy: boolean; reason?: string }) => void,
			) => () => void;
			onShellWindowFullscreenChange: (
				callback: (payload: ShellWindowFullscreenChange) => void,
			) => () => void;
			onTabDragGhostHover: (callback: (payload: TabDragGhostHover) => void) => () => void;
			onTabDragGhostClear: (callback: (payload: TabDragGhostClear) => void) => () => void;
			onTabClearMessages: (
				callback: (data: { tabId: string; threadId: string }) => void,
			) => () => void;
			onTabGenerateTitle: (
				callback: (data: { tabId: string; threadId: string }) => void,
			) => () => void;
			onSandboxCreated: (
				callback: (data: { threadId: string; sandboxId: string }) => void,
			) => () => void;
			onPersistedStateSync: <T>(key: string, callback: (syncValue: T) => void) => () => void;
			updater: {
				onUpdateChecking: (callback: () => void) => () => void;
				onUpdateAvailable: (callback: () => void) => () => void;
				onUpdateNotAvailable: (callback: () => void) => () => void;
				onUpdateDownloaded: (
					callback: (data: { releaseNotes: string; releaseName: string }) => void,
				) => () => void;
				onUpdateError: (callback: (data: { message: string }) => void) => () => void;
			};
			aiApplication: {
				onAiApplicationsLoading: (callback: (loading: boolean) => void) => () => void;
			};
			skill: {
				onSkillImportRequested: (callback: (data: { url: string }) => void) => () => void;
			};
			onInstallLog: (
				callback: (data: {
					step: string;
					type: "start" | "stdout" | "stderr" | "complete" | "error";
					data: string;
				}) => void,
			) => () => void;
			onPodmanHealthCheck: (
				callback: (data: { isOk: boolean; isHealth: boolean; timestamp: number }) => void,
			) => () => void;
			onLocalSandboxHealthCheck: (
				callback: (data: {
					isOk: boolean;
					isHealth: boolean;
					isOcHealth: boolean;
					error?: string;
					timestamp: number;
				}) => void,
			) => () => void;
			onLocalSandboxStateChanged: (
				callback: (data: { starting?: boolean; running?: boolean }) => void,
			) => () => void;
			onWslRestartRequired: (
				callback: (data: { reason: string; message: string }) => void,
			) => () => void;
			onTabRequestSnapshot: (callback: () => Promise<TabUIState> | TabUIState) => () => void;
			openClaw: {
				onWeiXinLoginInformation: (
					callback: (event: OpenClawWeixinLoginMsg) => void,
				) => () => void;
			};
			cloudMode: {
				onTimedBroadcaster: (
					callback: (data: SandboxHealthResponse | null) => void,
				) => () => void;
			};
		};
		windowId: string;
		tab: Tab;
		tabs: Tab[];
		thread: ThreadParmas;
		messages: ChatMessage[];
		codeAgentConfig: CodeAgentConfigMetadata;
		claudeCodeAgentState: CodeAgentMetadata;
		openclawConfig: OpenClawConfig;
		app: {
			platform: string;
			isDev: boolean;
			serverPort: number;
		};
		initialTheme: string | null;
	}
}

export {};
