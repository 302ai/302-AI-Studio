import { describe, expect, it } from "vitest";
import {
	get302AIBaseUrlWithoutV1,
	get302WebsiteBaseDomain,
	get302WebsiteUrl,
} from "./302ai-base-url";

describe("get302AIBaseUrlWithoutV1", () => {
	it("removes a trailing /v1 suffix for non-model 302.AI endpoints", () => {
		expect(get302AIBaseUrlWithoutV1("https://api.302ai.com/v1")).toBe("https://api.302ai.com");
	});

	it("removes a trailing /v1 suffix with a trailing slash", () => {
		expect(get302AIBaseUrlWithoutV1("https://api.302ai.com/v1/")).toBe("https://api.302ai.com");
	});

	it("does not add /v1 when the configured base URL does not include it", () => {
		expect(get302AIBaseUrlWithoutV1("https://proxy.example.com")).toBe(
			"https://proxy.example.com",
		);
	});
});

describe("get302WebsiteBaseDomain and get302WebsiteUrl", () => {
	it("returns https://302.ai only when baseUrl contains 302.ai", () => {
		expect(get302WebsiteBaseDomain("https://api.302.ai/v1")).toBe("https://302.ai");
		expect(get302WebsiteUrl("/dashboard/overview", "https://api.302.ai/v1")).toBe(
			"https://302.ai/dashboard/overview",
		);
		expect(get302WebsiteUrl("/charge", "https://api.302.ai/v1")).toBe("https://302.ai/charge");
	});

	it("returns https://302ai.cn for all other cases (undefined, 302ai.com, 302ai.cn)", () => {
		expect(get302WebsiteBaseDomain()).toBe("https://302ai.cn");
		expect(get302WebsiteBaseDomain("https://api.302ai.com/v1")).toBe("https://302ai.cn");
		expect(get302WebsiteBaseDomain("https://api.302ai.cn/v1")).toBe("https://302ai.cn");

		expect(get302WebsiteUrl("/dashboard/overview")).toBe("https://302ai.cn/dashboard/overview");
		expect(get302WebsiteUrl("/charge", "https://api.302ai.com/v1")).toBe(
			"https://302ai.cn/charge",
		);
		expect(get302WebsiteUrl("/charge", "https://api.302ai.cn/v1")).toBe(
			"https://302ai.cn/charge",
		);
	});

	it("handles path without leading slash", () => {
		expect(get302WebsiteUrl("charge", "https://api.302.ai/v1")).toBe("https://302.ai/charge");
		expect(get302WebsiteUrl("charge", "https://api.302ai.cn")).toBe("https://302ai.cn/charge");
	});
});
