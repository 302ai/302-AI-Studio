export type LayoutMode = "default" | "wide" | "ultra-wide";
export type LanguageCode = "zh" | "en";
export type UpdateChannel = "stable" | "beta";

export interface ProxySettings {
	enabled: boolean;
	host: string;
	port: number;
}

export interface GeneralSettingsState {
	layoutMode: LayoutMode;
	language: LanguageCode;
	privacyAutoInherit: boolean;
	autoUpdate: boolean;
	updateChannel: UpdateChannel;
	proxy: ProxySettings;
	cacheDirectory?: string; // Custom cache directory path, undefined means use default (os.tmpdir())
}

export interface CacheInfo {
	path: string;
	size: number;
	subdirs: {
		temp: { path: string; size: number };
	};
}
