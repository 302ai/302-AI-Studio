import { browser } from "$app/environment";
import { persistedProviderState } from "$lib/stores/provider-state.svelte";
import { getLocale } from "$lib/paraglide/runtime";
import { DEFAULT_302AI_BASE_URL } from "@shared/utils/302ai-base-url";

export interface SsoResult {
	success: boolean;
	apiKey?: string;
	error?: string;
}

/**
 * Open SSO login in external browser and wait for callback
 */
export async function open302SsoLogin(): Promise<SsoResult> {
	if (!browser || typeof window === "undefined" || !window.electronAPI) {
		return { success: false, error: "Electron API not available" };
	}

	try {
		// Get server port and current language
		const serverPort = window.app?.serverPort ?? 8089;
		const language = getLocale();
		const provider = persistedProviderState.current.find((p) => p.apiType === "302ai");
		const baseUrl = provider?.baseUrl || DEFAULT_302AI_BASE_URL;

		// Open SSO login in external browser with local server callback URL
		const openResult = await window.electronAPI.ssoService.openSsoLogin(
			serverPort,
			language,
			baseUrl,
		);
		if (!openResult.success) {
			return { success: false, error: openResult.error || "Failed to open SSO login" };
		}

		// Wait for SSO callback (5 minutes timeout)
		const callbackResult = await window.electronAPI.ssoService.waitForSsoCallback(300000);
		return callbackResult;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "SSO login failed",
		};
	}
}

/**
 * Cancel pending SSO login
 */
export function cancelSsoLogin(): void {
	if (browser && typeof window !== "undefined" && window.electronAPI) {
		window.electronAPI.ssoService.cancelSsoLogin();
	}
}
