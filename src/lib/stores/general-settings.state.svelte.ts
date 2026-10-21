import { PersistedState } from "$lib/hooks/persisted-state.svelte";
import { createLogger } from "@shared/logger";

const logger = createLogger("state");
import { applyLocale } from "$lib/i18n";
import { getLocale } from "$lib/paraglide/runtime";
import type {
	CacheInfo,
	GeneralSettingsState,
	LanguageCode,
	LayoutMode,
	ProxySettings,
	UpdateChannel,
} from "@shared/storage/general-settings";

const { generalSettingsService } = window.electronAPI;

const getDefaults = (): GeneralSettingsState => ({
	layoutMode: "default",
	language: (getLocale() as LanguageCode) ?? "zh",
	privacyAutoInherit: false,
	autoUpdate: false,
	updateChannel: "stable",
	proxy: {
		enabled: false,
		host: "",
		port: 8080,
	},
});

const persistedGeneralSettings = new PersistedState<GeneralSettingsState>(
	"GeneralSettingsStorage:state",
	getDefaults(),
);

function applyLayout(mode: LayoutMode): void {
	const el = document.documentElement;
	el.dataset.layout = mode;
}

$effect.root(() => {
	$effect(() => {
		const { language, layoutMode } = persistedGeneralSettings.current;
		try {
			if (getLocale() !== language) {
				applyLocale(language as "zh" | "en");
			}
		} catch (error) {
			logger.error("Failed to set locale:", error);
		}

		applyLayout(layoutMode);
	});
});

class GeneralSettingsManager {
	get state(): GeneralSettingsState {
		return persistedGeneralSettings.current;
	}

	get layoutMode(): LayoutMode {
		return persistedGeneralSettings.current.layoutMode;
	}

	setLayoutMode(mode: LayoutMode): void {
		persistedGeneralSettings.current = {
			...persistedGeneralSettings.current,
			layoutMode: mode,
		};
	}

	get language(): LanguageCode {
		return persistedGeneralSettings.current.language;
	}

	setLanguage(lang: LanguageCode): void {
		if (persistedGeneralSettings.current.language === lang) return;

		persistedGeneralSettings.current = { ...persistedGeneralSettings.current, language: lang };

		generalSettingsService.handleLanguageChanged(lang);

		applyLocale(lang as "zh" | "en");
	}

	get privacyAutoInherit(): boolean {
		return persistedGeneralSettings.current.privacyAutoInherit;
	}

	setPrivacyAutoInherit(value: boolean): void {
		persistedGeneralSettings.current = {
			...persistedGeneralSettings.current,
			privacyAutoInherit: value,
		};
	}

	get autoUpdate(): boolean {
		return persistedGeneralSettings.current.autoUpdate;
	}

	setAutoUpdate(value: boolean): void {
		persistedGeneralSettings.current = {
			...persistedGeneralSettings.current,
			autoUpdate: value,
		};
		// Notify main process to enable/disable auto-check
		window.electronAPI.updaterService.setAutoUpdate(value);
	}

	get updateChannel(): UpdateChannel {
		return persistedGeneralSettings.current.updateChannel ?? "stable";
	}

	setUpdateChannel(channel: UpdateChannel): void {
		persistedGeneralSettings.current = {
			...persistedGeneralSettings.current,
			updateChannel: channel,
		};
		// Notify main process to change update channel
		window.electronAPI.updaterService.setUpdateChannel(channel);
	}

	get proxy(): ProxySettings {
		return (
			persistedGeneralSettings.current.proxy ?? {
				enabled: false,
				host: "",
				port: 8080,
			}
		);
	}

	setProxy(proxy: ProxySettings): void {
		persistedGeneralSettings.current = {
			...persistedGeneralSettings.current,
			proxy,
		};
		// Notify main process to apply proxy settings
		generalSettingsService.handleProxyChanged(proxy);
	}

	get proxyEnabled(): boolean {
		return persistedGeneralSettings.current.proxy?.enabled ?? false;
	}

	setProxyEnabled(enabled: boolean): void {
		const currentProxy = this.proxy;
		this.setProxy({ ...currentProxy, enabled });
	}

	get cacheDirectory(): string | undefined {
		return persistedGeneralSettings.current.cacheDirectory;
	}

	async setCacheDirectory(path: string): Promise<{ success: boolean; error?: string }> {
		const result = await generalSettingsService.setCacheDirectory(path);
		if (result.success) {
			persistedGeneralSettings.current = {
				...persistedGeneralSettings.current,
				cacheDirectory: path,
			};
		}
		return result;
	}

	async getCacheInfo(): Promise<CacheInfo> {
		return await generalSettingsService.getCacheInfo();
	}

	async clearCache(): Promise<void> {
		await generalSettingsService.clearCache();
	}

	async resetCacheToDefault(): Promise<void> {
		await generalSettingsService.resetCacheToDefault();
		persistedGeneralSettings.current = {
			...persistedGeneralSettings.current,
			cacheDirectory: undefined,
		};
	}

	async selectCacheDirectory(): Promise<string | null> {
		return await generalSettingsService.selectCacheDirectory();
	}

	update(partial: Partial<GeneralSettingsState>): void {
		persistedGeneralSettings.current = { ...persistedGeneralSettings.current, ...partial };
	}
}

export const generalSettings = new GeneralSettingsManager();
