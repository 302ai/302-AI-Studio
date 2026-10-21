import { shell, type IpcMainInvokeEvent } from "electron";
import { createLogger } from "@shared/logger";
import { providerStorage } from "../storage-service/provider-storage";

const logger = createLogger("services");

export class ExternalLinkService {
	async openExternalLink(
		_event: IpcMainInvokeEvent,
		url: string,
	): Promise<{
		isOk: boolean;
		error?: string;
	}> {
		try {
			await shell.openExternal(url);
			return { isOk: true };
		} catch (error) {
			logger.error("Failed to open external link:", error);
			return { isOk: false, error: error as string };
		}
	}

	async open302WebsiteLink(
		_event: IpcMainInvokeEvent,
		path: string = "",
	): Promise<{
		isOk: boolean;
		error?: string;
	}> {
		const url = await providerStorage.get302WebsiteUrl(path);
		return this.openExternalLink(_event, url);
	}
}

export const externalLinkService = new ExternalLinkService();
