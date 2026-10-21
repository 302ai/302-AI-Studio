import type { ModelProvider } from "@shared/types";
import {
	DEFAULT_302AI_BASE_URL,
	get302AIBaseUrlWithoutV1,
	get302WebsiteBaseDomain,
	get302WebsiteUrl,
} from "@shared/utils/302ai-base-url";
import { hashApiKey } from "@shared/utils/hash";
import { isNull, isUndefined } from "es-toolkit";
import { StorageService } from "../storage-service";
import { normalizeProviderList } from "./provider-storage-utils";

export class ProviderStorage extends StorageService<ModelProvider[]> {
	constructor() {
		super();
	}

	async validate302AIProvider(): Promise<{
		valid: boolean;
		apiKey: string;
	}> {
		const providersArray = await this.getProviderList();

		const _302AIProvider = providersArray.find((p) => p.apiType === "302ai");
		if (isUndefined(_302AIProvider)) return { valid: false, apiKey: "" };
		if (!_302AIProvider.enabled || _302AIProvider.apiKey.trim() === "")
			return { valid: false, apiKey: "" };

		return {
			valid: true,
			apiKey: _302AIProvider.apiKey,
		};
	}

	async get302AIBaseUrl(): Promise<string> {
		const providersArray = await this.getProviderList();

		const _302AIProvider = providersArray.find((p) => p.apiType === "302ai");
		if (isUndefined(_302AIProvider) || !_302AIProvider.baseUrl.trim()) {
			return DEFAULT_302AI_BASE_URL;
		}

		return _302AIProvider.baseUrl;
	}

	async get302AIBaseUrlWithoutV1(): Promise<string> {
		return get302AIBaseUrlWithoutV1(await this.get302AIBaseUrl());
	}

	async get302WebsiteBaseDomain(): Promise<string> {
		return get302WebsiteBaseDomain(await this.get302AIBaseUrl());
	}

	async get302WebsiteUrl(path: string = ""): Promise<string> {
		return get302WebsiteUrl(path, await this.get302AIBaseUrl());
	}

	/**
	 * Get the current 302.AI provider's API key hash
	 * Used for tracking session association with the logged-in account
	 */
	async get302AIApiKeyHash(): Promise<string | undefined> {
		const providersArray = await this.getProviderList();

		const _302AIProvider = providersArray.find((p) => p.apiType === "302ai");
		if (isUndefined(_302AIProvider) || !_302AIProvider.apiKey) return undefined;

		return hashApiKey(_302AIProvider.apiKey);
	}

	private async getProviderList(): Promise<ModelProvider[]> {
		const allProviders = await this.getItemInternal("app-providers");
		if (isNull(allProviders)) return [];

		return normalizeProviderList(allProviders);
	}
}

export const providerStorage = new ProviderStorage();
