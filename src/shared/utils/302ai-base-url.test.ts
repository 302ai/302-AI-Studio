import { describe, expect, it } from "vitest";

import { get302AIBaseUrlWithoutV1, get302AISsoOrigin } from "./302ai-base-url";

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

describe("get302AISsoOrigin", () => {
	it("strips the api. prefix from 302ai.cn", () => {
		expect(get302AISsoOrigin("https://api.302ai.cn/v1")).toBe("https://302ai.cn");
	});

	it("strips the api. prefix from 302ai.com", () => {
		expect(get302AISsoOrigin("https://api.302ai.com")).toBe("https://302ai.com");
	});

	it("strips the api. prefix from 302.ai", () => {
		expect(get302AISsoOrigin("https://api.302.ai/v1/")).toBe("https://302.ai");
	});

	it("falls back to the default origin for custom proxy domains", () => {
		expect(get302AISsoOrigin("https://proxy.example.com")).toBe("https://302ai.com");
	});

	it("falls back to the default origin for invalid URLs", () => {
		expect(get302AISsoOrigin("not-a-url")).toBe("https://302ai.com");
	});
});
