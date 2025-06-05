import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { CreateModelData, Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import type { BaseProviderService } from "./base-provider-service";
import { OpenAIProviderService } from "./openAI-provider-service";

export type CheckApiKeyParams =
  | {
      condition: "add";
      providerCfg: Provider;
    }
  | {
      condition: "edit";
      providerId: string;
      providerCfg: Pick<
      Provider,
        "name" | "baseUrl" | "apiKey" | "apiType"
      >;
    };

@ServiceRegister("providerService")
export class ProviderService {
  private providerMap: Map<string, Provider> = new Map();
  private providerInstMap: Map<string, BaseProviderService> = new Map();

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
    params: CheckApiKeyParams,
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    if (params.condition === "add") {
      const providerInst = this.createProviderInst(params.providerCfg);
      if (!providerInst) {
        return { isOk: false, errorMsg: "Failed to create provider instance" };
      }

      const { isOk, errorMsg } = await providerInst.checkApiKey();

      Logger.debug("checkApiKey (add): ", params.providerCfg.name, {
        isOk,
        errorMsg,
      });

      return { isOk, errorMsg };
    }

    if (params.condition === "edit") {
      try {
        const originalProvider = this.getProviderById(params.providerId);
        const tempProvider: Provider = {
          ...originalProvider,
          ...params.providerCfg,
        };
        const tempProviderInst = this.createProviderInst(tempProvider);
        if (!tempProviderInst) {
          return {
            isOk: false,
            errorMsg: "Failed to create provider instance",
          };
        }

        const { isOk, errorMsg } = await tempProviderInst.checkApiKey();

        Logger.debug("checkApiKey (edit): ", tempProvider.name, {
          isOk,
          errorMsg,
        });

        return { isOk, errorMsg };
      } catch (error) {
        return {
          isOk: false,
          errorMsg: `Failed to get provider instance: ${error}`,
        };
      }
    }

    return { isOk: false, errorMsg: "Invalid condition" };
  }

  getProviderById(id: string): Provider {
    const provider = this.providerMap.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }
    return provider;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  updateProviderConfig(
    _event: Electron.IpcMainEvent,
    providerId: string,
    updates: Partial<Provider>,
  ): void {
    const provider = this.providerMap.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const updatedProvider = { ...provider, ...updates };
    this.providerMap.set(providerId, updatedProvider);

    if (updatedProvider.enabled) {
      const newInstance = this.createProviderInst(updatedProvider);
      if (newInstance) {
        this.providerInstMap.set(providerId, newInstance);
        Logger.info("Provider instance updated:", updatedProvider.name);
      }
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
