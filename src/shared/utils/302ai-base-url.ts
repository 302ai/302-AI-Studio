export const DEFAULT_302AI_BASE_URL = "https://api.302ai.com/v1";

export function get302AIBaseUrlWithoutV1(baseUrl: string): string {
	return baseUrl.replace(/\/v1\/?$/, "");
}

/**
 * Get 302.AI website base domain (https://302ai.cn or https://302.ai) based on provider baseUrl
 */
export function get302WebsiteBaseDomain(baseUrl?: string): string {
	if (baseUrl?.includes("302.ai")) {
		return "https://302.ai";
	}
	return "https://302ai.cn";
}

/**
 * Build 302.AI website URL with path based on provider baseUrl
 */
export function get302WebsiteUrl(path: string = "", baseUrl?: string): string {
	const domain = get302WebsiteBaseDomain(baseUrl);
	if (!path) return domain;
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${domain}${normalizedPath}`;
}
