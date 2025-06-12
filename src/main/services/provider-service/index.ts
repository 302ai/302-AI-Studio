import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { extractErrorMessage } from "@main/utils/error-utils";
import type { CreateModelData, Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import { ConfigService } from "../config-service";
import { EventNames, emitter } from "../event-service";
import type {
  BaseProviderService,
  StreamChatParams,
} from "./base-provider-service";
import { OpenAIProviderService } from "./openAI-provider-service";

@ServiceRegister("providerService")
export class ProviderService {
  private configService: ConfigService;
  private providerMap: Map<string, Provider> = new Map(); // * Cache provider to find provider by id
  private providerInstMap: Map<string, BaseProviderService> = new Map(); // * Cache provider instances to avoid duplicate creation

  constructor() {
    this.configService = new ConfigService();
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    const providers = await this.configService.getProviders();
    for (const provider of providers) {
      this.providerMap.set(provider.id, provider);
      if (provider.enabled) {
        try {
          Logger.info(
            `init provider: id=${provider.id} name=${provider.name}, type=${provider.apiType}`,
          );
          const providerInst = this.createProviderInst(provider);
          if (providerInst) {
            this.providerInstMap.set(provider.id, providerInst);
          }
        } catch (error) {
          Logger.error(`Failed to init provider: ${provider.id}`, error);
        }
      }
    }
  }

  private setupEventListeners() {
    emitter.on(EventNames.PROVIDER_ADD, ({ provider }) => {
      this.handleProviderAdded(provider);
    });
    emitter.on(EventNames.PROVIDER_DELETE, ({ providerId }) => {
      this.handleProviderDeleted(providerId);
    });
  }

  private handleProviderAdded(provider: Provider) {
    try {
      Logger.info(
        `Adding provider to cache: id=${provider.id} name=${provider.name}`,
      );

      this.providerMap.set(provider.id, provider);

      if (provider.enabled) {
        const providerInst = this.createProviderInst(provider);
        if (providerInst) {
          this.providerInstMap.set(provider.id, providerInst);
          Logger.info(`Provider instance created and cached: ${provider.name}`);
        }
      }

      Logger.info(`Provider added to cache successfully: ${provider.name}`);
    } catch (error) {
      Logger.error(`Failed to add provider to cache: ${provider.id}`, error);
    }
  }

  private handleProviderDeleted(providerId: string) {
    try {
      const provider = this.providerMap.get(providerId);
      const providerName = provider?.name || providerId;

      Logger.info(
        `Removing provider from cache: id=${providerId} name=${providerName}`,
      );

      this.providerMap.delete(providerId);
      this.providerInstMap.delete(providerId);

      Logger.info(`Provider removed from cache successfully: ${providerName}`);
    } catch (error) {
      Logger.error(
        `Failed to remove provider from cache: ${providerId}`,
        error,
      );
    }
  }

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

  private getProviderInst(providerId: string): BaseProviderService {
    let providerInst = this.providerInstMap.get(providerId);
    if (!providerInst) {
      const provider = this.getProviderById(providerId);
      providerInst = this.createProviderInst(provider);
      if (!providerInst) {
        throw new Error(`Failed to create provider instance: ${providerId}`);
      }
      this.providerInstMap.set(providerId, providerInst);
    }
    return providerInst;
  }

  private getProviderById(providerId: string): Provider {
    const provider = this.providerMap.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider;
  }

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
        return {
          isOk: false,
          errorMsg: `Unsupported provider type: ${provider.apiType}`,
        };
      }

      const { isOk, errorMsg } = await providerInst.checkApiKey();

      Logger.debug("checkApiKey: ", provider.name, {
        isOk,
        errorMsg,
      });

      return { isOk, errorMsg };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return { isOk: false, errorMsg: errorMessage };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async fetchModels(
    _event: Electron.IpcMainEvent,
    provider: Provider,
  ): Promise<CreateModelData[]> {
    const providerInst = this.getProviderInst(provider.id);
    return await providerInst.fetchModels();
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async startStreamChat(
    _event: Electron.IpcMainEvent,
    params: StreamChatParams,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const providerInst = this.getProviderInst(params.provider.id);

      return await providerInst.startStreamChat(params);
    } catch (error) {
      Logger.error("Failed to start stream chat:", error);
      return {
        success: false,
        error: extractErrorMessage(error),
      };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async reGenerateStreamChat(
    _event: Electron.IpcMainEvent,
    params: StreamChatParams & { regenerateMessageId: string },
  ): Promise<{ success: boolean; error?: string }> {
    const { regenerateMessageId } = params;
    const providerInst = this.getProviderInst(params.provider.id);

    return await providerInst.reGenerateStreamChat(params, regenerateMessageId);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async stopStreamChat(
    _event: Electron.IpcMainEvent,
    params: { tabId: string },
  ): Promise<{ success: boolean }> {
    const { tabId } = params;
    // For now, we'll just log this. In a more advanced implementation,
    // we could track active streams and abort them
    Logger.info(`Stream chat stop requested for tab ${tabId}`);
    return { success: true };
  }
}
