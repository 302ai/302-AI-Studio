import type { SsoLogoutOptions } from "$lib/components/buss/sso-logout-dialog";
import { createLogger } from "@shared/logger";

const logger = createLogger("state");
import { API_BASE_URL } from "$lib/constants/api";
import { PersistedState } from "$lib/hooks/persisted-state.svelte";
import { m } from "$lib/paraglide/messages.js";
import type { UserInfo, UserState } from "@shared/storage/user";
import { hashApiKey } from "@shared/utils/hash";
import { mapV2UserInfo } from "@shared/storage/user";

const getDefaults = (): UserState => ({
	token: null,
	userInfo: null,
	isLoggedIn: false,
	ssoApiKey: null,
});

const persistedUserState = new PersistedState<UserState>("UserStorage:state", getDefaults());

class UserStateManager {
	get state(): UserState {
		return persistedUserState.current;
	}

	get token(): string | null {
		return persistedUserState.current.token;
	}

	get userInfo(): UserInfo | null {
		// 持久化里可能是 v1 形状或未映射的原始 v2 形状，读取时统一规范化
		return persistedUserState.current.userInfo
			? mapV2UserInfo(persistedUserState.current.userInfo)
			: null;
	}

	get isLoggedIn(): boolean {
		// isLoggedIn should only be true when we have both token AND userInfo
		return !!(persistedUserState.current.token && persistedUserState.current.userInfo);
	}

	get ssoApiKey(): string | null {
		return persistedUserState.current.ssoApiKey;
	}

	setToken(token: string): void {
		persistedUserState.current = {
			...persistedUserState.current,
			token,
		};
	}

	setUserInfo(userInfo: UserInfo): void {
		persistedUserState.current = {
			...persistedUserState.current,
			userInfo,
		};
	}

	/**
	 * Store the API key obtained from SSO login for tracking association
	 */
	setSsoApiKey(apiKey: string): void {
		persistedUserState.current = {
			...persistedUserState.current,
			ssoApiKey: apiKey,
		};
	}

	async fetchUserInfo(): Promise<{ success: boolean; error?: string }> {
		const token = this.token;
		if (!token) {
			return { success: false, error: m.error_no_token() };
		}

		logger.info("fetchUserInfo 使用的 token:", token);

		try {
			const res = await fetch(`${API_BASE_URL}/user/v2/info`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					// dash-api 这套鉴权只认裸 token，加 Bearer 前缀会报 2004 token error
					authorization: token,
					isgpt: "1",
					lang: "zh-CN",
					tz: "Asia/Shanghai",
					"HTTP-Referer": "https://studio.302.ai/",
					"X-Title": "302.AI Studio",
					origin: "https://302.ai",
					referer: "https://302.ai/",
				},
				// dash-api 登录链路约定：8s 超时、不重试，失败走降级
				signal: AbortSignal.timeout(8000),
			});

			const data = await res.json();
			logger.info("fetchUserInfo 响应:", data);
			if (data.code === 0 || data.code === 200) {
				this.setUserInfo(mapV2UserInfo(data.data));
				return { success: true };
			} else {
				return { success: false, error: data.msg || m.error_fetch_user_info_failed() };
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : m.network_error(),
			};
		}
	}

	logout(): void {
		persistedUserState.current = getDefaults();
	}

	/**
	 * Logout with cleanup options.
	 * This method handles clearing associated resources based on user selection.
	 * @param options - The cleanup options selected by the user
	 */
	async logoutWithCleanup(options: SsoLogoutOptions): Promise<void> {
		// Import dependencies lazily to avoid circular imports
		const { mcpState } = await import("./mcp-state.svelte");
		const { providerState } = await import("./provider-state.svelte");
		const { threadService, broadcastService } = window.electronAPI;

		// Use 302AI provider's apiKey instead of ssoApiKey for session matching
		// Because sessions are created with the provider's apiKey hash, not ssoApiKey
		// This ensures consistency: create and delete use the same apiKey source
		const provider = providerState.getProvider("302AI");
		const apiKeyForHash = provider?.apiKey;

		// 1. Clear associated API key if option is selected
		if (options.unlinkApiKey && provider) {
			// Clear API key regardless of whether it matches
			// User explicitly chose to unlink, so clear all associated data
			providerState.updateProvider("302AI", { apiKey: "" });
			// Clear all models for 302AI provider (including default models fetched from server)
			// This will also clear selectedModel references in all threads
			const removedCount = await providerState.removeModelsByProvider("302AI");
			logger.info(`[Logout] Cleared API key and ${removedCount} models from 302.AI provider`);
		}

		// 2. Clear associated sessions if option is selected
		if (options.clearSessions && apiKeyForHash) {
			const apiKeyHash = hashApiKey(apiKeyForHash);
			if (apiKeyHash) {
				const deletedCount = await threadService.deleteThreadsByApiKeyHash(apiKeyHash);
				logger.info(`[Logout] Deleted ${deletedCount} associated sessions`);

				// Broadcast thread list update
				await broadcastService.broadcastToAll("thread-list-updated", {});
			}
		}

		// 3. Clear associated MCP servers if option is selected
		if (options.clearMcpServers) {
			const removedCount = mcpState.removeAssociatedServers();
			logger.info(`[Logout] Removed ${removedCount} associated MCP servers`);
		}

		// Finally, logout (clear user state)
		this.logout();
	}

	update(partial: Partial<UserState>): void {
		persistedUserState.current = { ...persistedUserState.current, ...partial };
	}
}

export const userState = new UserStateManager();
