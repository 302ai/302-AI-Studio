import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { CreateModelData, Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import type { BaseProviderService, StreamChatParams } from "./base-provider-service";
import { OpenAIProviderService } from "./openAI-provider-service";

@ServiceRegister("providerService")
export class ProviderService {
  private createProviderInst(
    provider: Provider,
  ): BaseProviderService | undefined {
    switch (provider.apiType) {
      case "openai":
        return new OpenAIProviderService(provider);

      default:
        Logger.warn(`Unknown provider type: ${provider.apiType}`);
        return undefined;
    }
  }

  /**
   * Check API Key and if the condition is "add", set the models to the config service
   *
   * @param _event
   * @param params CheckApiKeyParams
   * @returns The status of the API key check, and the error message if the check fails, and the models if the check is successful (only on "add" condition)
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async checkApiKey(
    _event: Electron.IpcMainEvent,
    provider: Provider,
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    try {
      const providerInst = this.createProviderInst(provider);
      if (!providerInst) {
        return { isOk: false, errorMsg: "Failed to create provider instance" };
      }

      const { isOk, errorMsg } = await providerInst.checkApiKey();

      Logger.debug("checkApiKey (add): ", provider.name, {
        isOk,
        errorMsg,
      });

      return { isOk, errorMsg };
    } catch (error) {
      return { isOk: false, errorMsg: error as string };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async fetchModels(
    _event: Electron.IpcMainEvent,
    provider: Provider,
  ): Promise<CreateModelData[]> {
    const providerInst = this.createProviderInst(provider);
    if (!providerInst) {
      throw new Error(`Provider ${provider.id} not found`);
    }
    return await providerInst.fetchModels();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async startStreamChat(
    _event: Electron.IpcMainEvent,
    params: StreamChatParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const providerInst = this.createProviderInst(params.provider);
      if (!providerInst) {
                return {
          success: false,
          error: "Failed to create provider instance"
        };
      }

      return await providerInst.startStreamChat(params);
    } catch (error) {
      Logger.error("Failed to start stream chat:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async reGenerateStreamChat(
    _event: Electron.IpcMainEvent,
    params: StreamChatParams & { regenerateMessageId: string }
  ): Promise<{ success: boolean; error?: string }> {
    const { regenerateMessageId } = params;
    const providerInst = this.createProviderInst(params.provider);
    if (!providerInst) {
      return { success: false, error: "Failed to create provider instance" };
    }

    return await providerInst.reGenerateStreamChat(params, regenerateMessageId);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async stopStreamChat(
    _event: Electron.IpcMainEvent,
    params: { tabId: string }
  ): Promise<{ success: boolean }> {
    const { tabId } = params;
    // For now, we'll just log this. In a more advanced implementation,
    // we could track active streams and abort them
    Logger.info(`Stream chat stop requested for tab ${tabId}`);
    return { success: true };
  }
}
