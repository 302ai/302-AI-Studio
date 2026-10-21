import { shell, type IpcMainInvokeEvent } from "electron";
import { createLogger } from "@shared/logger";
import { providerStorage } from "../storage-service/provider-storage";

const logger = createLogger("services");

export class SsoService {
	private pendingCallback: ((apiKey: string) => void) | null = null;
	private callbackTimeout: NodeJS.Timeout | null = null;

	/**
	 * Open SSO login in external browser
	 */
	async openSsoLogin(
		_event: IpcMainInvokeEvent,
		serverPort: number,
		language: string = "zh",
	): Promise<{ success: boolean; error?: string }> {
		try {
			const baseDomain = await providerStorage.get302WebsiteBaseDomain();
			// Use local server as redirect URL with language in path (not query params)
			// 302.AI will append ?apikey=... so we can't have query params in the redirect URL
			const redirectUrl = `http://localhost:${serverPort}/sso/callback/${language}`;
			logger.debug("Using redirect URL:", redirectUrl);

			// Use 'redirecturl' (no underscore) as per 302.AI SSO API
			const params = new URLSearchParams({
				app: "302 AI Studio",
				name: "302 AI Studio",
				icon: "https://file.302.ai/gpt/imgs/5b36b96aaa052387fb3ccec2a063fe1e.png",
				weburl: `${baseDomain}/`,
				redirecturl: redirectUrl,
			});

			const ssoUrl = `${baseDomain}/sso/login?${params.toString()}`;
			logger.debug("Opening SSO URL:", ssoUrl);
			await shell.openExternal(ssoUrl);

			return { success: true };
		} catch (error) {
			logger.error("Failed to open SSO login:", error);
			return { success: false, error: String(error) };
		}
	}

	/**
	 * Handle SSO callback from local server
	 */
	handleSsoCallbackFromServer(apiKey: string) {
		logger.info("Received callback from server with API key");
		if (this.pendingCallback) {
			this.pendingCallback(apiKey);
		} else {
			logger.warn("No pending callback to handle API key");
		}
	}

	/**
	 * Wait for SSO callback with timeout
	 */
	async waitForSsoCallback(
		_event: IpcMainInvokeEvent,
		timeoutMs: number = 300000,
	): Promise<{ success: boolean; apiKey?: string; error?: string }> {
		logger.debug("Waiting for callback, timeout:", timeoutMs);
		return new Promise((resolve) => {
			// Set timeout
			this.callbackTimeout = setTimeout(() => {
				logger.debug("Callback timeout");
				this.pendingCallback = null;
				resolve({ success: false, error: "SSO login timed out" });
			}, timeoutMs);

			// Set callback handler
			this.pendingCallback = (apiKey: string) => {
				logger.debug("Callback handler called with API key");
				if (this.callbackTimeout) {
					clearTimeout(this.callbackTimeout);
					this.callbackTimeout = null;
				}
				this.pendingCallback = null;
				resolve({ success: true, apiKey });
			};
		});
	}

	/**
	 * Cancel pending SSO login
	 */
	cancelSsoLogin(_event: IpcMainInvokeEvent): void {
		logger.info("Canceling SSO login");
		if (this.callbackTimeout) {
			clearTimeout(this.callbackTimeout);
			this.callbackTimeout = null;
		}
		this.pendingCallback = null;
	}
}

export const ssoService = new SsoService();
