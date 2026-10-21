export const DEFAULT_302AI_BASE_URL = "https://api.302ai.com/v1";

export const DEFAULT_302AI_SSO_ORIGIN = "https://302ai.com";

export function get302AIBaseUrlWithoutV1(baseUrl: string): string {
	return baseUrl.replace(/\/v1\/?$/, "");
}

/**
 * Derive the SSO web origin from an API base URL by stripping the "api." prefix
 * (e.g. https://api.302ai.cn/v1 -> https://302ai.cn). Falls back to the default
 * origin for custom proxy domains that have no 302.AI SSO service.
 */
export function get302AISsoOrigin(baseUrl: string): string {
	try {
		const { host, protocol } = new URL(baseUrl);
		if (host.startsWith("api.")) {
			return `${protocol}//${host.slice(4)}`;
		}
	} catch {
		// invalid URL -> fall through to default
	}
	return DEFAULT_302AI_SSO_ORIGIN;
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
