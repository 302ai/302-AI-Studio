/* eslint-disable @typescript-eslint/no-explicit-any */

import type { UIMessage } from "ai";
import type { StorageValue } from "@302ai/unstorage";

// Export necessary types and functions from @302ai/unstorage
export { prefixStorage } from "@302ai/unstorage";
export type { StorageMeta, StorageValue } from "@302ai/unstorage";
export * from "./storage/ai-applications";
export * from "./storage/code-agent";
export * from "./storage/general-settings";
export * from "./storage/mcp";
export * from "./storage/provider";
export * from "./storage/session";
export * from "./storage/tab";
export * from "./storage/theme";
export * from "./storage/thread";
export * from "./storage/cloud-mode";
export * from "./storage/openclaw";
export * from "./types/shortcut";
export type { LogCategory, LogLevel } from "./logger/types";

/* ============================================================================
 * Model Types
 * ========================================================================= */

export type ModelType = "language" | "image-generation" | "tts" | "embedding" | "rerank";
export type ModelCapability = string;

export interface Model {
	id: string;
	name: string;
	remark: string;
	providerId: string;
	capabilities: Set<ModelCapability>;
	type: ModelType;
	custom: boolean;
	enabled: boolean;
	collected: boolean;
	isFeatured: boolean;
	isAddedByUser?: boolean;
	is_custom_model?: boolean;
	openai_compatible?: boolean;
}

export interface ModelCreateInput {
	id: string;
	name: string;
	remark?: string;
	providerId: string;
	capabilities?: Set<ModelCapability>;
	type?: ModelType;
	custom?: boolean;
	enabled?: boolean;
	collected?: boolean;
	isFeatured?: boolean;
	isAddedByUser?: boolean;
}

export interface ModelUpdateInput {
	id?: string;
	name?: string;
	remark?: string;
	providerId?: string;
	capabilities?: Set<ModelCapability>;
	type?: ModelType;
	custom?: boolean;
	enabled?: boolean;
	collected?: boolean;
	isFeatured?: boolean;
	isAddedByUser?: boolean;
}

/* ============================================================================
 * Chat Message Types
 * ========================================================================= */

export interface ResultMetadata {
	type?: string;
	subtype?: string;
	is_error?: boolean;
	duration_ms?: number;
	duration_api_ms?: number;
	num_turns?: number;
	content?: string;
	session_id?: string;
	total_cost_usd?: number;
	uuid?: string;
	result_files?: string[];
}

export interface MessageMetadata {
	createdAt?: string;
	model?: string;
	attachments?: Array<{
		id: string;
		name: string;
		type: string;
		size: number;
		filePath: string;
		preview?: string;
		textContent?: string;
	}>;
	fileContentPartIndex?: number;
	feedback?: "like" | "dislike";
	result?: ResultMetadata;
	userPromptTemplateContent?: string;
	userPromptTemplateVariables?: string[];
	userPromptTemplateMap?: Record<string, string>;
	systemPromptContent?: string;
	systemPromptVariables?: string[];
	systemPromptMap?: Record<string, string>;
	isOCCronJobResult?: boolean;
	OCCronJobRunData?: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ChatTools = {};

export type CustomUIDataTypes = {
	suggestions?: string[];
	[x: string]: unknown;
};

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes, ChatTools>;

/* ============================================================================
 * Storage Types
 * ========================================================================= */

export interface StorageMetadata {
	mtime?: Date;
	atime?: Date;
	size?: number;
}

export interface StorageOptions {
	removeMeta?: boolean;
}

export interface StorageItem<T extends StorageValue> {
	key: string;
	value: T;
}

export type Platform = "win32" | "darwin" | "linux";

export type SheetWindowConfig = {
	activeTabId?: string;
	anchor?: {
		x: number;
		y: number;
	};
};

export interface MigrationConfig<T extends StorageValue = StorageValue> {
	version: number;
	migrate: (persistedState: any, currentVersion: number) => T;
	debug?: boolean;
}

export interface VersionedStorageValue {
	_version?: number;
}

export interface MCPServer {
	id: string;
}

export interface AttachmentFile {
	id: string;
	name: string;
	type: string;
	size: number;
	file: File;
	preview?: string;
	filePath: string;
	textContent?: string;
}

export type { ChatVariable } from "./storage/chat-parameters";
import type { ThinkingBudgetType } from "./storage/code-agent";

export interface ThreadParmas {
	id: string;
	title: string;
	temperature: number | null;
	topP: number | null;
	frequencyPenalty: number | null;
	presencePenalty: number | null;
	maxTokens: number | null;
	inputValue: string;
	attachments: AttachmentFile[];
	mcpServers: MCPServer[];
	mcpServerIds: string[];
	isThinkingActive: boolean;
	isOnlineSearchActive: boolean;
	isOCRActive: boolean;
	isMCPActive: boolean;
	selectedModel: Model | null;
	isPrivateChatActive: boolean;
	reasoningEffort?: ThinkingBudgetType;
	updatedAt: Date;
	autoSendOnLoad?: boolean;
	apiKeyHash?: string;
	incrementalSummary?: string;
	clearScreenMessageId?: string;
	contextSummary?: string;
	compressedMessageCount?: number;
	lastCompressionMessageId?: string;
	compressionEnabled?: boolean;
}

export interface ThreadData {
	threadId: string;
	thread: ThreadParmas;
	isFavorite: boolean;
}

// Broadcast system types
export type BroadcastEvent =
	| "thread-list-updated"
	| "theme-changed"
	| "settings-updated"
	| "trigger-screenshot"
	| "trigger-send-message"
	| "show-toast"
	| "sidebar-state-changed"
	| "apply-default-model"
	| "models-deleted"
	| "local-sandbox-state-changed"
	| "thread-busy-state-changed"
	| "sidebar-search-results-updated"
	| "sidebar-search-changed"
	| "sidebar-search-navigate";

export interface BroadcastEventData {
	broadcastEvent: BroadcastEvent;
	data?: unknown;
	sourceWebContentsId?: number;
}

export interface ShellWindowFullscreenChange {
	windowId: number;
	isFullScreen: boolean;
}

export interface TabDragGhostHover {
	windowId: string;
	clientX: number;
	clientY: number;
	draggedWidth: number;
}

export interface TabDragGhostClear {
	windowId: string;
}

export interface ImportResult {
	success: boolean;
	message: string;
	importedFiles?: number;
	backupPath?: string;
}

export interface BackupInfo {
	path: string;
	timestamp: Date;
	size: number;
}

export interface FileNode {
	name: string;
	path: string;
	type: "file" | "directory";
	children?: FileNode[];
}

export type OpenClawWeixinLoginMsg = {
	type: string;
	data: string;
};
