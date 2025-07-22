import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import { extractErrorMessage } from "@main/utils/error-utils";
import {
  type ChatMessage,
  convertMessagesToModelMessages,
} from "@main/utils/message-converter";
import logger from "@shared/logger/main-logger";
import type {
  CreateModelData,
  Message,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import { inject, injectable } from "inversify";
import type { ChatService } from "../chat-service";
import type { ConfigService } from "../config-service";
import { EventNames, emitter, sendToThread } from "../event-service";
import type { SettingsService } from "../settings-service";
import { AI302ProviderService } from "./302AI-provider-service/302AI-provider-service";
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

@ServiceRegister(TYPES.ProviderService)
@injectable()
export class ProviderService {
  private providerMap: Map<string, Provider> = new Map(); // * Cache provider to find provider by id
  private providerInstMap: Map<string, BaseProviderService> = new Map(); // * Cache provider instances to avoid duplicate creation

  constructor(
    @inject(TYPES.ConfigService) private configService: ConfigService,
    @inject(TYPES.ChatService) private chatService: ChatService,
    @inject(TYPES.SettingsService) private settingsService: SettingsService,
  ) {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    const providers = await this.configService.getProviders();
    for (const provider of providers) {
      this.providerMap.set(provider.id, provider);
      if (provider.enabled) {
        try {
          logger.info("init provider", {
            providerId: provider.id,
            providerName: provider.name,
            apiType: provider.apiType,
          });
          const providerInst = this.createProviderInst(provider);
          if (providerInst) {
            this.providerInstMap.set(provider.id, providerInst);
          }
        } catch (error) {
          logger.error("Failed to init provider", {
            providerId: provider.id,
            error,
          });
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
      logger.info("Adding provider to cache", {
        providerId: provider.id,
        providerName: provider.name,
      });

      this.providerMap.set(provider.id, provider);

      if (provider.enabled) {
        const providerInst = this.createProviderInst(provider);
        if (providerInst) {
          this.providerInstMap.set(provider.id, providerInst);
          logger.info("Provider instance created and cached", {
            providerName: provider.name,
          });
        }
      }

      logger.info("Provider added to cache successfully", {
        providerName: provider.name,
      });
    } catch (error) {
      logger.error("Failed to add provider to cache", {
        providerId: provider.id,
        error,
      });
    }
  }

  private handleProviderDeleted(providerId: string) {
    try {
      const provider = this.providerMap.get(providerId);
      const providerName = provider?.name || providerId;

      logger.info("Removing provider from cache", {
        providerId,
        providerName,
      });

      this.providerMap.delete(providerId);
      this.providerInstMap.delete(providerId);

      logger.info("Provider removed from cache successfully", { providerName });
    } catch (error) {
      logger.error("Failed to remove provider from cache", {
        providerId,
        error,
      });
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
      case "302ai":
        return new AI302ProviderService(provider, this.settingsService);

      default:
        logger.warn("Unknown provider type", { apiType: provider.apiType });
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

      logger.debug("checkApiKey", {
        providerName: provider.name,
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
      const is302AI = providerInst instanceof AI302ProviderService;
      if (!is302AI) {
        const newMessages = await convertMessagesToModelMessages(
          params.messages,
          userMessageId,
        );
        params.messages = newMessages as ChatMessage[];
      }

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
        isThinkBlockCollapsed: false,
      });
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "pending",
      });

      // Stream processing for OpenAI SDK
      for await (const chunk of result) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
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
      }

      // Note: OpenAI SDK streaming doesn't provide usage info in real-time
      // Token counting would require a separate call if needed

      if (fullContent === "") {
        await this.chatService.updateMessage(assistantMessage.id, {
          tokenCount: 0,
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
        tokenCount: 0,
        status: "success",
      });
      sendToThread(threadId, EventNames.CHAT_STREAM_STATUS_UPDATE, {
        threadId,
        status: "success",
        userMessageId: userMessageId,
      });

      logger.info("Stream chat completed", { threadId });

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
        logger.info("Stream aborted", { threadId });

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

      logger.error("Stream chat error", { threadId, error });

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
    logger.info("Stream chat stop requested", { threadId, aborted });
    return { success: true };
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async summaryTitle(
    _event: Electron.IpcMainEvent,
    params: {
      messages: { role: string; content: string; id?: string }[];
      provider: Provider;
      model: { id: string; name: string };
    },
  ): Promise<{
    success: boolean;
    text?: string;
    error?: string;
  }> {
    const { messages, provider, model } = params;

    try {
      const providerInst = this.getProviderInst(provider.id);
      if (!providerInst) {
        return {
          success: false,
          error: `Provider instance not found: ${provider.id}`,
        };
      }

      const result = await providerInst.summaryTitle({
        messages: messages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system" | "function",
          content: msg.content,
          id: msg.id,
        })),
        model,
        provider,
      });

      logger.info("Generate text completed", { providerId: provider.id });

      return {
        success: true,
        text: result.text,
      };
    } catch (error) {
      logger.error("Generate text error", { providerId: provider.id, error });

      return {
        success: false,
        error: extractErrorMessage(error),
      };
    }
  }
}
