import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { extractErrorMessage } from "@main/utils/error-utils";
import type {
  CreateModelData,
  Message,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import type { LanguageModelUsage } from "ai";
import Logger from "electron-log";
import { ChatService } from "../chat-service";
import { ConfigService } from "../config-service";
import { EventNames, emitter, sendToThread } from "../event-service";
import type {
  BaseProviderService,
  StreamChatParams,
} from "./base-provider-service";
import { OpenAIProviderService } from "./openAI-provider-service";
import {
  abortStream,
  cleanupAbortController,
  createAbortController,
} from "./stream-manager";

@ServiceRegister("providerService")
export class ProviderService {
  private configService: ConfigService;
  private chatService: ChatService;
  private providerMap: Map<string, Provider> = new Map(); // * Cache provider to find provider by id
  private providerInstMap: Map<string, BaseProviderService> = new Map(); // * Cache provider instances to avoid duplicate creation

  constructor() {
    this.configService = new ConfigService();
    this.chatService = new ChatService();

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
    emitter.on(EventNames.PROVIDER_UPDATE, ({ providerId, updateData }) => {
      this.handleProviderUpdated(providerId, updateData);
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

  private handleProviderUpdated(
    providerId: string,
    updateData: UpdateProviderData,
  ) {
    const provider = this.providerMap.get(providerId);
    if (!provider) {
      return;
    }

    this.providerMap.set(providerId, {
      ...provider,
      ...updateData,
    });

    const providerInst = this.getProviderInst(providerId);
    if (providerInst) {
      providerInst.updateProvider(updateData);
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
    const { threadId, userMessageId, provider, model } = params;

    let fullContent = "";
    let assistantMessage: Message | null = null;

    try {
      const providerInst = this.getProviderInst(provider.id);
      const abortController = createAbortController(threadId);

      const result = await providerInst.startStreamChat(
        params,
        abortController,
      );

      assistantMessage = await this.chatService.createAssistantMessage({
        threadId,
        content: "",
        providerId: provider.id,
        parentMessageId: userMessageId,
        modelId: model.id,
        modelName: model.name,
      });
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "pending",
      });

      for await (const delta of result.textStream) {
        fullContent += delta;

        await this.chatService.updateMessage(assistantMessage.id, {
          content: fullContent,
        });
        sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
          threadId,
          status: "pending",
          delta: delta,
        });
      }

      let usage: LanguageModelUsage | null = null;

      if (fullContent !== "") {
        usage = await result.usage;
      }

      if (fullContent === "") {
        await this.chatService.updateMessage(assistantMessage.id, {
          tokenCount: usage?.outputTokens ?? 0,
          status: "error",
        });
        sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
          threadId,
          status: "error",
          userMessageId: userMessageId,
        });
        return {
          success: false,
          error: "No content received from provider",
        };
      }

      await this.chatService.updateMessage(assistantMessage.id, {
        tokenCount: usage?.outputTokens ?? 0,
        status: "success",
      });
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "success",
        userMessageId: userMessageId,
      });

      Logger.info(`Stream chat completed for thread ${threadId}`);

      return {
        success: true,
      };
    } catch (error) {
      if (!assistantMessage) {
        return {
          success: false,
          error: extractErrorMessage(error),
        };
      }

      if (error instanceof Error && error.name === "AbortError") {
        Logger.info(`Stream aborted for thread ${threadId}`);

        await this.chatService.updateMessage(assistantMessage.id, {
          status: "stop",
        });
        sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
          threadId,
          status: "stop",
          userMessageId: userMessageId,
        });
        return { success: true };
      }

      Logger.error(`Stream chat error for thread ${threadId}:`, error);

      await this.chatService.updateMessage(assistantMessage.id, {
        status: "error",
      });
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "error",
        userMessageId: userMessageId,
      });

      return {
        success: false,
        error: extractErrorMessage(error),
      };
    } finally {
      cleanupAbortController(threadId);
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async stopStreamChat(
    _event: Electron.IpcMainEvent,
    params: { threadId: string },
  ): Promise<{ success: boolean }> {
    const { threadId } = params;
    const aborted = abortStream(threadId);
    Logger.info(
      `Stream chat stop requested for thread ${threadId}. Active stream aborted: ${aborted}`,
    );
    return { success: true };
  }
}
