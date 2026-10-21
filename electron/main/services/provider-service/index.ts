import type { IpcMainInvokeEvent } from "electron";
import { emitter } from "../broadcast-service";
import { providerStorage } from "../storage-service/provider-storage";

export class ProviderService {
	async handle302AIProviderChange(_event: IpcMainInvokeEvent, apiKey: string) {
		emitter.emit("provider:302ai-provider-changed", { apiKey });
	}

	async get302AIApiKey(_event: IpcMainInvokeEvent): Promise<string> {
		const { valid, apiKey } = await providerStorage.validate302AIProvider();
		if (!valid) {
			throw new Error("302.ai API key validation failed");
		}
		return apiKey;
	}

	async get302AIBaseUrl(_event: IpcMainInvokeEvent): Promise<string> {
		return await providerStorage.get302AIBaseUrl();
	}

	async get302AIBaseUrlWithoutV1(_event: IpcMainInvokeEvent): Promise<string> {
		return await providerStorage.get302AIBaseUrlWithoutV1();
	}

	async get302WebsiteBaseDomain(_event: IpcMainInvokeEvent): Promise<string> {
		return await providerStorage.get302WebsiteBaseDomain();
	}

	async get302WebsiteUrl(_event: IpcMainInvokeEvent, path: string = ""): Promise<string> {
		return await providerStorage.get302WebsiteUrl(path);
	}
}

export const providerService = new ProviderService();
