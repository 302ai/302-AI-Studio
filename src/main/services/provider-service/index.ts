import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { CreateModelData, Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import type { BaseProviderService } from "./base-provider-service";
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
}
